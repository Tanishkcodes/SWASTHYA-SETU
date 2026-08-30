import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { db } from '../lib/db';
import SwasthyaLogo from '../components/SwasthyaLogo';
import CommunitiesTab from '../components/CommunitiesTab';
import HelpSupportTab from '../components/HelpSupportTab';
import {
  Activity,
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  Copy,
  Download,
  Eye,
  EyeOff,
  File,
  FileText,
  Headphones,
  HelpCircle,
  Image,
  Leaf,
  Lock,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
  User,
  UsersRound,
  X,
} from 'lucide-react';
import '../styles/doctor-portal.css';
import '../styles/doctor-sidebar.css';

const txt = v => (typeof v === 'string' ? v : v ? JSON.stringify(v) : '');
const initials = n =>
  String(n || 'Doctor')
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map(x => x[0])
    .join('')
    .toUpperCase();
const today = () => new Date().toISOString().slice(0, 10);
const date = v =>
  v
    ? new Date(`${v}T00:00:00`).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

/**
 * Format reason for visit: outputs ONLY ONE top disease / condition name
 */
function formatReasonForVisit(reason) {
  if (!reason || typeof reason !== 'string') return 'General Checkup';
  let str = reason.trim();
  if (!str) return 'General Checkup';

  // Strip descriptive temporal phrases
  str = str.replace(/\s+(since|for the past|from last|for last|for|since last)\s+.*/i, '');

  // Take first sentence or item before punctuation
  const firstPart = str.split(/[.\n;,]/)[0].trim();
  if (firstPart) str = firstPart;

  // Specific disease / symptom categorization for clean display
  if (/stomach|acidity|gastric|acid|bloat|abdom/i.test(str)) {
    if (/recurrent/i.test(str) || /pain/i.test(str)) return 'Recurrent stomach pain';
    return 'Acidity & Gastritis';
  }
  if (/headache|dizz|migraine/i.test(str)) {
    return 'Headache & Dizziness';
  }
  if (/fever|body ache|chills|cold|flu/i.test(str)) {
    return 'Fever & Body Ache';
  }
  if (/bp|hypertension|blood pressure/i.test(str)) {
    return 'BP Follow-up';
  }
  if (/diabet|sugar|glucose/i.test(str)) {
    return 'Diabetes Follow-up';
  }
  if (/thyroid|tsh/i.test(str)) {
    return 'Thyroid Consultation';
  }
  if (/allergy|rash|itching|skin|dermat/i.test(str)) {
    return 'Skin Allergy';
  }
  if (/knee|joint|arthrit|back pain/i.test(str)) {
    return 'Knee Pain';
  }
  if (/chest|breath|cough|lung|pulmo/i.test(str)) {
    return 'Respiratory Consultation';
  }
  if (/eye|vision|cataract/i.test(str)) {
    return 'Eye Examination';
  }
  if (/ent|throat|ear|nose/i.test(str)) {
    return 'ENT Consultation';
  }

  // Capitalize cleanly
  str = str.charAt(0).toUpperCase() + str.slice(1);
  if (str.length > 28) {
    const cut = str.substring(0, 26);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 10 ? cut.substring(0, lastSpace) : cut) + '...';
  }
  return str;
}

/**
 * Format Age / Gender (e.g. 28 Y / F, 32 Y / M)
 */
function formatAgeGender(age, gender) {
  const a = age ? `${age} Y` : '—';
  let g = '—';
  if (gender) {
    const gl = String(gender).trim().toLowerCase();
    if (gl.startsWith('f')) g = 'F';
    else if (gl.startsWith('m')) g = 'M';
    else g = gender.charAt(0).toUpperCase();
  }
  return `${a} / ${g}`;
}

/**
 * Sidebar Component with smooth Hamburger in/out
 * - When out (expanded): Logo icon visible on left, Hamburger on right, NO website name text
 * - When in (collapsed): NO logo visible, ONLY Hamburger centered
 */
function Sidebar({ activeTab, onSelectTab, logout }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed(value => !value);

  return (
    <aside className={`dp-side ${collapsed ? 'collapsed' : ''}`}>
      <div className="dp-brand">
        <div className="dp-brand-logo">
          <SwasthyaLogo size={42} />
        </div>
        <button
          type="button"
          className="dp-hamburger"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu />
        </button>
      </div>

      <div className="dp-side-title">Doctor Portal</div>

      <nav>
        <button
          className={`dp-nav-btn ${activeTab === 'appointments' ? 'on' : ''}`}
          onClick={() => onSelectTab('appointments')}
          title="Appointments"
        >
          <CalendarCheck />
          <span>Appointments</span>
        </button>
        <button
          className={`dp-nav-btn ${activeTab === 'communities' ? 'on' : ''}`}
          onClick={() => onSelectTab('communities')}
          title="Communities"
        >
          <UsersRound />
          <span>Communities</span>
        </button>
        <button
          className={`dp-nav-btn ${activeTab === 'help' ? 'on' : ''}`}
          onClick={() => onSelectTab('help')}
          title="Help & Support"
        >
          <Headphones />
          <span>Help & Support</span>
        </button>
      </nav>

      <button className="dp-out" onClick={logout} title="Logout">
        <LogOut />
        <span>Logout</span>
      </button>
    </aside>
  );
}

const DOCTOR_DIRECTORY_AVATARS = {
  'dr. ananya sharma': 'https://randomuser.me/api/portraits/women/44.jpg',
  'dr. priya verma': 'https://randomuser.me/api/portraits/women/65.jpg',
  'dr. rohan mehta': 'https://randomuser.me/api/portraits/men/32.jpg',
  'dr. neha agarwal': 'https://randomuser.me/api/portraits/women/68.jpg',
  'dr. amit singh': 'https://randomuser.me/api/portraits/men/46.jpg',
  'vaidya r. mehta': 'https://randomuser.me/api/portraits/men/52.jpg',
  'vaidya sanjeev sharma': 'https://randomuser.me/api/portraits/men/61.jpg',
  'dr. randeep guleria': 'https://randomuser.me/api/portraits/men/11.jpg',
  'dr. vikramaditya rathore': 'https://randomuser.me/api/portraits/men/18.jpg',
  'dr. naresh trehan': 'https://randomuser.me/api/portraits/men/24.jpg',
  'dr. arjun mehta': 'https://randomuser.me/api/portraits/men/35.jpg',
  'dr. rajesh verma': 'https://randomuser.me/api/portraits/men/43.jpg',
  'dr. neha gupta': 'https://randomuser.me/api/portraits/women/12.jpg',
  'dr. gayatri joshi': 'https://randomuser.me/api/portraits/women/28.jpg',
  'dr. devi shetty': 'https://randomuser.me/api/portraits/men/57.jpg',
};

const getDoctorAvatar = name => {
  const normalized = String(name || 'dr. ananya sharma').toLowerCase().trim();
  if (DOCTOR_DIRECTORY_AVATARS[normalized]) return DOCTOR_DIRECTORY_AVATARS[normalized];
  const femaleName = /\b(ananya|priya|neha|anjali|pooja|sunita|kavita|gayatri)\b/.test(normalized);
  const hash = Array.from(normalized).reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 7);
  const portraitNumber = 10 + (hash % 80);
  return `https://randomuser.me/api/portraits/${femaleName ? 'women' : 'men'}/${portraitNumber}.jpg`;
};

/**
 * Doctor Profile Modal Component
 */
function DoctorProfileModal({ doctor, onClose, onLogout }) {
  const [copied, setCopied] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(
    doctor?.avatar_url || getDoctorAvatar(doctor?.name)
  );
  const fileInputRef = useRef(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwMsg, setPwMsg] = useState({ text: '', type: '' });

  const name = doctor?.name || 'Dr. Ananya Sharma';
  const spec = doctor?.speciality || doctor?.specialty || doctor?.department || 'General Physician';
  const degrees = doctor?.degrees || doctor?.degree || 'MBBS, MD (Internal Medicine)';
  const age = doctor?.age ? `${doctor.age} Years` : '—';
  const gender = doctor?.gender || '—';
  const exp = doctor?.experience ? `${doctor.experience}+ Years` : (doctor?.exp || '—');
  const hospital =
    doctor?.hospitals?.name ||
    doctor?.hospitalName ||
    doctor?.hospital ||
    '—';
  const email = doctor?.email || `${name.toLowerCase().replace(/[^a-z]/g, '')}@swasthyasetu.ac.in`;

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAvatarChange = e => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handlePasswordSubmit = async e => {
    e.preventDefault();
    if (!currentPw) {
      setPwMsg({ text: 'Please enter your current password.', type: 'error' });
      return;
    }
    if (!newPw || newPw.length < 6) {
      setPwMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    const targetUsername =
      doctor?.username ||
      doctor?.email?.split('@')[0] ||
      name.toLowerCase().replace(/[^a-z0-9]/g, '');

    setPwMsg({ text: 'Encrypting and updating password...', type: 'info' });

    const { error } = await db.staff.changePassword({
      username: targetUsername,
      oldPassword: currentPw,
      newPassword: newPw,
    });

    if (error) {
      setPwMsg({
        text: error.message || 'Unable to update password. Please check your current password.',
        type: 'error',
      });
      return;
    }

    setPwMsg({
      text: 'Password updated & encrypted! Use your new password on your next login.',
      type: 'success',
    });
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setTimeout(() => {
      setPwMsg({ text: '', type: '' });
      setShowPasswordForm(false);
    }, 2500);
  };

  return (
    <div className="dp-profile-card">
      <button
        type="button"
        className="dp-profile-close-btn"
        onClick={onClose}
        title="Close Profile"
      >
        <X size={16} />
      </button>

      <div className="dp-profile-header">
        <div className="dp-profile-avatar-wrap">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="dp-profile-avatar-img" />
          ) : (
            <div className="dp-profile-avatar-img">{initials(name)}</div>
          )}
          <button
            type="button"
            className="dp-profile-edit-badge"
            onClick={() => fileInputRef.current?.click()}
            title="Change photo"
          >
            <Pencil size={12} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        <h3 className="dp-profile-name">{name}</h3>
        <div className="dp-profile-spec">{spec}</div>
        <div className="dp-profile-degrees">{degrees}</div>
      </div>

      <div className="dp-profile-list">
        <div className="dp-profile-item">
          <span className="dp-profile-item-left">
            <CalendarDays size={15} /> Age
          </span>
          <span className="dp-profile-item-val">{age}</span>
        </div>
        <div className="dp-profile-item">
          <span className="dp-profile-item-left">
            <User size={15} /> Gender
          </span>
          <span className="dp-profile-item-val">{gender}</span>
        </div>
        <div className="dp-profile-item">
          <span className="dp-profile-item-left">
            <Stethoscope size={15} /> Specialization
          </span>
          <span className="dp-profile-item-val">{spec}</span>
        </div>
        <div className="dp-profile-item">
          <span className="dp-profile-item-left">
            <Briefcase size={15} /> Experience
          </span>
          <span className="dp-profile-item-val">{exp}</span>
        </div>
        <div className="dp-profile-item">
          <span className="dp-profile-item-left">
            <Building2 size={15} /> Affiliated Hospital
          </span>
          <span className="dp-profile-item-val" title={hospital}>
            {hospital}
          </span>
        </div>
      </div>

      <div className="dp-profile-email-sec">
        <label>Username / Email ID</label>
        <div className="dp-profile-email-row">
          <Mail size={15} color="#64748b" />
          <span className="dp-profile-email-txt" title={email}>
            {email}
          </span>
          <button
            type="button"
            className="dp-profile-copy-btn"
            onClick={handleCopyEmail}
            title={copied ? 'Copied!' : 'Copy Email'}
          >
            {copied ? <Check size={14} color="#087d43" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="dp-profile-accordion-btn"
        onClick={() => setShowPasswordForm(!showPasswordForm)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={15} /> Change Password
        </span>
        {showPasswordForm ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
      </button>

      {showPasswordForm && (
        <form className="dp-profile-pw-form" onSubmit={handlePasswordSubmit}>
          <div className="dp-profile-input-wrap">
            <label>Current Password</label>
            <div className="dp-profile-input-inner">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder="••••••••••••"
                required
              />
              <button
                type="button"
                className="dp-profile-eye-btn"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="dp-profile-input-wrap">
            <label>New Password</label>
            <div className="dp-profile-input-inner">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="••••••••••••"
                required
              />
              <button
                type="button"
                className="dp-profile-eye-btn"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="dp-profile-input-wrap">
            <label>Confirm New Password</label>
            <div className="dp-profile-input-inner">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="••••••••••••"
                required
              />
              <button
                type="button"
                className="dp-profile-eye-btn"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {pwMsg.text && (
            <div
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: pwMsg.type === 'error' ? '#dc2626' : '#087d43',
                textAlign: 'center',
                marginTop: '4px',
              }}
            >
              {pwMsg.text}
            </div>
          )}

          <button type="submit" className="dp-profile-pw-submit">
            Change Password
          </button>
        </form>
      )}

      <button type="button" className="dp-profile-logout-btn" onClick={onLogout}>
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </div>
  );
}

/**
 * Top Header Component
 */
function Top({ doctor, onLogout }) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="dp-top">
      {/* Notification Bell with Badge */}
      <button type="button" className="dp-bell-btn" title="Notifications">
        <span className="dp-bell-badge">2</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </button>

      {/* Doctor Profile Chip */}
      <div
        className="dp-doc"
        onClick={() => setShowProfile(!showProfile)}
        role="button"
        tabIndex={0}
      >
        <div className="dp-doc-avatar">
          {doctor?.avatar_url ? (
            <img src={doctor.avatar_url} alt="" />
          ) : (
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=256"
              alt=""
            />
          )}
        </div>
        <div className="dp-doc-info">
          <b>{doctor?.name || 'Dr. Ananya Sharma'}</b>
          <small>{doctor?.speciality || doctor?.department || 'General Physician'}</small>
        </div>
        {showProfile ? (
          <X size={14} className="dp-doc-chevron" />
        ) : (
          <ChevronDown size={14} className="dp-doc-chevron" />
        )}
      </div>

      {showProfile && (
        <DoctorProfileModal
          doctor={doctor}
          onClose={() => setShowProfile(false)}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}

/**
 * 3 Metrics Cards Component
 */
function Metrics({ rows }) {
  const done = rows.filter(x => x.status === 'completed').length;
  const up = rows.filter(x => ['confirmed', 'upcoming'].includes(x.status)).length;
  const wait = rows.filter(x => ['waiting', 'in_consultation', 'in_queue'].includes(x.status)).length;
  const next = rows.find(x => ['confirmed', 'upcoming'].includes(x.status));

  return (
    <div className="dp-metrics">
      {/* Green Card: Total Appointments Today */}
      <article className="dp-metric-card g">
        <div className="dp-metric-icon">
          <CalendarCheck size={28} />
        </div>
        <div className="dp-metric-content">
          <div className="dp-metric-num">{rows.length}</div>
          <div className="dp-metric-title">Total Appointments Today</div>
          <div className="dp-metric-sub">{done} Completed</div>
        </div>
      </article>

      {/* Blue Card: Upcoming Appointments */}
      <article className="dp-metric-card b">
        <div className="dp-metric-icon">
          <UsersRound size={28} />
        </div>
        <div className="dp-metric-content">
          <div className="dp-metric-num">{up}</div>
          <div className="dp-metric-title">Upcoming Appointments</div>
          <div className="dp-metric-sub">
            {next ? `Next: ${next.time}` : 'No upcoming appointment'}
          </div>
        </div>
      </article>

      {/* Orange Card: Patients Waiting */}
      <article className="dp-metric-card o">
        <div className="dp-metric-icon">
          <Clock3 size={28} />
        </div>
        <div className="dp-metric-content">
          <div className="dp-metric-num">{wait}</div>
          <div className="dp-metric-title">Patients Waiting</div>
          <div className="dp-metric-sub">In Queue</div>
        </div>
      </article>
    </div>
  );
}

/**
 * Today's Schedule Table Component
 */
function Schedule({ rows, selected, choose }) {
  return (
    <section className="dp-schedule">
      <header className="dp-schedule-header">
        <h3>Today's Schedule</h3>
        <button type="button" className="dp-view-all-btn">
          <CalendarCheck size={16} />
          View Full Schedule
        </button>
      </header>

      <div className="dp-th">
        <span>Time</span>
        <span>Patient</span>
        <span>Age / Gender</span>
        <span>Reason for Visit</span>
        <span>Status</span>
        <span style={{ textAlign: 'right' }}>Action</span>
      </div>

      {rows.map(x => {
        const isSel = selected?.id === x.id;
        const cleanReason = formatReasonForVisit(x.reason);
        const ageGender = formatAgeGender(x.age, x.gender);
        const statusClass = String(x.status || 'upcoming').toLowerCase();
        const displayStatus =
          statusClass === 'completed'
            ? 'Completed'
            : statusClass === 'in_consultation'
            ? 'In Consultation'
            : statusClass === 'waiting'
            ? 'In Queue'
            : 'Upcoming';

        const dotClass =
          statusClass === 'completed'
            ? 'completed'
            : statusClass === 'in_consultation' || statusClass === 'waiting'
            ? 'waiting'
            : 'upcoming';

        return (
          <div className={`dp-tr ${isSel ? 'sel' : ''}`} key={x.id}>
            <span className="dp-tr-time">{x.time || '—'}</span>
            <span className="dp-tr-patient">
              <span className={`dp-status-dot ${dotClass}`} />
              <b>{x.name}</b>
            </span>
            <span className="dp-tr-meta">{ageGender}</span>
            <span className="dp-tr-reason" title={cleanReason}>
              {cleanReason}
            </span>
            <span>
              <em className={`dp-badge ${statusClass}`}>{displayStatus}</em>
            </span>
            <span style={{ textAlign: 'right' }}>
              <button
                type="button"
                className="dp-btn-action"
                onClick={() => choose(x)}
              >
                View
              </button>
            </span>
          </div>
        );
      })}

      {!rows.length && (
        <div className="dp-empty">
          <Clock3 size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <div>No appointments are scheduled for today.</div>
        </div>
      )}
    </section>
  );
}

/**
 * Patient Details Drawer Component
 */
function Drawer({ p, intake, reports = [], close, start }) {
  const h = intake?.history || {};
  const s = intake?.clinical_summary || {};
  const hasAbha = Boolean(p.abhaId || p.abha_id);
  const bloodGroup = s.bloodGroup || h.bloodGroup || p.bloodGroup || p.blood_group || null;

  return (
    <aside className="dp-drawer">
      <header>
        <h3>Patient Details</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <X onClick={close} style={{ cursor: 'pointer', color: '#64748b' }} />
        </div>
      </header>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-10px' }}>
        <span
          style={{
            background: '#eef5ff',
            color: '#0878f9',
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 8px',
            borderRadius: '6px',
          }}
        >
          {p.status === 'completed' ? 'Completed Appointment' : 'Scheduled Appointment'}
        </span>
      </div>
      <div className="dp-person" style={{ paddingTop: '0' }}>
        <i>{initials(p.name)}</i>
        <div>
          <h2>{p.name}</h2>
          <p>
            {p.age ? `${p.age} Years` : '—'} / {p.gender || '—'}
          </p>
          {hasAbha ? (
            <small style={{ color: '#087d43', fontWeight: '600' }}>✓ ABHA Linked</small>
          ) : (
            <small style={{ color: '#64748b', fontWeight: '500' }}>Phone Verified</small>
          )}
        </div>
      </div>
      <div className="dp-block">
        <Clock3 color="#64748b" />
        <span>
          <small>Appointment Time</small>
          <b>
            {p.time || '—'}, {date(p.date)}
          </b>
        </span>
        <em
          style={{
            background: '#eaf3ff',
            color: '#0878f9',
            padding: '6px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            fontStyle: 'normal',
          }}
        >
          {p.status || 'Upcoming'}
        </em>
      </div>
      <div className="dp-block" style={{ marginTop: 0 }}>
        <FileText color="#64748b" />
        <span>
          <small>Reason for Visit</small>
          <b>{formatReasonForVisit(p.reason)}</b>
        </span>
      </div>
      <div className="dp-mini">
        <div>
          <Activity color={intake ? '#087d43' : '#64748b'} />
          <small>AI Triage</small>
          <b style={{ color: intake ? '#087d43' : '#64748b' }}>{intake ? 'Completed' : 'Pending'}</b>
        </div>
        <div>
          <FileText color="#64748b" />
          <small>Reports</small>
          <b>{reports?.length || 0} Uploaded</b>
        </div>
        <div>
          <CalendarDays color="#64748b" />
          <small>Visit Type</small>
          <b>{p.visitType || 'OPD'}</b>
        </div>
      </div>
      <div className="dp-summary">
        <h3>Patient Summary</h3>
        <p>
          <span>Blood Group</span>
          <b>{bloodGroup || '—'}</b>
        </p>
        <p>
          <span>Allergies</span>
          <b>{txt(h.allergies) || '—'}</b>
        </p>
        <p>
          <span>Chronic Conditions</span>
          <b>{txt(h.pastMedical) || '—'}</b>
        </p>
        <p>
          <span>Current Medications</span>
          <b>{txt(h.medications) || '—'}</b>
        </p>
      </div>
      <button className="dp-start" onClick={start}>
        Start Consultation <span style={{ float: 'right' }}>→</span>
      </button>
    </aside>
  );
}

function Section({ n, title, children, action }) {
  return (
    <section className="dp-section">
      <header>
        <i>{n}</i>
        <h3>{title}</h3>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}

/**
 * Consultation View Component (Pixel-perfect to Design Reference)
 */
function Consultation({ p, intake, reports = [], ayur, back, end }) {
  const h = intake?.history || {},
    s = intake?.clinical_summary || {},
    a = h.ayushAssessment || {};

  const [meds, setMeds] = useState([
    {
      medicine: 'Pantoprazole 40mg',
      dosage: '1 Tablet',
      frequency: 'Before Breakfast',
      duration: '5 Days',
      instructions: 'Take on empty stomach',
    },
    {
      medicine: 'Dicyclomine 20mg',
      dosage: '1 Tablet',
      frequency: 'After Meals',
      duration: '3 Days',
      instructions: 'For stomach cramps',
    },
    {
      medicine: 'Ondansetron 4mg',
      dosage: '1 Tablet',
      frequency: 'As Needed',
      duration: '3 Days',
      instructions: 'For nausea / vomiting',
    },
  ]);

  const [advice, setAdvice] = useState(
    '• Eat small, frequent meals.\n• Avoid spicy, oily, and acidic foods.\n• Stay hydrated and avoid carbonated drinks.\n• Manage stress and get adequate sleep.'
  );

  const [ayurMeds, setAyurMeds] = useState([
    {
      medicine: 'Avipattikar Churna',
      dosage: '1 tsp',
      anupana: 'Lukewarm Water',
      whenToTake: 'After Lunch & Dinner',
      duration: '30 Days',
    },
    {
      medicine: 'Godanti Bhasma',
      dosage: '1/2 tsp',
      anupana: 'Ghee',
      whenToTake: 'After Meals',
      duration: '30 Days',
    },
    {
      medicine: 'Kutajghan Vati',
      dosage: '1 Tablet',
      anupana: '—',
      whenToTake: 'Twice a Day',
      duration: '30 Days',
    },
    {
      medicine: 'Brahmi Ghrita',
      dosage: '1 tsp',
      anupana: 'Warm Milk',
      whenToTake: 'At Bedtime',
      duration: '30 Days',
    },
  ]);

  const [ayurAdvice, setAyurAdvice] = useState(
    '• Avoid spicy, oily, and heavy foods.\n• Prefer warm, light, and easily digestible meals.\n• Drink warm water. Avoid cold drinks.\n• Maintain regular meal timings and proper sleep.\n• Practice gentle yoga and deep breathing (Pranayama).'
  );

  const [showFullIntake, setShowFullIntake] = useState(false);

  const add = () =>
    setMeds(v => [
      ...v,
      { medicine: '', dosage: '1 Tablet', frequency: 'After Meals', duration: '5 Days', instructions: '' },
    ]);
  const addAyur = () =>
    setAyurMeds(v => [
      ...v,
      { medicine: '', dosage: '1 Tablet', anupana: 'Lukewarm Water', whenToTake: 'Twice a Day', duration: '30 Days' },
    ]);
  const edit = (i, k, v) => setMeds(r => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const editAyur = (i, k, v) =>
    setAyurMeds(r => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const finish = () =>
    end({
      prescription: (ayur ? ayurMeds : meds)
        .filter(x => x.medicine)
        .map(x => Object.values(x).filter(Boolean).join(' | '))
        .join('\n'),
      doctor_notes: ayur ? ayurAdvice : advice,
    });

  const patientName = p.name || 'Patient';
  const patientAge = p.age ? `${p.age} Years` : '—';
  const patientGender = p.gender || '—';
  const patientPhone = p.phone || '—';
  const patientAbha = p.abhaId || p.abha_id || p.ayushId || (p.phone ? `ABHA${p.phone.slice(-10)}` : '—');
  const patientTime = p.time || '—';
  const patientDate = date(p.date) !== '—' ? date(p.date) : 'Today';
  const patientToken = String(p.token || '001').replace('#', '');
  const patientBloodGroup = s.bloodGroup || h.bloodGroup || p.bloodGroup || p.blood_group || '—';
  const patientHeight = s.height ? `${s.height} cm` : (intake?.height ? `${intake.height} cm` : '—');
  const patientWeight = s.weight ? `${s.weight} kg` : (intake?.weight ? `${intake.weight} kg` : '—');
  const patientBmi = s.bmi || (s.height && s.weight ? (s.weight / ((s.height / 100) ** 2)).toFixed(1) : '—');

  return (
    <main className="dp-consult" style={{ padding: '24px 36px', maxWidth: '1280px', margin: '0 auto', background: '#f8fafc' }}>
      {/* Top Breadcrumbs & Header Bar */}
      <div className="dp-cnav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={back}
          style={{
            background: 'none',
            border: 'none',
            color: '#087d43',
            fontSize: '14px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          Back to Appointments
        </button>
        <Top doctor={p.doctor} onLogout={back} />
      </div>

      {/* Title & Token Header */}
      <div className="dp-ctitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Consultation in Progress{' '}
            {ayur && (
              <em
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#087d43',
                  background: '#eaf7f0',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  marginLeft: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Leaf size={14} />
                Ayurvedic Consultation
              </em>
            )}
          </h1>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px', margin: '4px 0 0 0' }}>
            You are securely consulting with your patient.
          </p>
        </div>
        <b
          style={{
            background: '#eaf7f0',
            color: '#087d43',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '700',
          }}
        >
          Token #{patientToken}
        </b>
      </div>

      {/* Patient Profile Card */}
      <section
        className="dp-cpatient"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '30px',
          background: '#fff',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <i
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#eaf7f0',
                color: '#087d43',
                fontSize: '24px',
                display: 'grid',
                placeItems: 'center',
                fontWeight: '700',
                fontStyle: 'normal',
                flexShrink: 0,
              }}
            >
              {initials(patientName)}
            </i>
            {ayur && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '24px',
                  height: '24px',
                  background: '#087d43',
                  color: '#fff',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  border: '2px solid #fff',
                }}
                title="Ayurvedic Patient Record"
              >
                <Leaf size={12} />
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h2
              style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '22px',
                fontWeight: '700',
                color: '#0f172a',
              }}
            >
              {patientName}{' '}
              <em
                style={{
                  fontSize: '11px',
                  background: '#eaf3ff',
                  color: '#0878f9',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontStyle: 'normal',
                  fontWeight: '600',
                }}
              >
                In Consultation
              </em>
            </h2>
            <p style={{ margin: 0, color: '#334155', fontSize: '14px', fontWeight: '500' }}>
              {patientAge} / {patientGender}{' '}
              <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>{' '}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={14} color="#64748b" /> {patientPhone}
              </span>
            </p>
            <small
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#475569',
                fontWeight: '500',
                fontSize: '13px',
                marginTop: '2px',
              }}
            >
              {ayur ? 'AYUSH' : 'ABHA'} ID: {patientAbha}{' '}
              <span
                style={{
                  color: '#087d43',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '600',
                }}
              >
                <Check size={14} /> ABHA Linked
              </span>
            </small>
          </div>
        </div>
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto auto',
            gap: '10px 28px',
            margin: 0,
            padding: '4px 0 4px 28px',
            borderLeft: '1px solid #e2e8f0',
            fontSize: '13px',
            alignContent: 'center',
          }}
        >
          <dt style={{ color: '#64748b', margin: 0 }}>Appointment Time</dt>
          <dd style={{ fontWeight: '600', margin: 0, color: '#0f172a' }}>
            {patientTime}, {patientDate}
          </dd>
          <dt style={{ color: '#64748b', margin: 0 }}>Appointment Type</dt>
          <dd style={{ fontWeight: '600', margin: 0, color: '#0f172a' }}>
            {ayur ? 'Ayurvedic Consultation' : 'In-clinic Consultation'}
          </dd>
          <dt style={{ color: '#64748b', margin: 0 }}>Referred By</dt>
          <dd style={{ fontWeight: '600', margin: 0, color: '#0f172a' }}>{p.referredBy || 'Self'}</dd>
          <dt style={{ color: '#64748b', margin: 0 }}>Last Visit</dt>
          <dd style={{ fontWeight: '600', margin: 0, color: '#0f172a' }}>{p.lastVisit || 'First Visit'}</dd>
        </dl>
      </section>

      {/* 6 Vitals Cards Row */}
      <div
        className="dp-vitals"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6,1fr)',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          marginBottom: '24px',
          padding: '18px 0',
          background: '#fff',
          textAlign: 'center',
        }}
      >
        {(ayur
          ? [
              ['Height', patientHeight],
              ['Weight', patientWeight],
              ['BMI', patientBmi, Boolean(s.bmi)],
              ['Prakriti (Constitution)', a.prakriti || s.prakriti || '—'],
              ['Agni (Digestive Power)', a.agni || s.agni || '—'],
              ['Ama (Toxins)', a.ama || s.ama || '—'],
            ]
          : [
              ['Height', patientHeight],
              ['Weight', patientWeight],
              ['BMI', patientBmi, Boolean(s.bmi)],
              ['Blood Group', patientBloodGroup],
              ['Allergies', txt(h.allergies) || 'None reported'],
              ['Chronic Conditions', txt(h.pastMedical) || 'None reported'],
            ]
        ).map(([k, v, isNormal], idx, arr) => (
          <div
            key={k}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              borderRight: idx < arr.length - 1 ? '1px solid #e2e8f0' : 'none',
              padding: '0 12px',
            }}
          >
            <small style={{ color: '#64748b', fontWeight: '500', fontSize: '12px' }}>{k}</small>
            <b style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>{v}</b>
            {isNormal && (
              <span style={{ color: '#087d43', fontSize: '11px', fontWeight: '700' }}>
                Normal
              </span>
            )}
          </div>
        ))}
      </div>

      {/* SECTION 1: Patient Summary (From Pre-consultation Intake) */}
      <Section
        n="1"
        title="Patient Summary (From Pre-consultation Intake)"
        action={
          intake?.created_at ? (
            <span
              style={{
                fontSize: '12px',
                color: '#087d43',
                fontWeight: '600',
                marginLeft: 'auto',
              }}
            >
              Intake Completed on {new Date(intake.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          ) : (
            <span
              style={{
                fontSize: '12px',
                color: '#64748b',
                fontWeight: '500',
                marginLeft: 'auto',
              }}
            >
              Direct OPD Booking
            </span>
          )
        }
      >
        <div
          className="dp-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr 1fr 1fr',
            gap: '20px',
          }}
        >
          {/* Row 1 */}
          <article style={{ borderRight: '1px solid #e2e8f0', paddingRight: '20px' }}>
            <b style={{ display: 'block', marginBottom: '8px', color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>
              Chief Complaint
            </b>
            <p style={{ color: '#334155', margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
              {p.reason || s.chiefComplaint || 'General OPD Consultation'}
            </p>
          </article>
          <article style={{ borderRight: '1px solid #e2e8f0', paddingRight: '20px' }}>
            <b style={{ display: 'block', marginBottom: '8px', color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>
              Symptoms Reported
            </b>
            {Array.isArray(s.symptoms) && s.symptoms.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '16px', color: '#334155', listStyleType: 'disc', fontSize: '13px', lineHeight: '1.6' }}>
                {s.symptoms.map((sym, idx) => (
                  <li key={idx}>{sym}</li>
                ))}
              </ul>
            ) : p.reason ? (
              <p style={{ color: '#334155', margin: 0, fontSize: '13px' }}>{formatReasonForVisit(p.reason)}</p>
            ) : (
              <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>No specific symptoms logged</p>
            )}
          </article>
          <article style={{ borderRight: '1px solid #e2e8f0', paddingRight: '20px' }}>
            <b style={{ display: 'block', marginBottom: '8px', color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>
              Symptom Onset
            </b>
            <p style={{ color: '#334155', margin: 0, fontSize: '13px' }}>
              {s.onset || s.duration || (p.reason?.includes('since') ? p.reason.split('since')[1]?.trim() : '—')}
            </p>
          </article>
          <article>
            <b style={{ display: 'block', marginBottom: '8px', color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>
              Severity
            </b>
            <p
              style={{
                color: '#334155',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                }}
              ></span>{' '}
              {s.severity || (intake?.triage_level ? `Level ${intake.triage_level}` : 'Standard')}
            </p>
          </article>

          {/* Row 2 */}
          <article
            style={{
              borderRight: '1px solid #e2e8f0',
              paddingRight: '20px',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '16px',
              marginTop: '8px',
            }}
          >
            <b style={{ display: 'block', marginBottom: '8px', color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>
              Relevant History
            </b>
            {Array.isArray(h.lifestyle) && h.lifestyle.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '16px', color: '#334155', listStyleType: 'disc', fontSize: '13px', lineHeight: '1.6' }}>
                {h.lifestyle.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>No specific lifestyle factors recorded.</p>
            )}
          </article>
          <article
            style={{
              borderRight: '1px solid #e2e8f0',
              paddingRight: '20px',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '16px',
              marginTop: '8px',
            }}
          >
            <b style={{ display: 'block', marginBottom: '8px', color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>
              Medical History
            </b>
            <p style={{ color: '#334155', margin: 0, fontSize: '13px' }}>
              {txt(h.pastMedical) || 'No major medical conditions recorded.'}
            </p>
          </article>
          <article
            style={{
              borderRight: '1px solid #e2e8f0',
              paddingRight: '20px',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '16px',
              marginTop: '8px',
            }}
          >
            <b style={{ display: 'block', marginBottom: '8px', color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>
              Family History
            </b>
            <p style={{ color: '#334155', margin: 0, fontSize: '13px' }}>
              {txt(h.familyHistory) || 'No significant family history recorded.'}
            </p>
          </article>
          <article
            style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '16px',
              marginTop: '8px',
            }}
          >
            <b style={{ display: 'block', marginBottom: '8px', color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>
              Medications (Current)
            </b>
            <p style={{ color: '#334155', margin: 0, fontSize: '13px' }}>
              {txt(h.medications) || 'None reported'}
            </p>
          </article>
        </div>

        {/* View Full Details expander */}
        <div style={{ textAlign: 'right', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => setShowFullIntake(!showFullIntake)}
            style={{
              background: 'none',
              border: 'none',
              color: '#087d43',
              fontSize: '13px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            View Full Intake Details <ChevronDown size={14} style={{ transform: showFullIntake ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </Section>

      {/* SECTION 2: Dasvidha Pariksha (Ayurvedic Assessment - Only if Ayur) */}
      {ayur && (
        <Section
          n="2"
          title="Dasvidha Pariksha (Ayurvedic Assessment)"
          action={
            <button
              type="button"
              style={{
                border: '1px solid #bbf7d0',
                color: '#087d43',
                background: '#fff',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginLeft: 'auto',
                cursor: 'pointer',
              }}
            >
              <Pencil size={14} /> Edit Assessment
            </button>
          }
        >
          <div
            className="dp-ayush"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0 40px',
              marginBottom: '16px',
            }}
          >
            {[
              [
                ['Prakriti (Constitution)', a.prakriti || 'Pitta-Vata'],
                ['Vikriti (Imbalance)', a.vikriti || 'Pitta Prakopa'],
                ['Sara (Tissue Strength)', a.sara || 'Madhyama'],
                ['Samhanana (Body Built)', a.samhanana || 'Madhyama'],
                ['Pramana (Body Measurement)', a.pramana || 'Madhyama'],
              ],
              [
                ['Satmya (Adaptability)', a.satmya || 'Madhyama'],
                ['Satva (Mental Strength)', a.satva || 'Madhyama'],
                ['Ahar Shakti (Digestive Power)', a.aharShakti || 'Madhyama'],
                ['Vyayam Shakti (Exercise Tolerance)', a.vyayamShakti || 'Madhyama'],
                ['Vaya (Age)', a.vaya || 'Yuva Avastha (Adult)'],
              ],
            ].map((col, cIdx) => (
              <div key={cIdx}>
                {col.map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #e2e8f0',
                      padding: '10px 0',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#087d43',
                        fontWeight: '600',
                        fontSize: '13px',
                      }}
                    >
                      <Leaf size={14} /> {k}
                    </span>
                    <span
                      style={{
                        color: '#0f172a',
                        fontWeight: '500',
                        fontSize: '13px',
                      }}
                    >
                      : <span style={{ marginLeft: '8px' }}>{v}</span>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px 14px',
              color: '#64748b',
              fontSize: '12px',
            }}
          >
            <b>Note:</b> This assessment is based on the information provided by the patient during the Ayurvedic consultation.
          </div>
        </Section>
      )}

      {/* SECTION 3 (or 2 for Allopathy): Reports Summary (Extracted using OCR) */}
      <Section n={ayur ? '3' : '2'} title="Reports Summary (Extracted using OCR)">
        {reports && reports.some(r => r.ocr_text || r.extracted_data) ? (
          <div
            className="dp-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '16px',
            }}
          >
            {reports.filter(r => r.ocr_text || r.extracted_data).map((r, i) => (
              <article key={r.id || i} style={{ borderRight: '1px solid #e2e8f0', paddingRight: '16px' }}>
                <b style={{ display: 'block', marginBottom: '10px', color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>
                  {r.title || r.report_type || 'Diagnostic Report'} ({r.uploaded_at ? new Date(r.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'})
                </b>
                <div style={{ color: '#334155', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {r.ocr_text || (typeof r.extracted_data === 'string' ? r.extracted_data : JSON.stringify(r.extracted_data, null, 2))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ padding: '16px', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px' }}>
            No extracted OCR text available. Uploading a lab test report or prescription will automatically extract diagnostic parameters here.
          </div>
        )}

        {/* OCR Accuracy notice banner */}
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#166534',
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          <FileText size={16} color="#16a34a" />
          OCR accuracy is high. Please verify the extracted information with the original reports.
        </div>
      </Section>

      {/* SECTION 4 (or 3 for Allopathy): Reports Uploaded by Patient */}
      <Section n={ayur ? '4' : '3'} title="Reports Uploaded by Patient">
        {reports && reports.length > 0 ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              {reports.map((r, i) => {
                const isPdf = String(r.file_url || r.title || '').toLowerCase().endsWith('.pdf') || r.report_type === 'pdf';
                const isImg = String(r.file_url || r.title || '').toLowerCase().match(/\.(jpg|jpeg|png|webp)$/) || r.report_type === 'image';
                const reportTitle = r.title || r.name || `Medical_Report_${i + 1}.pdf`;
                const uploadDate = r.uploaded_at ? new Date(r.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
                const fileSize = r.size || '1.2 MB';

                return (
                  <div
                    key={r.id || i}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px',
                      background: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Thumbnail Container */}
                    <div
                      style={{
                        height: '110px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isImg && r.file_url ? (
                        <img
                          src={r.file_url}
                          alt={reportTitle}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                          <FileText color={isPdf ? '#ef4444' : '#3b82f6'} size={36} />
                          <span style={{ fontSize: '11px', fontWeight: '600' }}>{isPdf ? 'PDF Document' : 'Lab Report'}</span>
                        </div>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: '#fff',
                          borderRadius: '4px',
                          padding: '3px 5px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <FileText color={isPdf ? '#ef4444' : '#3b82f6'} size={14} />
                      </span>
                    </div>
                    <b
                      style={{
                        fontSize: '13px',
                        color: '#0f172a',
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: '600',
                      }}
                      title={reportTitle}
                    >
                      {reportTitle}
                    </b>
                    <small style={{ color: '#64748b', fontSize: '11px', marginBottom: '12px' }}>
                      {uploadDate} • {fileSize}
                    </small>
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                      {r.file_url ? (
                        <>
                          <a
                            href={r.file_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              flex: 1,
                              padding: '6px',
                              textAlign: 'center',
                              background: '#fff',
                              border: '1px solid #bbf7d0',
                              color: '#16a34a',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              textDecoration: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            View
                          </a>
                          <a
                            href={r.file_url}
                            download={reportTitle}
                            style={{
                              flex: 1,
                              padding: '6px',
                              textAlign: 'center',
                              background: '#fff',
                              border: '1px solid #bbf7d0',
                              color: '#16a34a',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              textDecoration: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Download
                          </a>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled
                          style={{
                            flex: 1,
                            padding: '6px',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            color: '#94a3b8',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          Processed
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Uploaded footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b', paddingTop: '4px' }}>
              <span>Uploaded {reports.length} of {reports.length} files</span>
              <button
                type="button"
                onClick={() => {
                  reports.forEach(r => {
                    if (r.file_url) window.open(r.file_url, '_blank');
                  });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#087d43',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                Download All Reports <Download size={14} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <FileText size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#334155', marginBottom: '4px' }}>
              No medical reports or lab scans uploaded yet by this patient.
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
              Any blood tests, radiological scans, or previous prescriptions uploaded by the patient will appear here with live file access.
            </p>
          </div>
        )}
      </Section>

      {/* SECTION 4 (or 4 for Allopathy): Prescription & Advice */}
      <Section
        n={ayur ? '4' : '4'}
        title={ayur ? 'Ayurvedic Prescription & Medicines' : 'Prescription & Advice (Doctor)'}
        action={
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {!ayur && <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Saved as Draft</span>}
            <button
              type="button"
              style={{
                background: '#fff',
                color: '#087d43',
                border: '1px solid #bbf7d0',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              Download Prescription <Download size={15} />
            </button>
          </div>
        }
      >
        {!ayur ? (
          <div className="dp-med">
            <p style={{ color: '#64748b', fontSize: '13px', margin: '-4px 0 16px 0' }}>
              Add medicines, dosage and diet/lifestyle advice for the patient.
            </p>
            <b
              style={{
                display: 'block',
                marginBottom: '16px',
                color: '#0f172a',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Prescription (Allopathic Medicines)
            </b>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '30px 1.5fr 1fr 1fr 1fr 1.5fr 40px',
                gap: '12px',
                marginBottom: '12px',
                padding: '0 8px',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              <span></span>
              <span>Medicine</span>
              <span>Dosage</span>
              <span>Frequency</span>
              <span>Duration</span>
              <span>Instructions</span>
              <span style={{ textAlign: 'center' }}>Action</span>
            </div>
            {meds.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px 1.5fr 1fr 1fr 1fr 1.5fr 40px',
                  gap: '12px',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <span
                  style={{
                    color: '#64748b',
                    fontWeight: '600',
                    textAlign: 'center',
                    fontSize: '14px',
                  }}
                >
                  {i + 1}.
                </span>
                <input
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '14px',
                    outline: 'none',
                    fontWeight: '500',
                  }}
                  value={r.medicine}
                  placeholder="Medicine Name"
                  onChange={e => edit(i, 'medicine', e.target.value)}
                />
                <select
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#fff',
                  }}
                  value={r.dosage}
                  onChange={e => edit(i, 'dosage', e.target.value)}
                >
                  <option>1 Tablet</option>
                  <option>2 Tablets</option>
                  <option>1/2 Tablet</option>
                  <option>1 Capsule</option>
                  <option>5 ml</option>
                  <option>10 ml</option>
                  <option>1 Puff</option>
                </select>
                <select
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#fff',
                  }}
                  value={r.frequency}
                  onChange={e => edit(i, 'frequency', e.target.value)}
                >
                  <option>Before Breakfast</option>
                  <option>After Meals</option>
                  <option>As Needed</option>
                  <option>Twice a Day</option>
                  <option>Thrice a Day</option>
                  <option>At Bedtime</option>
                </select>
                <select
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#fff',
                  }}
                  value={r.duration}
                  onChange={e => edit(i, 'duration', e.target.value)}
                >
                  <option>3 Days</option>
                  <option>5 Days</option>
                  <option>7 Days</option>
                  <option>10 Days</option>
                  <option>15 Days</option>
                  <option>1 Month</option>
                </select>
                <input
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  value={r.instructions}
                  placeholder="Instructions"
                  onChange={e => edit(i, 'instructions', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setMeds(v => v.filter((_, j) => j !== i))}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#ef4444',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  title="Remove"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={add}
              style={{
                background: '#fff',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '10px',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} /> Add Medicine
            </button>
          </div>
        ) : (
          <div className="dp-med">
            <b
              style={{
                display: 'block',
                marginBottom: '16px',
                color: '#087d43',
                fontSize: '14px',
                fontWeight: '700',
              }}
            >
              Ayurvedic Medicines & Remedies
            </b>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '30px 1.5fr 1fr 1.5fr 1.5fr 1fr 40px',
                gap: '12px',
                marginBottom: '12px',
                padding: '0 8px',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              <span>#</span>
              <span>Medicine</span>
              <span>Dose</span>
              <span>Anupana (With)</span>
              <span>When to Take</span>
              <span>Duration</span>
              <span style={{ textAlign: 'center' }}>Action</span>
            </div>
            {ayurMeds.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px 1.5fr 1fr 1.5fr 1.5fr 1fr 40px',
                  gap: '12px',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <span
                  style={{
                    color: '#64748b',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <input
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '14px',
                    outline: 'none',
                    fontWeight: '600',
                    color: '#0f172a',
                  }}
                  value={r.medicine}
                  placeholder="Medicine Name"
                  onChange={e => editAyur(i, 'medicine', e.target.value)}
                />
                <input
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  value={r.dosage}
                  placeholder="Dose"
                  onChange={e => editAyur(i, 'dosage', e.target.value)}
                />
                <input
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  value={r.anupana}
                  placeholder="Anupana"
                  onChange={e => editAyur(i, 'anupana', e.target.value)}
                />
                <input
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  value={r.whenToTake}
                  placeholder="When to Take"
                  onChange={e => editAyur(i, 'whenToTake', e.target.value)}
                />
                <select
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#fff',
                  }}
                  value={r.duration}
                  onChange={e => editAyur(i, 'duration', e.target.value)}
                >
                  <option>15 Days</option>
                  <option>30 Days</option>
                  <option>45 Days</option>
                  <option>60 Days</option>
                </select>
                <button
                  type="button"
                  onClick={() => setAyurMeds(v => v.filter((_, j) => j !== i))}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#ef4444',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  title="Remove"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAyur}
              style={{
                background: '#fff',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '10px',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} /> Add Medicine
            </button>
          </div>
        )}

        {/* Diet & Lifestyle Advice */}
        <div style={{ marginTop: '28px' }}>
          <b
            style={{
              display: 'block',
              marginBottom: '12px',
              color: '#0f172a',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Diet & Lifestyle Advice
          </b>

          {ayur ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px 20px',
                color: '#334155',
                fontSize: '13px',
                lineHeight: '1.8',
              }}
            >
              <div>
                <ul style={{ margin: 0, paddingLeft: '16px', listStyleType: 'disc' }}>
                  <li>Avoid spicy, oily, and heavy foods.</li>
                  <li>Prefer warm, light, and easily digestible meals.</li>
                  <li>Drink warm water. Avoid cold drinks.</li>
                </ul>
              </div>
              <div>
                <ul style={{ margin: 0, paddingLeft: '16px', listStyleType: 'disc' }}>
                  <li>Maintain regular meal timings and proper sleep.</li>
                  <li>Practice gentle yoga and deep breathing (Pranayama).</li>
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '120px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  outline: 'none',
                  color: '#334155',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  background: '#fff',
                }}
                value={advice}
                onChange={e => setAdvice(e.target.value)}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '16px',
                  fontSize: '12px',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              >
                {advice.length} / 500
              </span>
            </div>
          )}
        </div>
      </Section>

      {/* Bottom Session Action Bar */}
      <div
        className="dp-end"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#eef5ff',
          padding: '14px 20px',
          borderRadius: '10px',
          marginTop: '24px',
          border: '1px solid #dbeafe',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          <span
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#3b82f6',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            i
          </span>{' '}
          Please review all details before ending the session.
        </p>
        <button
          type="button"
          onClick={finish}
          style={{
            background: '#087d43',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          End Session <ChevronRight size={16} />
        </button>
      </div>
    </main>
  );
}

/**
 * Main PhysicianDashboard Component
 */
export default function PhysicianDashboard() {
  const nav = useNavigate();
  const { session, logout } = useSession();
  const [activeTab, setActiveTab] = useState('appointments');
  const [doctor, setDoctor] = useState(null);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [intake, setIntake] = useState(null);
  const [reports, setReports] = useState([]);
  const [consult, setConsult] = useState(false);

  const did = session.staff?.doctor_id || null;

  const leave = () => {
    logout();
    nav('/auth?role=doctor');
  };

  // Load doctor details from DB / session
  useEffect(() => {
    let isMounted = true;
    async function loadDoctorData() {
      try {
        let docData = null;
        if (did) {
          const res = await db.doctors.getById(did);
          docData = res.data;
        }

        // If no doctor by id, check if staff name matches any doctor in database
        if (!docData && session.staff?.name) {
          const resName = await db.doctors.getByName(session.staff.name);
          if (resName?.data) docData = resName.data;
        }

        // Default to primary doctor catalog record if not logged in with specific doctor
        if (!docData) {
          const res = await db.doctors.getById('d0000001-0002-0002-0002-000000000001');
          docData = res.data || {
            name: 'Dr. Ananya Sharma',
            speciality: 'General Physician',
            degrees: 'MBBS, MD (Internal Medicine)',
            experience: 12,
            age: 36,
            gender: 'Female',
            hospitalName: 'Sawai Man Singh Hospital',
            email: 'drananyasharma@swasthyasetu.ac.in',
            avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg'
          };
        }

        if (isMounted && docData) {
          const resolvedAvatar = docData.avatar_url || getDoctorAvatar(docData.name);
          const finalDoc = {
            ...docData,
            username: session.staff?.username || docData.username || docData.email?.split('@')[0] || String(docData.name || 'doctor').toLowerCase().replace(/[^a-z0-9]/g, ''),
            avatar_url: resolvedAvatar,
            degrees: docData.degrees || docData.degree || 'MBBS, MD (Internal Medicine)',
            speciality: docData.speciality || docData.specialty || docData.department || 'General Physician',
            hospitalName: docData.hospitals?.name || docData.hospitalName || 'Sawai Man Singh Hospital',
            age: docData.age ?? null,
            gender: docData.gender ?? null,
            experience: docData.experience ?? docData.exp ?? null,
            email: docData.email || `${String(docData.name || 'doctor').toLowerCase().replace(/[^a-z]/g, '')}@swasthyasetu.ac.in`,
          };
          setDoctor(finalDoc);
        }
      } catch (err) {
        console.error('Failed to load doctor profile:', err);
      }
    }

    loadDoctorData();
    return () => {
      isMounted = false;
    };
  }, [did, session.staff]);

  // Load real appointments for this specific doctor's queue only
  useEffect(() => {
    let isMounted = true;
    async function fetchQueue() {
      try {
        const targetDoctorId = did || doctor?.id || null;
        if (!targetDoctorId) {
          if (isMounted) setRows([]);
          return;
        }

        const { data, error } = await db.appointments.getDoctorQueue(targetDoctorId, today());
        if (error) {
          console.error('Failed to load appointments queue:', error);
          return;
        }

        if (isMounted) {
          const formatted = (data || []).map(r => ({
            id: r.id,
            patientId: r.patient_id,
            name: r.patients?.name || r.name || 'Patient',
            age: r.patients?.age || r.age,
            gender: r.patients?.gender || r.gender,
            phone: r.patients?.phone || r.phone,
            date: r.date,
            time: r.time_label || r.time || '10:00 AM',
            token: r.token_number || r.token,
            status: r.status || 'upcoming',
            reason: r.reason,
            prescription: r.prescription,
            doctor,
          }));

          setRows(formatted);
          // Do NOT auto-open drawer on refresh/load; opens only when 'View' is clicked
        }
      } catch (err) {
        console.error('Failed to load appointments queue:', err);
      }
    }

    fetchQueue();
    return () => {
      isMounted = false;
    };
  }, [did, doctor?.id]);

  const choose = async p => {
    setSelected(p);
    if (p?.patientId) {
      const [i, r] = await Promise.all([
        db.intakes.getLatest(p.patientId),
        db.reports.getByPatient(p.patientId),
      ]);
      setIntake(i.data);
      setReports(r.data || []);
    }
  };

  const start = async () => {
    if (!selected) return;
    try {
      if (selected.id) {
        db.appointments.updateStatus(selected.id, 'in_consultation').catch(err => {
          console.warn('Could not persist in_consultation status to DB:', err);
        });
      }
    } catch (e) {
      console.warn('Status update error:', e);
    }
    setSelected(x => ({ ...x, status: 'in_consultation', doctor }));
    setConsult(true);
  };

  const end = async extra => {
    if (!selected) return;
    try {
      if (selected.id) {
        await db.appointments.updateStatus(selected.id, 'completed', extra);
      }
    } catch (e) {
      console.warn('Status update error:', e);
    }
    setRows(v => v.map(x => (x.id === selected.id ? { ...x, status: 'completed' } : x)));
    setConsult(false);
    setSelected(null);
  };

  const ayur = Boolean(
    /ayur|bams|ayush/i.test(
      `${doctor?.speciality || ''} ${doctor?.degrees || ''} ${session.staff?.department || ''}`
    )
  );

  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening';
  const doctorDisplayName = doctor?.name || session.staff?.name || 'Dr. Ananya Sharma';

  // If in consultation
  if (consult && selected) {
    return (
      <div className="dp-shell">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} logout={leave} />
        <Consultation
          p={{ ...selected, doctor }}
          intake={intake}
          reports={reports}
          ayur={ayur}
          back={() => setConsult(false)}
          end={end}
        />
      </div>
    );
  }

  return (
    <div className="dp-shell">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} logout={leave} />

      <main className="dp-main">
        <Top doctor={doctor} onLogout={leave} />

        {activeTab === 'communities' ? (
          <CommunitiesTab patientId={doctor?.id || session.staff?.id} />
        ) : activeTab === 'help' ? (
          <HelpSupportTab patientId={doctor?.id || session.staff?.id} />
        ) : (
          <>
            <h1 className="dp-greeting">
              {greet}, {doctorDisplayName} 👋
            </h1>

            <div className={`dp-work ${selected ? 'open' : ''}`}>
              <div>
                <Metrics rows={rows} />
                <Schedule rows={rows} selected={selected} choose={choose} />
              </div>

              {selected && (
                <Drawer
                  p={selected}
                  intake={intake}
                  reports={reports}
                  close={() => setSelected(null)}
                  start={start}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
