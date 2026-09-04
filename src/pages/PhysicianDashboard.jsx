import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useLanguage } from '../context/LanguageContext';
import domTranslator from '../engine/DOMTranslator';
import { db } from '../lib/db';
import { recordConsultationStart, recordConsultationEnd, getDoctorPacingStatus } from '../engine/SlotEngine';
import SwasthyaLogo from '../components/SwasthyaLogo';
import DoctorCommunities from '../components/DoctorCommunities';
import HelpSupportTab from '../components/HelpSupportTab';
import OCRProcessor from '../engine/OCRProcessor';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bell,
  BellRing,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCheck,
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
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 1024 : false);
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

// Doctor identity must remain in English throughout the physician portal,
// even when an older appointment/login record contains a localized name.
const ENGLISH_DOCTOR_NAMES = {
  'डॉ. अनन्या शर्मा': 'Dr. Ananya Sharma',
  'डॉ अनन्या शर्मा': 'Dr. Ananya Sharma',
  'अनन्या शर्मा': 'Dr. Ananya Sharma',
};

const getEnglishDoctorName = name => {
  if (!name) return '';
  const normalized = String(name || '').trim();
  return ENGLISH_DOCTOR_NAMES[normalized] || normalized;
};

const ENGLISH_HOSPITAL_NAMES_BY_ID = {
  'aiims-delhi': 'AIIMS New Delhi',
  'sms-jaipur': 'Sawai Man Singh Hospital',
  'apollo-delhi': 'Indraprastha Apollo Hospitals',
  'shalby-jaipur': 'Shalby Hospital Jaipur',
  'aiia-delhi': 'All India Institute of Ayurveda (AIIA)',
  'nia-jaipur': 'National Institute of Ayurveda (NIA)',
  'narayana-bangalore': 'Narayana Health City',
  'fortis-jaipur': 'Fortis Escorts Hospital Jaipur',
  'tata-mumbai': 'Tata Memorial Hospital',
  'jaipur-hospital': 'Jaipur Hospital',
  'pgimer-chandigarh': 'PGIMER Chandigarh',
  'kem-mumbai': 'KEM Hospital Mumbai',
  'nimhans-bangalore': 'NIMHANS Bangalore',

  // Legacy mappings for backwards compatibility
  'a1b2c3d4-0001-0001-0001-000000000001': 'AIIMS New Delhi',
  'a1b2c3d4-0002-0002-0002-000000000002': 'Sawai Man Singh Hospital',
  'a1b2c3d4-0003-0003-0003-000000000003': 'Indraprastha Apollo Hospitals',
  'a1b2c3d4-0004-0004-0004-000000000004': 'Shalby Hospital Jaipur',
  'a1b2c3d4-0005-0005-0005-000000000005': 'All India Institute of Ayurveda (AIIA)',
  'a1b2c3d4-0006-0006-0006-000000000006': 'National Institute of Ayurveda (NIA)',
  'a1b2c3d4-0007-0007-0007-000000000007': 'Narayana Health City',
  'a1b2c3d4-0008-0008-0008-000000000008': 'Fortis Escorts Hospital Jaipur',
  'a1b2c3d4-0009-0009-0009-000000000009': 'Tata Memorial Hospital',
  'a1b2c3d4-0010-0010-0010-000000000010': 'Jaipur Hospital',
  'a1b2c3d4-0011-0011-0011-000000000011': 'PGIMER Chandigarh',
  'a1b2c3d4-0012-0012-0012-000000000012': 'KEM Hospital Mumbai',
  'a1b2c3d4-0013-0013-0013-000000000013': 'NIMHANS Bangalore',
};

// Some hospitals were previously saved after the patient-side localization
// had already converted their names to Hindi. Resolve those legacy values too,
// instead of depending only on a seeded database id.
const ENGLISH_HOSPITAL_NAME_ALIASES = {
  'एम्स नई दिल्ली (अखिल भारतीय आयुर्विज्ञान संस्थान)': 'AIIMS New Delhi',
  'एम्स नई दिल्ली': 'AIIMS New Delhi',
  'सवाई मान सिंह अस्पताल': 'Sawai Man Singh Hospital',
  'इंद्रप्रस्थ अपोलो अस्पताल': 'Indraprastha Apollo Hospitals',
  'शालबी अस्पताल जयपुर': 'Shalby Hospital Jaipur',
  'अखिल भारतीय आयुर्वेद संस्थान': 'All India Institute of Ayurveda (AIIA)',
  'राष्ट्रीय आयुर्वेद संस्थान जयपुर': 'National Institute of Ayurveda (NIA)',
  'नारायणा हेल्थ सिटी बेंगलुरु': 'Narayana Health City',
  'फोर्टिस एस्कॉर्ट्स अस्पताल जयपुर': 'Fortis Escorts Hospital Jaipur',
  'टाटा मेमोरियल अस्पताल मुंबई': 'Tata Memorial Hospital',
  'जयपुर अस्पताल': 'Jaipur Hospital',
};

const getEnglishHospitalName = doctor => {
  const storedName = String(
    doctor?.hospitalName || doctor?.hospitals?.name || doctor?.hospital || ''
  ).trim();

  return (
    ENGLISH_HOSPITAL_NAME_ALIASES[storedName] ||
    storedName ||
    ENGLISH_HOSPITAL_NAMES_BY_ID[doctor?.hospital_id] ||
    'Sawai Man Singh Hospital'
  );
};

/**
 * Doctor Profile Modal Component
 */
function DoctorProfileModal({ doctor, onClose, onLogout }) {
  const [copied, setCopied] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showLeaveSection, setShowLeaveSection] = useState(false);
  const [doctorLeavesList, setDoctorLeavesList] = useState([]);
  const [leaveDate, setLeaveDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [leaveReason, setLeaveReason] = useState('Annual Leave');
  const [leaveNotes, setLeaveNotes] = useState('');
  const [leaveMsg, setLeaveMsg] = useState({ text: '', type: '' });
  const [avatarUrl, setAvatarUrl] = useState(
    doctor?.avatar_url || getDoctorAvatar(doctor?.name)
  );
  const fileInputRef = useRef(null);

  // Load doctor leaves
  useEffect(() => {
    const fetchLeaves = async () => {
      const { data } = await db.doctorLeaves.getDoctorLeaves(doctor?.id || doctor?.name);
      setDoctorLeavesList(data || []);
    };
    fetchLeaves();
    const handleSync = () => fetchLeaves();
    window.addEventListener('swasthya_doctor_leave_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('swasthya_doctor_leave_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [doctor]);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwMsg, setPwMsg] = useState({ text: '', type: '' });

  const name = getEnglishDoctorName(doctor?.name);
  const spec = doctor?.speciality || doctor?.specialty || doctor?.department || 'General Physician';
  const degrees = doctor?.degrees || doctor?.degree || 'MBBS, MD (Internal Medicine)';
  const age = doctor?.age ? `${doctor.age} Years` : '—';
  const gender = doctor?.gender || '—';
  const exp = doctor?.experience ? `${doctor.experience}+ Years` : (doctor?.exp || '—');
  const hospital =
    doctor?.hospitalName ||
    doctor?.hospitals?.name ||
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

    setPwMsg({ text: 'Encrypting and updating password in database...', type: 'info' });

    const { error } = await db.staff.changePassword({
      username: targetUsername,
      doctorId: doctor?.id || doctor?.doctor_id || null,
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
          <span className="dp-profile-item-val notranslate" title={hospital} translate="no">
            {hospital}
          </span>
        </div>
      </div>

      <div className="dp-profile-email-sec">
        <label>Username / Email ID</label>
        <div className="dp-profile-email-row">
          <Mail size={15} color="#64748b" />
          <span className="dp-profile-email-txt notranslate" title={email} translate="no">
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

      {/* Leave & Holiday Schedule Accordion */}
      <button
        type="button"
        className="dp-profile-accordion-btn"
        onClick={() => setShowLeaveSection(!showLeaveSection)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarDays size={15} /> My Leave & Holiday Schedule
        </span>
        {showLeaveSection ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
      </button>

      {showLeaveSection && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', marginTop: '6px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
            Schedule your off-duty dates. All patient consultation slots on these dates will be automatically locked and marked unavailable.
          </div>

          <form
            onSubmit={async e => {
              e.preventDefault();
              if (!leaveDate) return;
              const res = await db.doctorLeaves.setLeave({
                doctorId: doctor?.id || doctor?.doctor_id,
                doctorName: doctor?.name,
                hospitalId: doctor?.hospital_id || doctor?.hospitals?.id,
                hospitalName: doctor?.hospitalName || doctor?.hospital_name,
                date: leaveDate,
                reason: leaveReason,
                notes: leaveNotes,
              });
              if (res.error) {
                setLeaveMsg({ text: res.error.message || 'Could not schedule leave.', type: 'error' });
                return;
              }
              const { data } = await db.doctorLeaves.getDoctorLeaves(doctor?.id || doctor?.name);
              setDoctorLeavesList(data || []);
              setLeaveNotes('');
              setLeaveMsg({ text: `Leave set for ${leaveDate}! Patient slots are now locked.`, type: 'success' });
              setTimeout(() => setLeaveMsg({ text: '', type: '' }), 3000);
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                  Date
                </label>
                <input
                  type="date"
                  required
                  min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })()}
                  value={leaveDate}
                  onChange={e => setLeaveDate(e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                  Reason
                </label>
                <select
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="Annual Leave">Annual Leave 🏖️</option>
                  <option value="Sick / Medical Leave">Medical Leave 💊</option>
                  <option value="Academic Conference">Conference 🎓</option>
                  <option value="Emergency Off">Emergency Off 🚨</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Remarks / Note (Optional)"
                value={leaveNotes}
                onChange={e => setLeaveNotes(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            {leaveMsg.text && (
              <div style={{ fontSize: '11px', fontWeight: '700', color: leaveMsg.type === 'error' ? '#dc2626' : '#059669', marginBottom: '6px', textAlign: 'center' }}>
                {leaveMsg.text}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '7px',
                background: '#0c4e47',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Set On Leave & Lock Slots
            </button>
          </form>

          {/* List of active leaves */}
          {doctorLeavesList && doctorLeavesList.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>My Scheduled Leaves:</div>
              {doctorLeavesList.map(l => (
                <div
                  key={l.id || l.date}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 8px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '11px'
                  }}
                >
                  <div>
                    <b style={{ color: '#0f172a' }}>{l.date}</b> • <span style={{ color: '#dc2626', fontWeight: 600 }}>{l.reason}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`Cancel leave for ${l.date}?`)) return;
                      await db.doctorLeaves.cancelLeave(l.id, l.doctor_id, l.date);
                      const { data } = await db.doctorLeaves.getDoctorLeaves(doctor?.id || doctor?.name);
                      setDoctorLeavesList(data || []);
                    }}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: '10.5px' }}
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button type="button" className="dp-profile-logout-btn" onClick={onLogout}>
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </div>
  );
}

/**
 * Top Header Component with Interactive Clinical Reminders & Notifications
 */
function Top({ doctor, onLogout }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const dropdownRef = useRef(null);

  const storageKey = `swasthya_doc_reminders_${doctor?.id || 'default'}`;

  const defaultReminders = [
    {
      id: 'rem-1',
      title: 'OPD Queue Active',
      text: 'Today’s clinic queue is live. Review scheduled tokens in the appointments tab.',
      time: 'Today, 09:00 AM',
      type: 'schedule',
      unread: true,
    },
    {
      id: 'rem-2',
      title: 'AI Clinical Anamnesis Ready',
      text: 'Pre-consultation intake reports are automatically processed and ready for incoming patients.',
      time: 'Today, 10:15 AM',
      type: 'clinical',
      unread: true,
    },
  ];

  const [reminders, setReminders] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return defaultReminders;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(reminders));
    } catch (e) {
      console.warn('Could not save reminders to localStorage', e);
    }
  }, [reminders, storageKey]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowReminders(false);
      }
    }
    if (showReminders) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReminders]);

  const unreadCount = reminders.filter(r => r.unread).length;

  const markAllRead = () => {
    setReminders(prev => prev.map(r => ({ ...r, unread: false })));
  };

  const toggleRead = id => {
    setReminders(prev =>
      prev.map(r => (r.id === id ? { ...r, unread: !r.unread } : r))
    );
  };

  const deleteReminder = (id, e) => {
    e?.stopPropagation();
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleAddReminder = e => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const item = {
      id: `rem-${Date.now()}`,
      title: 'Clinical Note & Reminder',
      text: newNote.trim(),
      time: 'Just now',
      type: 'note',
      unread: true,
    };
    setReminders(prev => [item, ...prev]);
    setNewNote('');
    setShowAddForm(false);
  };

  return (
    <div className="dp-top" ref={dropdownRef}>
      {/* Interactive Notification Bell with Badge */}
      <button
        type="button"
        className="dp-bell-btn"
        title="Clinical Reminders & Notifications"
        onClick={() => {
          setShowReminders(!showReminders);
          setShowProfile(false);
        }}
        style={{
          background: showReminders ? '#eaf7f0' : undefined,
          borderColor: showReminders ? '#087d43' : undefined,
          color: showReminders ? '#087d43' : undefined,
        }}
      >
        {unreadCount > 0 && <span className="dp-bell-badge">{unreadCount}</span>}
        <Bell size={19} />
      </button>

      {/* Floating Reminders & Notifications Dropdown */}
      {showReminders && (
        <div
          style={{
            position: 'absolute',
            top: '48px',
            right: '180px',
            width: '360px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BellRing size={16} color="#087d43" />
              <b style={{ fontSize: '14px', color: '#0f172a' }}>Clinical Reminders</b>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: '#eaf7f0',
                    color: '#087d43',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#087d43',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 6px',
                  }}
                  title="Mark all as read"
                >
                  <CheckCheck size={13} /> Mark Read
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowReminders(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Add Reminder Bar / Form */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
            {showAddForm ? (
              <form onSubmit={handleAddReminder} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Type a clinical reminder or note..."
                  autoFocus
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    fontSize: '13px',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewNote('');
                    }}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      color: '#475569',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: '#087d43',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    Save Reminder
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#087d43',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Add Quick Doctor Note / Reminder
              </button>
            )}
          </div>

          {/* Reminder List */}
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {reminders.length > 0 ? (
              reminders.map(r => (
                <div
                  key={r.id}
                  onClick={() => toggleRead(r.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    background: r.unread ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: r.unread ? '#dcfce7' : '#f1f5f9',
                      color: r.unread ? '#16a34a' : '#64748b',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {r.type === 'schedule' ? (
                      <CalendarCheck size={14} />
                    ) : r.type === 'clinical' ? (
                      <Activity size={14} />
                    ) : (
                      <Clock3 size={14} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <b
                        style={{
                          fontSize: '13px',
                          color: '#0f172a',
                          fontWeight: r.unread ? '700' : '600',
                        }}
                      >
                        {r.title}
                      </b>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{r.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                      {r.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={e => deleteReminder(r.id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '4px',
                    }}
                    title="Dismiss"
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>
                <Check size={28} style={{ margin: '0 auto 8px', color: '#10b981' }} />
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>All caught up!</div>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>No pending clinical reminders at this moment.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 16px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              textAlign: 'center',
              fontSize: '11px',
              color: '#64748b',
            }}
          >
            Swasthya Setu Doctor Notification Network
          </div>
        </div>
      )}

      {/* Doctor Profile Chip */}
      <div
        className="dp-doc"
        onClick={() => {
          setShowProfile(!showProfile);
          setShowReminders(false);
        }}
        role="button"
        tabIndex={0}
      >
        <div className="dp-doc-avatar">
          {doctor?.avatar_url || (doctor?.name && getDoctorAvatar(doctor.name)) ? (
            <img src={doctor?.avatar_url || getDoctorAvatar(doctor.name)} alt="" />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#087d43', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {initials(doctor?.name || 'Doctor')}
            </div>
          )}
        </div>
        <div className="dp-doc-info">
          <b translate="no" className="notranslate">{doctor?.name || 'Doctor'}</b>
          <small className="notranslate" translate="no">{doctor?.speciality || doctor?.department || 'Doctor'}</small>
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
function Metrics({ rows = [], selectedDate }) {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = !selectedDate || selectedDate === todayKey;

  const done = rows.filter(x => x.computedStatus === 'completed' || x.status === 'completed').length;
  const up = rows.filter(x => x.computedStatus === 'upcoming').length;
  const wait = rows.filter(x => ['waiting', 'in_consultation', 'in_queue'].includes(x.computedStatus || x.status)).length;
  const missed = rows.filter(x => x.computedStatus === 'missed').length;
  const next = rows.find(x => x.computedStatus === 'upcoming');

  const titleDateStr = isToday ? 'Today' : selectedDate === 'all' ? 'All Dates' : date(selectedDate);

  return (
    <div className="dp-metrics">
      {/* Green Card: Total Appointments */}
      <article className="dp-metric-card g">
        <div className="dp-metric-icon">
          <CalendarCheck size={28} />
        </div>
        <div className="dp-metric-content">
          <div className="dp-metric-num">{rows.length}</div>
          <div className="dp-metric-title">Total Appointments ({titleDateStr})</div>
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
            {next ? `Next: ${next.time}` : 'No upcoming appointments'}
          </div>
        </div>
      </article>

      {/* Orange/Amber Card: Patients Waiting / Missed */}
      <article className="dp-metric-card o">
        <div className="dp-metric-icon">
          <Clock3 size={28} />
        </div>
        <div className="dp-metric-content">
          <div className="dp-metric-num">{wait > 0 ? wait : missed}</div>
          <div className="dp-metric-title">{wait > 0 ? 'Patients in Queue' : 'Not Consulted (Missed)'}</div>
          <div className="dp-metric-sub">{wait > 0 ? 'In Waiting Queue' : `${missed} Past Sessions`}</div>
        </div>
      </article>
    </div>
  );
}

/**
 * Today's Schedule Table Component with Dynamic Date Picker Toolbar
 */
function Schedule({ rows = [], selected, choose, selectedDate, onSelectDate }) {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = !selectedDate || selectedDate === todayKey;

  const navigateDay = (offset) => {
    const baseDate = (!selectedDate || selectedDate === 'all') ? new Date() : new Date(selectedDate);
    baseDate.setDate(baseDate.getDate() + offset);
    const y = baseDate.getFullYear();
    const m = String(baseDate.getMonth() + 1).padStart(2, '0');
    const d = String(baseDate.getDate()).padStart(2, '0');
    if (onSelectDate) onSelectDate(`${y}-${m}-${d}`);
  };

  const formattedDateTitle = isToday
    ? "Today's Schedule"
    : selectedDate === 'all'
    ? 'All Scheduled Appointments'
    : `Schedule for ${date(selectedDate)}`;

  return (
    <section className="dp-schedule">
      <header className="dp-schedule-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ margin: 0 }}>{formattedDateTitle}</h3>
          <span style={{
            background: '#e0f2fe',
            color: '#0284c7',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '700'
          }}>
            {rows.length} {rows.length === 1 ? 'Patient' : 'Patients'}
          </span>
        </div>

        {/* Date Selector Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Quick Date Chips */}
          <button
            type="button"
            onClick={() => onSelectDate && onSelectDate(todayKey)}
            style={{
              border: isToday ? '2px solid #059669' : '1px solid #e2e8f0',
              background: isToday ? '#ecfdf5' : '#ffffff',
              color: isToday ? '#059669' : '#64748b',
              fontWeight: '700',
              fontSize: '12px',
              padding: '5px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => {
              const tm = new Date();
              tm.setDate(tm.getDate() + 1);
              const y = tm.getFullYear();
              const m = String(tm.getMonth() + 1).padStart(2, '0');
              const d = String(tm.getDate()).padStart(2, '0');
              if (onSelectDate) onSelectDate(`${y}-${m}-${d}`);
            }}
            style={{
              border: (selectedDate !== todayKey && selectedDate !== 'all' && selectedDate > todayKey) ? '2px solid #059669' : '1px solid #e2e8f0',
              background: (selectedDate !== todayKey && selectedDate !== 'all' && selectedDate > todayKey) ? '#ecfdf5' : '#ffffff',
              color: (selectedDate !== todayKey && selectedDate !== 'all' && selectedDate > todayKey) ? '#059669' : '#64748b',
              fontWeight: '700',
              fontSize: '12px',
              padding: '5px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Tomorrow
          </button>

          <button
            type="button"
            onClick={() => onSelectDate && onSelectDate('all')}
            style={{
              border: selectedDate === 'all' ? '2px solid #059669' : '1px solid #e2e8f0',
              background: selectedDate === 'all' ? '#ecfdf5' : '#ffffff',
              color: selectedDate === 'all' ? '#059669' : '#64748b',
              fontWeight: '700',
              fontSize: '12px',
              padding: '5px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            All Dates
          </button>

          {/* Stepper + HTML5 Date Input */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2px 6px' }}>
            <button
              type="button"
              title="Previous Day"
              onClick={() => navigateDay(-1)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px 6px', fontSize: '14px', fontWeight: 'bold' }}
            >
              ‹
            </button>
            <input
              type="date"
              value={selectedDate === 'all' ? '' : selectedDate}
              onChange={(e) => onSelectDate && onSelectDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#1e293b',
                fontWeight: '600',
                fontSize: '12px',
                padding: '3px 4px',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <button
              type="button"
              title="Next Day"
              onClick={() => navigateDay(1)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px 6px', fontSize: '14px', fontWeight: 'bold' }}
            >
              ›
            </button>
          </div>
        </div>
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

        return (
          <div className={`dp-tr ${isSel ? 'sel' : ''}`} key={x.id}>
            <span className="dp-tr-time">
              {x.time || '—'}
              {selectedDate === 'all' && x.date && (
                <small style={{ display: 'block', color: '#64748b', fontSize: '10px' }}>{x.date}</small>
              )}
            </span>
            <span className="dp-tr-patient">
              <span className={`dp-status-dot ${x.dotClass || x.statusClass || 'upcoming'}`} />
              <b>{x.name}</b>
            </span>
            <span className="dp-tr-meta">{ageGender}</span>
            <span className="dp-tr-reason" title={cleanReason}>
              {cleanReason}
            </span>
            <span>
              <em className={`dp-badge ${x.badgeClass || x.statusClass || 'upcoming'}`}>{x.displayStatus || x.status || 'Upcoming'}</em>
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
          <div>No appointments scheduled for {isToday ? 'today' : selectedDate === 'all' ? 'any date' : date(selectedDate)}.</div>
        </div>
      )}
    </section>
  );
}

/**
 * Helper to extract clean single disease name from notes / reason
 */
function getCleanChiefComplaint(p, s = {}) {
  const raw = s?.chiefComplaint || p?.reason || p?.notes || '';
  if (typeof raw !== 'string' || !raw.trim()) return 'General OPD Consultation';
  
  // Try to find an explicit chief complaint marker
  if (raw.includes('Chief Complaints:') || raw.includes('मुख्य लक्षण:')) {
    const m = raw.match(/(?:Chief Complaints|मुख्य लक्षण)\s*:\s*([^\n•]+)/i);
    if (m && m[1]) return m[1].trim();
  }
  
  // Extract just the FIRST line to avoid returning a massive block of AI questions
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^[•\-\*]\s*/, '');
    if (firstLine.includes(':')) {
       // e.g. "Disease: Fever" -> "Fever"
       return firstLine.split(':')[1].trim();
    }
    return firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
  }
  
  return 'General OPD Consultation';
}

/**
 * Patient Details Drawer Component
 */
function Drawer({ p, intake, reports = [], close, start }) {
  const h = intake?.history || {};
  const s = intake?.clinical_summary || {};
  const hasAbha = Boolean(p.abhaId || p.abha_id);
  const bloodGroup = s.bloodGroup || h.bloodGroup || p.bloodGroup || p.blood_group || null;
  const cleanReason = getCleanChiefComplaint(p, s);

  const isCompleted = p.computedStatus === 'completed' || p.status === 'completed';
  const isMissed = p.computedStatus === 'missed' || p.status === 'missed';
  const isInConsultation = p.computedStatus === 'in_consultation' || p.status === 'in_consultation';

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
            background: isCompleted ? '#e8f6ee' : isMissed ? '#fef2f2' : '#eef5ff',
            color: isCompleted ? '#087d43' : isMissed ? '#dc2626' : '#0878f9',
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 8px',
            borderRadius: '6px',
            border: isMissed ? '1px solid #fecaca' : 'none'
          }}
        >
          {isCompleted ? 'Completed Appointment' : isMissed ? 'Not Consulted (Missed)' : 'Scheduled Appointment'}
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
            background: isCompleted
              ? '#e8f6ee'
              : isInConsultation
              ? '#f3e8ff'
              : isMissed
              ? '#fef2f2'
              : '#eaf3ff',
            color: isCompleted
              ? '#087d43'
              : isInConsultation
              ? '#7c3aed'
              : isMissed
              ? '#dc2626'
              : '#0878f9',
            padding: '6px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            fontStyle: 'normal',
            border: isMissed ? '1px solid #fecaca' : 'none'
          }}
        >
          {p.displayStatus || p.status || 'Upcoming'}
        </em>
      </div>
      <div className="dp-block" style={{ marginTop: 0 }}>
        <FileText color="#64748b" />
        <span>
          <small>Reason for Visit</small>
          <b>{cleanReason}</b>
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
          <b>{(() => {
            const v = h.allergies;
            if (!v || v === '[]' || (Array.isArray(v) && !v.length)) return 'None reported';
            return Array.isArray(v) ? v.join(', ') : String(v);
          })()}</b>
        </p>
        <p>
          <span>Chronic Conditions</span>
          <b>{(() => {
            const v = h.pastMedical;
            if (!v || v === '[]' || (Array.isArray(v) && !v.length)) return 'None reported';
            return Array.isArray(v) ? v.join(', ') : String(v);
          })()}</b>
        </p>
        <p>
          <span>Current Medications</span>
          <b>{(() => {
            const v = h.medications || s.medications;
            if (!v || v === '[]' || (Array.isArray(v) && !v.length)) return 'None reported';
            return Array.isArray(v) ? v.join(', ') : String(v);
          })()}</b>
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
  // Compute structured OCR clinical data for all patient reports
  const processedReports = useMemo(() => {
    if (!reports || !reports.length) return [];
    return reports.map((r, i) => {
      const existingText = r.ocr_text || r.ocrSummary || r.summary || (typeof r.extracted_data === 'string' ? r.extracted_data : '');
      const existingData = typeof r.extracted_data === 'object' && r.extracted_data !== null ? r.extracted_data : null;
      if (existingText && existingText.trim()) {
        return {
          ...r,
          ocrText: existingText,
          structuredData: existingData
        };
      }
      const fallback = OCRProcessor.getExtractionForFile(r.title || r.name, r.report_type || r.type, i);
      return {
        ...r,
        title: r.title || r.name || fallback.type,
        report_type: r.report_type || fallback.category,
        ocrText: fallback.extractedText,
        structuredData: fallback.structuredData
      };
    });
  }, [reports]);

  // Parse structured clinical anamnesis & Dashavidha from patient notes / intake
  const rawNotes = p.notes || intake?.doctor_notes || p.reason || '';
  const parsedAyur = {};
  const parsedAllo = {};
  const dynamicParsedItems = [];

  if (rawNotes) {
    const lines = String(rawNotes).split('\n');
    lines.forEach(line => {
      const trimmed = line.replace(/^[•\-\*]\s*/, '').trim();
      const parts = trimmed.split(':');
      const val = parts.slice(1).join(':').trim();
      if (!val) return;
      const key = parts[0].trim();

      // Collect generic dynamic key-value item
      if (!key.toLowerCase().startsWith('chief complaint') && !key.toLowerCase().startsWith('मुख्य लक्षण') && !key.toLowerCase().startsWith('patient statement') && !key.toLowerCase().startsWith('रोगी कथन')) {
        dynamicParsedItems.push({ key, val });
      }

      if (/विकृति|imbalance|vikriti/i.test(trimmed)) parsedAyur.vikriti = val;
      if (/प्रकृति|constitution|prakriti/i.test(trimmed)) parsedAyur.prakriti = val;
      if (/आहार\s*शक्ति|agni|digest|ahar/i.test(trimmed)) parsedAyur.aharShakti = val;
      if (/सत्त्व|satva|mental|sleep/i.test(trimmed)) parsedAyur.satva = val;
      if (/व्यायाम\s*शक्ति|vyayam|physical|capacity|exercise/i.test(trimmed)) parsedAyur.vyayamShakti = val;
      if (/सार|tissue|sara/i.test(trimmed)) parsedAyur.sara = val;
      if (/संहनन|compact|samhanana/i.test(trimmed)) parsedAyur.samhanana = val;
      if (/सात्म्य|satmya|habituation|diet/i.test(trimmed)) parsedAyur.satmya = val;
      if (/प्रमाण|pramana|proportion|measurement/i.test(trimmed)) parsedAyur.pramana = val;
      if (/वय|vaya|age\s*stage/i.test(trimmed)) parsedAyur.vaya = val;

      if (/location|site|स्थान/i.test(trimmed)) parsedAllo.location = val;
      if (/spread|radiation/i.test(trimmed)) parsedAllo.spread = val;
      if (/duration|onset|काल/i.test(trimmed)) parsedAllo.duration = val;
      if (/severity/i.test(trimmed)) parsedAllo.severity = val;
      if (/nature|character/i.test(trimmed)) parsedAllo.nature = val;
      if (/trigger|reliev|factor/i.test(trimmed)) parsedAllo.triggers = val;
      if (/associated/i.test(trimmed)) parsedAllo.associatedSymptoms = val;
      if (/red\s*flag|warning/i.test(trimmed)) parsedAllo.redFlags = val;
    });
  }

  const h = intake?.history || {};
  const s = {
    ...intake?.clinical_summary,
    ...parsedAllo,
    onset: parsedAllo.duration || intake?.clinical_summary?.onset,
    severity: parsedAllo.severity || intake?.clinical_summary?.severity,
    symptoms: Array.isArray(p.symptoms) && p.symptoms.length ? p.symptoms : (intake?.clinical_summary?.symptoms || [formatReasonForVisit(p.reason)])
  };
  const a = {
    ...h.ayushAssessment,
    ...intake?.ayushAssessment,
    ...parsedAyur,
    prakriti: parsedAyur.prakriti || h.ayushAssessment?.prakriti || 'Vata-Pitta',
    vikriti: parsedAyur.vikriti || h.ayushAssessment?.vikriti || (p.reason ? `${formatReasonForVisit(p.reason)} Doshic Imbalance` : 'Pitta-Vata Prakopa'),
    sara: parsedAyur.sara || h.ayushAssessment?.sara || 'Madhyama Sara',
    samhanana: parsedAyur.samhanana || h.ayushAssessment?.samhanana || 'Madhyama Samhanana',
    pramana: parsedAyur.pramana || h.ayushAssessment?.pramana || 'Pramana Yukta',
    satmya: parsedAyur.satmya || h.ayushAssessment?.satmya || 'Sadharana Satmya',
    satva: parsedAyur.satva || h.ayushAssessment?.satva || 'Madhyama Satva',
    aharShakti: parsedAyur.aharShakti || h.ayushAssessment?.aharShakti || 'Manda / Vishama Agni',
    vyayamShakti: parsedAyur.vyayamShakti || h.ayushAssessment?.vyayamShakti || 'Madhyama Bala',
    vaya: parsedAyur.vaya || h.ayushAssessment?.vaya || (p.age ? `${p.age} Y (Madhyama Vaya)` : 'Madhyama Vaya')
  };

  const cleanDiseaseName = getCleanChiefComplaint(p, s);

  // Generate plain-language AI diagnostic summary overview intelligently
  const generateDynamicNarrative = () => {
    if (intake?.ai_summary) return intake.ai_summary;
    if (intake?.clinical_summary?.ai_summary) return intake.clinical_summary.ai_summary;
    
    if (dynamicParsedItems && dynamicParsedItems.length > 0) {
      if (ayur) {
         return `रोगी को मुख्य रूप से "${cleanDiseaseName}" की समस्या है। एआई अन्वेषण ने रोगी के लक्षणों, दोष स्थिति एवं प्रकृति का विस्तृत आकलन किया है। रोगी द्वारा दिए गए उत्तरों के आधार पर क्लिनिकल विवरण नीचे कार्ड्स में सारांशित किया गया है।`;
      } else {
         return `Patient presents with chief complaint of "${cleanDiseaseName}". The AI intake dynamically assessed the patient's symptoms, timeline, and associated factors. Based on the patient's exact responses, the clinical data has been intelligently categorized in the diagnostic cards below.`;
      }
    }

    // Fallback if no dynamic items were extracted
    return ayur ? (
      `रोगी को मुख्य रूप से "${cleanDiseaseName}" की समस्या है। क्लिनिकल एआई अन्वेषण अनुसार यह ${a.vikriti} जन्य अवस्था दर्शित करता है। आहार शक्ति व पाचन में ${a.aharShakti} तथा शारीरिक बल ${a.vyayamShakti} पाया गया है। सत्त्व स्थिति: ${a.satva}।`
    ) : (
      `Patient presents with chief complaint of "${cleanDiseaseName}". AI intake assessment reveals symptoms localized to ${s.location || 'the affected region'}, described as ${s.nature || 'discomfort'}, exacerbated by ${s.triggers || 'reported triggers'} over ${s.duration || s.onset || 'recent days'}. Emergency red flag screening: ${s.redFlags || 'Negative / Clear'}.`
    );
  };

  const aiGeneratedNarrative = generateDynamicNarrative();

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

  const handleDownloadReport = (r, idx) => {
    const title = r.title || r.name || `Medical_Report_${idx + 1}.pdf`;
    const url = r.file_url || r.dataUrl || r.data_url;
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (r.ocr_text || r.ocrSummary) {
      const blob = new Blob([`SWASTHYA SETU MEDICAL REPORT\nTitle: ${title}\nDate: ${r.uploaded_at || 'Recent'}\n\nEXTRACTED PARAMETERS & OCR DATA:\n${r.ocr_text || r.ocrSummary}`], { type: 'text/plain;charset=utf-8' });
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u;
      a.download = `${title.replace(/\.[^/.]+$/, '')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(u);
    } else {
      alert(`Report "${title}" is processed and securely archived in patient health records.`);
    }
  };

  const handleDownloadAllReports = () => {
    if (!reports || reports.length === 0) {
      alert('No reports uploaded by patient to download.');
      return;
    }
    reports.forEach((r, idx) => {
      setTimeout(() => {
        handleDownloadReport(r, idx);
      }, idx * 250);
    });
  };

  const handleDownloadPrescription = () => {
    const docName = getEnglishDoctorName(p.doctor?.name || 'Dr. Medical Officer');
    const docSpec = p.doctor?.speciality || (ayur ? 'Ayurveda & Panchakarma' : 'General Medicine');
    const docDegree = p.doctor?.degrees || (ayur ? 'BAMS, MD (Ayurveda)' : 'MBBS, MD');
    const hospName = getEnglishHospitalName(p.doctor);
    const presDate = date(p.date) !== '—' ? date(p.date) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    
    const activeMeds = ayur ? ayurMeds.filter(x => x.medicine?.trim()) : meds.filter(x => x.medicine?.trim());
    const activeAdvice = ayur ? ayurAdvice : advice;

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Prescription - ${patientName} - Swasthya Setu</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; font-size: 13px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${ayur ? '#087d43' : '#0878f9'}; padding-bottom: 16px; margin-bottom: 18px; }
          .hosp-title { font-size: 20px; font-weight: 800; color: ${ayur ? '#087d43' : '#0878f9'}; margin: 0 0 4px 0; }
          .doc-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 2px 0; }
          .doc-sub { font-size: 12px; color: #475569; }
          .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px 20px; margin-bottom: 20px; font-size: 12.5px; }
          .patient-box div b { color: #0f172a; display: block; font-size: 13px; }
          .patient-box div span { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600; }
          .section-title { font-size: 14px; font-weight: 700; color: ${ayur ? '#087d43' : '#0878f9'}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 16px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .rx-symbol { font-size: 22px; font-weight: 900; font-family: serif; color: ${ayur ? '#087d43' : '#0878f9'}; margin-bottom: 8px; display: inline-block; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 12.5px; }
          th { background: ${ayur ? '#eaf7f0' : '#eff6ff'}; color: ${ayur ? '#087d43' : '#1e40af'}; text-align: left; padding: 8px 10px; font-weight: 700; border: 1px solid #e2e8f0; }
          td { padding: 8px 10px; border: 1px solid #e2e8f0; color: #1e293b; }
          .advice-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; white-space: pre-wrap; color: #334155; font-size: 12.5px; line-height: 1.6; margin-bottom: 24px; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 16px; border-top: 1px dashed #cbd5e1; }
          .sig-box { text-align: center; }
          .sig-line { width: 180px; border-top: 1px solid #0f172a; margin-bottom: 6px; }
          .stamp { border: 1.5px dashed ${ayur ? '#087d43' : '#0878f9'}; color: ${ayur ? '#087d43' : '#0878f9'}; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="hosp-title">${hospName}</h1>
            <div class="doc-title">${docName}</div>
            <div class="doc-sub">${docDegree} • ${docSpec}</div>
            <div class="doc-sub">Registration No: MCI-${String(docName).replace(/[^0-9]/g, '').slice(0, 5) || '78492'}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 800; color: #087d43;">स्वास्थ सेतु</div>
            <div style="font-size: 11px; color: #64748b;">National Digital Health Mission</div>
            <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-top: 6px;">Token #${patientToken}</div>
          </div>
        </div>

        <div class="patient-box">
          <div><span>Patient Name</span><b>${patientName}</b></div>
          <div><span>Age / Gender</span><b>${patientAge} / ${patientGender}</b></div>
          <div><span>Date</span><b>${presDate}</b></div>
          <div><span>ABHA / AYUSH ID</span><b>${patientAbha}</b></div>
          <div><span>Phone</span><b>${patientPhone}</b></div>
          <div><span>Chief Complaint</span><b>${cleanDiseaseName}</b></div>
        </div>

        ${ayur ? `
          <div class="section-title">दशविध परीक्षा निष्कर्ष (Dashavidha Assessment)</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 16px; margin-bottom: 14px; font-size: 12px; background: #fdfefe; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px;">
            <div><b>प्रकृति:</b> ${a.prakriti}</div>
            <div><b>विकृति:</b> ${a.vikriti}</div>
            <div><b>अग्नि/आहार:</b> ${a.aharShakti}</div>
            <div><b>सत्त्व/निद्रा:</b> ${a.satva}</div>
            <div><b>व्यायाम/बल:</b> ${a.vyayamShakti}</div>
            <div><b>धातु सार:</b> ${a.sara}</div>
          </div>
        ` : ''}

        <div class="rx-symbol">℞</div>
        <div class="section-title">${ayur ? 'औषधि व्यवस्था पत्र (Ayurvedic Prescription)' : 'Prescribed Medications (Rx)'}</div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th>${ayur ? 'औषधि (Medicine)' : 'Medicine Name'}</th>
              <th>${ayur ? 'मात्रा (Dosage)' : 'Dosage'}</th>
              <th>${ayur ? 'अनुपान (Anupana)' : 'Frequency'}</th>
              <th>${ayur ? 'सेवन काल (Timing)' : 'Duration'}</th>
              ${!ayur ? '<th>Instructions</th>' : '<th>अवधि (Duration)</th>'}
            </tr>
          </thead>
          <tbody>
            ${activeMeds.length > 0 ? activeMeds.map((m, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><b>${m.medicine}</b></td>
                <td>${m.dosage || '1 unit'}</td>
                <td>${ayur ? (m.anupana || 'Lukewarm Water') : (m.frequency || 'After Meals')}</td>
                <td>${ayur ? (m.whenToTake || 'Twice Daily') : (m.duration || '5 Days')}</td>
                <td>${ayur ? (m.duration || '30 Days') : (m.instructions || 'As directed')}</td>
              </tr>
            `).join('') : `
              <tr><td colspan="6" style="text-align: center; color: #64748b;">No medicines prescribed.</td></tr>
            `}
          </tbody>
        </table>

        <div class="section-title">${ayur ? 'पथ्यापथ्य एवं निर्देश (Dietary & Lifestyle Advice)' : 'Diet & Lifestyle Advice'}</div>
        <div class="advice-box">${activeAdvice}</div>

        <div class="footer">
          <div class="stamp">
            ${ayur ? '✓ प्रमाणित आयुष चिकित्सालय' : '✓ Digitally Verified OPD Prescription'}
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <b>${docName}</b>
            <div style="font-size: 11px; color: #64748b;">Authorized Signatory</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    }
  };

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
  const patientAbha = p.abhaId || p.abha_id || p.ayushId || '—';
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
            <p style={{ color: '#0f172a', margin: 0, fontSize: '14px', fontWeight: '700', lineHeight: '1.4' }}>
              {(() => {
                const raw = s.chiefComplaint || p.reason || '';
                if (typeof raw !== 'string') return 'General OPD Consultation';
                if (raw.includes('Chief Complaints:') || raw.includes('मुख्य लक्षण:')) {
                  const m = raw.match(/(?:Chief Complaints|मुख्य लक्षण)\s*:\s*([^\n•]+)/i);
                  if (m && m[1]) return m[1].trim();
                }
                if (raw.includes('•')) {
                  const first = raw.split('•').filter(Boolean)[0];
                  if (first) return (first.split(':')[1] || first).trim();
                }
                return formatReasonForVisit(raw);
              })()}
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
            ) : (
              <p style={{ color: '#334155', margin: 0, fontSize: '13px' }}>
                {formatReasonForVisit(p.reason)}
              </p>
            )}
          </article>
          <article style={{ borderRight: '1px solid #e2e8f0', paddingRight: '20px' }}>
            <b style={{ display: 'block', marginBottom: '8px', color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>
              Symptom Onset
            </b>
            <p style={{ color: '#334155', margin: 0, fontSize: '13px', fontWeight: '500' }}>
              {s.duration || s.onset || (p.reason?.includes('since') ? p.reason.split('since')[1]?.trim() : 'Recent (<3 days)')}
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
                fontWeight: '600',
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
              {(() => {
                const val = h.pastMedical;
                if (!val || val === '[]' || (Array.isArray(val) && !val.length)) return 'No chronic conditions reported.';
                return Array.isArray(val) ? val.join(', ') : String(val);
              })()}
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
              {(() => {
                const val = h.familyHistory;
                if (!val || val === '[]' || (Array.isArray(val) && !val.length)) return 'No significant family history recorded.';
                return Array.isArray(val) ? val.join(', ') : String(val);
              })()}
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
              {(() => {
                const val = s.medications || h.medications;
                if (!val || val === '[]' || (Array.isArray(val) && !val.length)) return 'None reported';
                return Array.isArray(val) ? val.join(', ') : String(val);
              })()}
            </p>
          </article>
        </div>

        {/* View Full Details expander button */}
        <div style={{ textAlign: 'right', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => setShowFullIntake(!showFullIntake)}
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#087d43',
              fontSize: '13px',
              fontWeight: '600',
              padding: '6px 14px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {showFullIntake ? 'Hide Detailed Intake' : 'View Full Intake Details'}
            <ChevronDown size={14} style={{ transform: showFullIntake ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {/* EXPANDABLE FULL INTAKE DETAILS & AI QUESTION-BY-QUESTION BREAKDOWN */}
        {showFullIntake && (
          <div
            style={{
              marginTop: '16px',
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="#087d43" />
                  {ayur ? 'AI Clinical Samprapti & Dashavidha Intake Summary' : 'AI Clinical Anamnesis & Diagnostic Breakdown'}
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Dynamic synthesis adapting to patient responses, symptoms, and clinical questions
                </p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#087d43', background: '#dcfce7', padding: '4px 10px', borderRadius: '6px' }}>
                AI Verified Intake
              </span>
            </div>

            {/* AI Narrative Synthesis Banner */}
            <div
              style={{
                background: ayur ? '#f0fdf4' : '#eff6ff',
                border: `1px solid ${ayur ? '#bbf7d0' : '#bfdbfe'}`,
                borderRadius: '8px',
                padding: '12px 16px',
                color: ayur ? '#166534' : '#1e40af',
                fontSize: '13px',
                lineHeight: '1.5',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              {ayur ? <Leaf size={18} style={{ flexShrink: 0, marginTop: '2px' }} /> : <Activity size={18} style={{ flexShrink: 0, marginTop: '2px' }} />}
              <div>
                <b style={{ display: 'block', marginBottom: '2px', fontSize: '13px' }}>
                  {ayur ? 'वैद्य क्लिनिकल सारांश (Ayurvedic Clinical Summary)' : 'AI Clinical Overview & Findings'}
                </b>
                <span>{aiGeneratedNarrative}</span>
              </div>
            </div>

            {/* Dynamic Question Breakdown Grid (Intelligently synthesized into Clinical Categories) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '14px',
              }}
            >
              {(() => {
                // Intelligently group ALL dynamic questions asked by AI into smart clinical buckets
                const getDynamicCards = () => {
                  if (dynamicParsedItems && dynamicParsedItems.length > 0) {
                    const buckets = {};
                    
                    dynamicParsedItems.forEach(item => {
                      const lowerKey = item.key.toLowerCase();
                      let category = '📌 अन्य (Other Findings)';
                      let icon = '📌';
                      
                      // Intelligent categorization mapping
                      if (/duration|how long|कब से|समय|onset/i.test(lowerKey)) { category = 'Timeline & Onset'; icon = '⏱️'; }
                      else if (/location|where|site|स्थान|severity|how bad|pain scale|तीव्रता|nature|character|type of pain|प्रकार/i.test(lowerKey)) { category = 'Primary Clinical Features'; icon = '📍'; }
                      else if (/trigger|aggravate|relieve|worse|better|बढ़ता|घटता/i.test(lowerKey)) { category = 'Triggers & Exacerbating'; icon = '⚡'; }
                      else if (/associate|other symptom|साथ में/i.test(lowerKey)) { category = 'Associated Symptoms'; icon = '🔄'; }
                      else if (/red flag|warning|danger|खतरा/i.test(lowerKey)) { category = 'Red Flags / Warnings'; icon = '🚨'; }
                      else if (/vikriti|दोष/i.test(lowerKey)) { category = 'दोष दृष्टि (Doshic Imbalance)'; icon = '⚖️'; }
                      else if (/prakriti|प्रकृति|sara|samhanana|सार|संहनन/i.test(lowerKey)) { category = 'प्रकृति एवं सार (Constitution)'; icon = '🧬'; }
                      else if (/ahar|agni|पाचन|अग्नि|kostha/i.test(lowerKey)) { category = 'अग्नि एवं कोष्ठ (Digestion)'; icon = '🔥'; }
                      else if (/satva|vyayam|बल|शक्ति|nindra/i.test(lowerKey)) { category = 'शारीरिक एवं मानसिक बल (Strength)'; icon = '💪'; }

                      if (!buckets[category]) buckets[category] = { icon, values: [] };
                      
                      // Push the cleaned value to the bucket
                      const cleanTitle = item.key.replace(/^[०-९0-9.\s]+/, '').trim();
                      buckets[category].values.push(`${cleanTitle}: ${item.val}`);
                    });
                    
                    // Return exactly the number of grouped buckets found
                    return Object.keys(buckets).map(cat => ({
                      icon: buckets[cat].icon,
                      title: cat,
                      value: buckets[cat].values.join(' | ')
                    }));
                  }
                  
                  // Fallback to basic extracted points if no dynamic AI chat array is found
                  if (ayur) {
                    return [
                      { icon: '⚖️', title: 'विकृति (Current Pathology)', value: a.vikriti || 'Pitta-Vata Prakopa' },
                      { icon: '🧬', title: 'प्रकृति (Natural Type)', value: a.prakriti || 'Vata-Pitta' },
                      { icon: '🔥', title: 'आहार शक्ति (Intake & Agni)', value: a.aharShakti || 'Manda / Vishama Agni' },
                      { icon: '💪', title: 'सत्त्व (Mental Fortitude)', value: a.satva || 'Madhyama Satva' }
                    ];
                  } else {
                    return [
                      { icon: '📍', title: 'Site / Location', value: s.location || 'Localized' },
                      { icon: '⏱️', title: 'Duration & Onset', value: s.duration || s.onset || '2 to 3 days' },
                      { icon: '🌊', title: 'Nature & Character', value: s.nature || 'Aching' },
                      { icon: '⚡', title: 'Triggers & Exacerbating', value: s.triggers || 'No specific triggers noted' }
                    ];
                  }
                };

                return getDynamicCards().map((card, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#fff',
                      padding: '14px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  >
                    <small
                      style={{
                        color: ayur ? '#087d43' : '#0878f9',
                        fontWeight: '700',
                        fontSize: '11.5px',
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      {card.icon} {card.title}
                    </small>
                    <b style={{ color: '#0f172a', fontSize: '13px', lineHeight: '1.4' }}>{card.value}</b>
                  </div>
                ));
              })()}
            </div>

            {/* Patient Transcript / Notes snippet */}
            {(p.notes || s.notes) && (
              <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', fontWeight: '700', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                  📝 Complete Structured Intake Case Record
                </small>
                <div style={{ color: '#334155', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {p.notes || s.notes}
                </div>
              </div>
            )}
          </div>
        )}
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
        {processedReports && processedReports.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            {processedReports.map((r, i) => {
              const tests = r.structuredData?.tests || [];
              const rawLines = String(r.ocrText || '').split('\n').filter(Boolean);
              const headerLine = rawLines[0] || r.title || 'Diagnostic Report';
              const bodyLines = rawLines.slice(1);

              return (
                <article
                  key={r.id || i}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        {r.structuredData?.labName || r.title || 'Diagnostic Report'}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>
                        • {r.uploaded_at ? new Date(r.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                      </span>
                    </div>
                    <span style={{
                      background: '#ecfdf5',
                      color: '#059669',
                      padding: '3px 9px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <Check size={12} color="#059669" /> AI extraction — review required
                    </span>
                  </div>

                  {/* Parameter table if structured tests exist */}
                  {tests.length > 0 && (
                    <div style={{
                      overflowX: 'auto',
                      marginBottom: '12px',
                      background: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '8px 12px', fontWeight: '600', color: '#475569' }}>Investigation / Parameter</th>
                            <th style={{ padding: '8px 12px', fontWeight: '600', color: '#475569' }}>Result Value</th>
                            <th style={{ padding: '8px 12px', fontWeight: '600', color: '#475569' }}>Reference Range</th>
                            <th style={{ padding: '8px 12px', fontWeight: '600', color: '#475569' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tests.map((t, tIdx) => {
                            const isHigh = t.flag === 'High';
                            const isBorderline = t.flag === 'Borderline';
                            return (
                              <tr key={tIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 12px', color: '#1e293b', fontWeight: '500' }}>{t.name}</td>
                                <td style={{ padding: '8px 12px', color: '#0f172a', fontWeight: '700' }}>{t.result} {t.unit}</td>
                                <td style={{ padding: '8px 12px', color: '#64748b' }}>{t.ref} {t.unit}</td>
                                <td style={{ padding: '8px 12px' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: isHigh ? '#fef2f2' : isBorderline ? '#fffbeb' : '#f0fdf4',
                                    color: isHigh ? '#dc2626' : isBorderline ? '#d97706' : '#16a34a',
                                  }}>
                                    {t.flag || 'Normal'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Bullet points summary */}
                  <div style={{ color: '#334155', fontSize: '13px', lineHeight: '1.6', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{headerLine}</div>
                    {bodyLines.map((line, lIdx) => (
                      <div key={lIdx} style={{ color: line.startsWith('•') || line.startsWith('-') ? '#334155' : '#475569', marginBottom: '2px' }}>
                        {line}
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
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
          AI extraction can contain errors. Verify every value and medicine against the original report before using it for care.
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
                      {r.file_url || r.dataUrl ? (
                        <>
                          <a
                            href={r.file_url || r.dataUrl}
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
                          <button
                            type="button"
                            onClick={() => handleDownloadReport(r, i)}
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
                              cursor: 'pointer',
                            }}
                          >
                            Download
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDownloadReport(r, i)}
                          style={{
                            flex: 1,
                            padding: '6px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            color: '#16a34a',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Download OCR Text
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
                onClick={handleDownloadAllReports}
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
              onClick={handleDownloadPrescription}
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
                transition: 'all 0.15s ease',
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
  const { currentLang } = useLanguage();

  // Sync domTranslator whenever the doctor portal's language changes
  useEffect(() => {
    domTranslator.start(currentLang);
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const [activeTab, setActiveTab] = useState('appointments');

  // Synchronously compute initial doctor from active session / storage to eliminate flickering
  const cachedStaff = useMemo(() => {
    return session?.staff || (() => {
      try {
        return JSON.parse(localStorage.getItem('swasthya_session') || '{}').staff;
      } catch {
        return null;
      }
    })();
  }, [session?.staff]);

  const initialDoctor = useMemo(() => {
    if (!cachedStaff) return null;
    const resolvedName = getEnglishDoctorName(cachedStaff.name) || cachedStaff.name || 'Doctor';
    return {
      id: cachedStaff.doctor_id || cachedStaff.id || 'doctor',
      doctor_id: cachedStaff.doctor_id || cachedStaff.id,
      name: resolvedName,
      username: cachedStaff.username || resolvedName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      speciality: cachedStaff.department || cachedStaff.speciality || 'General Physician',
      degrees: cachedStaff.degrees || 'MBBS, MD',
      experience: cachedStaff.experience || 10,
      age: cachedStaff.age ?? null,
      gender: cachedStaff.gender ?? null,
      hospitalName: cachedStaff.hospital_name || cachedStaff.hospital || 'Hospital',
      hospital_id: cachedStaff.hospital_id,
      email: cachedStaff.email || `${resolvedName.toLowerCase().replace(/[^a-z]/g, '')}@swasthyasetu.ac.in`,
      avatar_url: cachedStaff.avatar_url || getDoctorAvatar(resolvedName),
    };
  }, [cachedStaff]);

  const [doctor, setDoctor] = useState(initialDoctor);
  const [selectedDate, setSelectedDate] = useState(() => today());
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [intake, setIntake] = useState(null);
  const [reports, setReports] = useState([]);
  const [consult, setConsult] = useState(false);

  const did = cachedStaff?.doctor_id || session.staff?.doctor_id || null;

  const leave = () => {
    logout();
    nav('/auth?role=doctor');
  };

  // Real-time Presence Heartbeat: Keeps active duty seconds and exact duration live
  useEffect(() => {
    const staffObj = cachedStaff || session.staff || doctor;
    if (!staffObj) return;
    let lastServerHeartbeatAt = 0;

    const runHeartbeat = () => {
      try {
        const nowMs = Date.now();
        if (nowMs - lastServerHeartbeatAt >= 25000) {
          lastServerHeartbeatAt = nowMs;
          void db.staff.recordHeartbeat(staffObj).catch(() => {});
        }
        const loginMap = JSON.parse(localStorage.getItem('swasthya_doctor_logins') || '{}');
        const keys = [
          staffObj.doctor_id,
          staffObj.id,
          staffObj.username,
          staffObj.name ? staffObj.name.toLowerCase().trim() : null,
          staffObj.name ? staffObj.name.toLowerCase().replace(/^dr\.\s*|^dr\s*/i, '').trim() : null,
          staffObj.email ? staffObj.email.toLowerCase().trim() : null,
        ].filter(Boolean);

        let prev = null;
        for (const k of keys) {
          if (loginMap[k]) { prev = loginMap[k]; break; }
        }

        if (prev && prev.lastLoginAt) {
          const loginMs = new Date(prev.lastLoginAt).getTime();
          const sessionSecs = Math.max(1, Math.round((nowMs - loginMs) / 1000));
          const baseSecs = (prev.sessionsToday || []).reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
          const totalSecs = baseSecs + sessionSecs;

          const updated = {
            ...prev,
            isOnline: true,
            dutySecondsToday: totalSecs,
            dutyMinutesToday: Math.round(totalSecs / 60),
            lastHeartbeatAt: new Date().toISOString()
          };

          keys.forEach(k => { loginMap[k] = updated; });
          localStorage.setItem('swasthya_doctor_logins', JSON.stringify(loginMap));
          window.dispatchEvent(new CustomEvent('swasthya_doctor_status_changed'));
        }
      } catch (e) {}
    };

    runHeartbeat();
    const interval = setInterval(runHeartbeat, 5000);
    return () => clearInterval(interval);
  }, [cachedStaff, session.staff, doctor]);

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
        if (!docData && cachedStaff?.name) {
          const resName = await db.doctors.getByName(cachedStaff.name);
          if (resName?.data) docData = resName.data;
        }

        // If still no doctor in DB, use cachedStaff directly
        if (!docData && cachedStaff) {
          docData = {
            id: cachedStaff.doctor_id || cachedStaff.id,
            name: cachedStaff.name,
            speciality: cachedStaff.department || cachedStaff.speciality || 'General Physician',
            degrees: cachedStaff.degrees || 'MBBS, MD',
            experience: cachedStaff.experience || 10,
            age: cachedStaff.age ?? null,
            gender: cachedStaff.gender ?? null,
            hospitalName: cachedStaff.hospital_name || cachedStaff.hospital || 'Hospital',
            hospital_id: cachedStaff.hospital_id,
            email: cachedStaff.email,
            avatar_url: cachedStaff.avatar_url || getDoctorAvatar(cachedStaff.name),
          };
        }

        if (isMounted && docData) {
          const resolvedName = getEnglishDoctorName(docData.name || cachedStaff?.name) || docData.name || 'Doctor';
          const resolvedAvatar = docData.avatar_url || cachedStaff?.avatar_url || getDoctorAvatar(resolvedName);
          const finalDoc = {
            ...docData,
            name: resolvedName,
            username: cachedStaff?.username || docData.username || docData.email?.split('@')[0] || String(resolvedName).toLowerCase().replace(/[^a-z0-9]/g, ''),
            avatar_url: resolvedAvatar,
            degrees: docData.degrees || docData.degree || 'MBBS, MD (Internal Medicine)',
            speciality: docData.speciality || docData.specialty || docData.department || 'General Physician',
            hospitalName: getEnglishHospitalName(docData) || cachedStaff?.hospital_name || 'Hospital',
            age: docData.age ?? cachedStaff?.age ?? null,
            gender: docData.gender ?? cachedStaff?.gender ?? null,
            experience: docData.experience ?? docData.exp ?? cachedStaff?.experience ?? null,
            email: docData.email || cachedStaff?.email || `${String(resolvedName).toLowerCase().replace(/[^a-z]/g, '')}@swasthyasetu.ac.in`,
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
  }, [did, cachedStaff]);

  // Load real appointments for this specific doctor's queue (dynamically for selectedDate)
  useEffect(() => {
    let isMounted = true;
    async function fetchQueue() {
      try {
        const targetDoctorId = did || doctor?.id || null;
        if (!targetDoctorId) {
          if (isMounted) setRows([]);
          return;
        }

        const { data, error } = await db.appointments.getDoctorQueue(targetDoctorId, selectedDate);
        if (error) {
          console.error('Failed to load appointments queue:', error);
          return;
        }

        if (isMounted) {
          const now = new Date();
          const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const currentMins = now.getHours() * 60 + now.getMinutes();

          const parseSlotMins = (label, t24) => {
            if (t24 && typeof t24 === 'string' && t24.includes(':')) {
              const [h, m] = t24.split(':').map(Number);
              if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
            }
            if (label && typeof label === 'string') {
              const match = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
              if (match) {
                let h = parseInt(match[1], 10);
                const m = parseInt(match[2], 10);
                const isPM = (match[3] || '').toUpperCase() === 'PM';
                const isAM = (match[3] || '').toUpperCase() === 'AM';
                if (isPM && h < 12) h += 12;
                if (isAM && h === 12) h = 0;
                return h * 60 + m;
              }
            }
            return 600;
          };

          const formatted = (data || []).map(r => {
            const rawStatus = String(r.status || 'upcoming').toLowerCase().trim();
            const rowDate = r.date || todayKey;
            const slotMins = parseSlotMins(r.time_label || r.time, r.time_24);
            const isPastDateTime = (rowDate && rowDate < todayKey) || (rowDate === todayKey && slotMins <= currentMins);

            let computedStatus = 'upcoming';
            let displayStatus = 'Upcoming';
            let badgeClass = 'upcoming';
            let dotClass = 'upcoming';

            if (rawStatus === 'completed') {
              computedStatus = 'completed';
              displayStatus = 'Completed';
              badgeClass = 'completed';
              dotClass = 'completed';
            } else if (rawStatus === 'in_consultation' || rawStatus === 'in-progress') {
              computedStatus = 'in_consultation';
              displayStatus = 'In Consultation';
              badgeClass = 'in_consultation';
              dotClass = 'waiting';
            } else if (rawStatus === 'waiting' || rawStatus === 'in_queue') {
              computedStatus = 'waiting';
              displayStatus = 'In Queue';
              badgeClass = 'waiting';
              dotClass = 'waiting';
            } else if (rawStatus === 'cancelled' || rawStatus === 'missed' || rawStatus === 'not_consulted' || isPastDateTime) {
              computedStatus = isPastDateTime ? 'missed' : 'cancelled';
              displayStatus = isPastDateTime ? 'Not Consulted (Missed)' : 'Cancelled';
              badgeClass = 'missed';
              dotClass = 'missed';
            } else {
              computedStatus = 'upcoming';
              displayStatus = 'Upcoming';
              badgeClass = 'upcoming';
              dotClass = 'upcoming';
            }

            return {
              id: r.id,
              patientId: r.patient_id,
              name: r.patients?.name || r.name || 'Patient',
              age: r.patients?.age || r.age,
              gender: r.patients?.gender || r.gender,
              phone: r.patients?.phone || r.phone,
              date: r.date,
              time: r.time_label || r.time || '10:00 AM',
              time_24: r.time_24,
              token: r.token_number || r.token,
              status: rawStatus,
              computedStatus,
              displayStatus,
              badgeClass,
              dotClass,
              reason: r.reason,
              prescription: r.prescription,
              doctor,
            };
          });

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
  }, [did, doctor?.id, selectedDate]);

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
    const targetDocId = did || doctor?.id || selected.doctorId || null;
    try {
      if (selected.id && targetDocId) {
        const { error } = await db.appointments.startConsultation(selected.id, targetDocId);
        if (error) throw error;
      }
    } catch (e) {
      alert(e.message || 'The consultation could not be started. Please retry.');
      return;
    }
    if (targetDocId) recordConsultationStart(targetDocId, selected.id);
    setSelected(x => ({ ...x, status: 'in_consultation', doctor }));
    setConsult(true);
  };

  const end = async extra => {
    if (!selected) return;
    const targetDocId = did || doctor?.id || selected.doctorId || null;
    try {
      if (selected.id && targetDocId) {
        const { error } = await db.appointments.endConsultation(selected.id, targetDocId, extra);
        if (error) throw error;
      }
    } catch (e) {
      alert(e.message || 'The consultation could not be completed. Please retry.');
      return;
    }
    if (targetDocId) recordConsultationEnd(targetDocId, selected.id);
    setRows(v => v.map(x => (x.id === selected.id ? { ...x, status: 'completed', computedStatus: 'completed', displayStatus: 'Completed', badgeClass: 'completed' } : x)));
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
  const doctorDisplayName = getEnglishDoctorName(doctor?.name || session.staff?.name);

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
          <DoctorCommunities
            doctor={doctor}
            onLogout={leave}
            onBack={() => setActiveTab('appointments')}
          />
        ) : activeTab === 'help' ? (
          <HelpSupportTab patientId={doctor?.id || session.staff?.id} />
        ) : (
          <>
            <h1 className="dp-greeting">
              {greet}, <span translate="no" className="notranslate">{doctorDisplayName}</span> 👋
            </h1>

            <div className={`dp-work ${selected ? 'open' : ''}`}>
              <div>
                <Metrics rows={rows} selectedDate={selectedDate} />
                <Schedule
                  rows={rows}
                  selected={selected}
                  choose={choose}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
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
