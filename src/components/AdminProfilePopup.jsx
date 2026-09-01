import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  MapPin,
  Mail,
  User,
  Copy,
  Check,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  LogOut,
  Clock,
  KeyRound,
} from 'lucide-react';
import { db } from '../lib/db';
import { validatePasswordStrength } from '../lib/crypto';

export default function AdminProfilePopup({
  adminName = 'Hospital Administrator',
  adminRole = 'Administrator',
  adminInitials = 'HA',
  hospital = { name: 'Sawai Man Singh Hospital', city: 'Jaipur', id: 'sms-jaipur' },
  session = null,
  onClose,
  onLogout,
}) {
  const [copiedField, setCopiedField] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwMsg, setPwMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  let activeUsername = session?.staff?.username || session?.username;
  if (!activeUsername) {
    try {
      const saved = JSON.parse(localStorage.getItem('swasthya_session') || '{}');
      activeUsername = saved?.staff?.username || saved?.username;
    } catch {}
  }
  const username = activeUsername || (hospital?.id ? `admin.${hospital.id.split('-')[0]}` : 'admin');
  const email = session?.staff?.email || `${username}@swasthyasetu.gov.in`;
  const department = session?.staff?.department || 'Central Hospital Operations';
  const facilityId = session?.staff?.hospital_id || hospital.id || 'HOSP-SMS-001';

  const handleCopy = (text, fieldName) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handlePasswordSubmit = async e => {
    e.preventDefault();
    setPwMsg({ text: '', type: '' });

    if (!currentPw) {
      setPwMsg({ text: 'Please enter your current password.', type: 'error' });
      return;
    }
    const check = validatePasswordStrength(newPw);
    if (!check.isValid) {
      setPwMsg({ text: check.message || 'Password must be at least 8 characters long with letters and numbers.', type: 'error' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await db.staff.changePassword({
        username: username,
        oldPassword: currentPw,
        newPassword: newPw,
      });

      if (error) {
        setPwMsg({ text: error.message || 'Failed to update password. Verify current password.', type: 'error' });
      } else {
        setPwMsg({ text: 'Password updated successfully in database! Use this new password for next logins.', type: 'success' });
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
        setTimeout(() => setShowPasswordForm(false), 2500);
      }
    } catch (err) {
      console.error('Admin password change error:', err);
      setPwMsg({ text: err.message || 'An unexpected error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-profile-popup-overlay" onClick={e => e.stopPropagation()}>
      <div className="admin-profile-card animate-fade-in-down">
        {/* Close Button */}
        <button
          type="button"
          className="admin-profile-close-btn"
          onClick={onClose}
          aria-label="Close profile"
          title="Close profile"
        >
          <X size={16} />
        </button>

        {/* 1. Header Profile & Avatar */}
        <div className="admin-profile-header">
          <div className="admin-profile-avatar-wrap">
            <div className="admin-profile-avatar-img">
              {adminInitials}
            </div>
            <div className="admin-profile-status-dot" title="Active Admin Session" />
          </div>

          <h3 className="admin-profile-name-lg">{adminName}</h3>
          <div className="admin-profile-role-badge">
            <ShieldCheck size={13} />
            <span>{adminRole}</span>
          </div>
          <div className="admin-profile-dept">{department}</div>
        </div>

        {/* 2. Key Hospital & Security Metadata */}
        <div className="admin-profile-meta-list">
          <div className="admin-profile-meta-item">
            <span className="admin-profile-meta-label">
              <Building2 size={14} /> Hospital
            </span>
            <span className="admin-profile-meta-val" title={hospital.name}>
              {hospital.name}
            </span>
          </div>

          <div className="admin-profile-meta-item">
            <span className="admin-profile-meta-label">
              <MapPin size={14} /> Location
            </span>
            <span className="admin-profile-meta-val">
              {hospital.city}, India
            </span>
          </div>

          <div className="admin-profile-meta-item">
            <span className="admin-profile-meta-label">
              <KeyRound size={14} /> Facility ID
            </span>
            <span className="admin-profile-meta-val font-mono">
              {facilityId.toUpperCase()}
            </span>
          </div>

          <div className="admin-profile-meta-item">
            <span className="admin-profile-meta-label">
              <Clock size={14} /> Session Window
            </span>
            <span className="admin-profile-meta-val text-emerald">
              Active (Expires at Midnight)
            </span>
          </div>
        </div>

        {/* 3. Credentials & Copyable Info */}
        <div className="admin-profile-cred-box">
          <div className="admin-profile-cred-header">
            <label>Admin Username / Portal Login</label>
          </div>
          <div className="admin-profile-cred-row">
            <User size={14} color="#087d43" />
            <span className="admin-profile-cred-text">{username}</span>
            <button
              type="button"
              className="admin-profile-copy-btn"
              onClick={() => handleCopy(username, 'user')}
              title={copiedField === 'user' ? 'Copied!' : 'Copy Username'}
            >
              {copiedField === 'user' ? <Check size={13} color="#087d43" /> : <Copy size={13} />}
            </button>
          </div>

          <div className="admin-profile-cred-row" style={{ marginTop: '6px' }}>
            <Mail size={14} color="#087d43" />
            <span className="admin-profile-cred-text">{email}</span>
            <button
              type="button"
              className="admin-profile-copy-btn"
              onClick={() => handleCopy(email, 'email')}
              title={copiedField === 'email' ? 'Copied!' : 'Copy Email'}
            >
              {copiedField === 'email' ? <Check size={13} color="#087d43" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        {/* 4. Change Password Accordion */}
        <div className="admin-profile-pw-section">
          <button
            type="button"
            className="admin-profile-accordion-btn"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            <span className="admin-profile-accordion-left">
              <Lock size={14} />
              <span>Change Security Password</span>
            </span>
            {showPasswordForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showPasswordForm && (
            <form className="admin-profile-pw-form" onSubmit={handlePasswordSubmit}>
              <div className="admin-profile-input-wrap">
                <label>Current Password</label>
                <div className="admin-profile-input-inner">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    placeholder="Current password"
                    required
                  />
                  <button
                    type="button"
                    className="admin-profile-eye-btn"
                    onClick={() => setShowCurrent(!showCurrent)}
                  >
                    {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <div className="admin-profile-input-wrap">
                <label>New Password</label>
                <div className="admin-profile-input-inner">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                  />
                  <button
                    type="button"
                    className="admin-profile-eye-btn"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <div className="admin-profile-input-wrap">
                <label>Confirm New Password</label>
                <div className="admin-profile-input-inner">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Repeat new password"
                    required
                  />
                  <button
                    type="button"
                    className="admin-profile-eye-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {pwMsg.text && (
                <div className={`admin-profile-pw-msg ${pwMsg.type}`}>
                  {pwMsg.text}
                </div>
              )}

              <button
                type="submit"
                className="admin-profile-pw-submit"
                disabled={loading}
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}
        </div>

        {/* 5. Logout Action Button */}
        <button
          type="button"
          className="admin-profile-logout-btn"
          onClick={onLogout}
        >
          <LogOut size={15} />
          <span>Sign Out of Administrator Portal</span>
        </button>
      </div>
    </div>
  );
}
