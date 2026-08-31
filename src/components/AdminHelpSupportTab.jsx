import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Building2,
  Shield,
  FileQuestion,
  Clock,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { db } from '../lib/db';

const ADMIN_FAQS = [
  {
    q: 'How do I add a new doctor or update an existing doctor’s profile?',
    a: 'Go to the "Manage Doctors" tab in the left sidebar. Click "+ Add Doctor" to enter their name, specialization, degrees, and contact details. To edit or update an existing doctor, click the three dots (⋮) in their table row and select "Edit Profile".',
  },
  {
    q: 'How do appointment bookings and tokens work for patients?',
    a: 'Patients can book appointments through the self-service kiosk or online. Each booking is assigned a unique token number (e.g. APT-20260830-001) and linked to the respective doctor’s OPD slot. Doctors can view their live patient queue on their Physician Dashboard.',
  },
  {
    q: 'How can I review and manage hospital blood and organ donation requests?',
    a: 'Navigate to the "Donations" tab. Here you can create emergency blood or organ requests with the required blood group, units, and urgency level. You can also monitor incoming community pledges and mark requests as fulfilled once units are received.',
  },
  {
    q: 'How do I change my admin password or reset staff credentials?',
    a: 'Click on your profile avatar in the top right header and expand "Change Security Password". Enter your current password and your new password to update your login credentials securely.',
  },
  {
    q: 'How does ABDM (Ayushman Bharat Digital Mission) integration work?',
    a: 'Swasthya Setu is built on ABDM standards. Patients can register using their 14-digit ABHA ID or QR code. Clinical intake summaries are structured in ABDM-compliant health record formats linked to your hospital facility ID.',
  },
  {
    q: 'Why do staff and admin sessions log out at midnight?',
    a: 'To comply with healthcare cybersecurity protocols and data protection standards, all doctor and administrator sessions automatically expire at 12:00 AM midnight. Staff simply log back in the next morning.',
  },
];

export default function AdminHelpSupportTab({
  hospital = { name: 'Sawai Man Singh Hospital', city: 'Jaipur', id: 'sms-jaipur' },
  session = null,
}) {
  const [openFaq, setOpenFaq] = useState(null);
  const [category, setCategory] = useState('Doctor Management');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState({ text: '', type: '' });
  const [copiedText, setCopiedText] = useState('');

  // Support requests list
  const [requests, setRequests] = useState([]);

  const adminId = session?.staff?.id || 'admin-root';
  const adminName = session?.staff?.name || 'Hospital Administrator';

  useEffect(() => {
    loadRequests();
  }, [adminId]);

  const loadRequests = async () => {
    try {
      const { data } = await db.support.getRequests(adminId);
      if (data) setRequests(data);
    } catch (e) {
      console.warn('Failed to load admin support requests:', e);
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setNotice({ text: 'Please fill in both the subject and message.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setNotice({ text: '', type: '' });

    try {
      const { data, error } = await db.support.createRequest({
        patientId: adminId,
        hospitalId: hospital.id,
        category: 'technical',
        subject: `[${category}] ${subject.trim()}`,
        message: `${message.trim()}\n\n-- Submitted by: ${adminName} (${hospital.name})`,
        preferredContact: 'in_app',
        language: 'en',
      });

      if (error) {
        setNotice({ text: error.message || 'Failed to submit request.', type: 'error' });
      } else {
        setNotice({ text: 'Your support request has been submitted successfully! Our support team will review it shortly.', type: 'success' });
        setSubject('');
        setMessage('');
        loadRequests();
      }
    } catch (err) {
      setNotice({ text: 'An unexpected error occurred. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-help-tab animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header Banner */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#eaf7f2', color: '#087d43', borderRadius: '100px', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
            <Building2 size={14} />
            <span>{hospital.name} — Administrator Desk</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>Help & Support</h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Find answers to common operational questions or get in touch with the Swasthya Setu support team.
          </p>
        </div>
      </div>

      {/* 2. Official Support Contact Channels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* Email Support */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eaf7f2', color: '#087d43', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Mail size={22} />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Platform Support Email</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>support@swasthyasetu.com</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Response within 24 business hours</div>
          </div>
          <button
            type="button"
            onClick={() => handleCopy('support@swasthyasetu.com', 'email')}
            style={{ padding: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }}
            title="Copy Email"
          >
            {copiedText === 'email' ? <Check size={16} color="#087d43" /> : <Copy size={16} />}
          </button>
        </div>

        {/* ABDM National Helpline */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0f9ff', color: '#0284c7', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Phone size={22} />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>National Health Authority (ABDM)</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>1800-11-4477 (Toll Free)</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Toll-free national ABDM helpline</div>
          </div>
          <button
            type="button"
            onClick={() => handleCopy('1800-11-4477', 'phone')}
            style={{ padding: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }}
            title="Copy Helpline"
          >
            {copiedText === 'phone' ? <Check size={16} color="#087d43" /> : <Copy size={16} />}
          </button>
        </div>

      </div>

      {/* 3. 2-Column Section: Submit Support Request & Recent Requests */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
        
        {/* Support Request Form */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <MessageSquare size={20} color="#087d43" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Submit a Support Request</h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Need assistance with doctor accounts, appointments, or data sync? Let us know.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#f8fafc', color: '#0f172a', outline: 'none' }}
              >
                <option value="Doctor Management">Doctor Management & Roster</option>
                <option value="Appointments & Slots">Appointments & Daily Slots</option>
                <option value="Donations & Blood Bank">Donation Requests & Blood Bank</option>
                <option value="Account & Login">Admin / Staff Login & Password</option>
                <option value="Technical Issue">Technical Issue / Error</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Brief summary of your query"
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#f8fafc', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                rows={4}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#f8fafc', color: '#0f172a', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                required
              />
            </div>

            {notice.text && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '600', background: notice.type === 'success' ? '#ecfdf5' : '#fef2f2', color: notice.type === 'success' ? '#059669' : '#dc2626', border: notice.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca' }}>
                {notice.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 18px', background: '#087d43', color: '#ffffff', border: 0, borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.15s' }}
            >
              <Send size={15} />
              <span>{submitting ? 'Submitting...' : 'Send Request'}</span>
            </button>
          </form>
        </div>

        {/* Previous Requests List */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Clock size={20} color="#087d43" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>My Submitted Requests ({requests.length})</h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Track status of your previous support tickets.</p>
            </div>
          </div>

          {requests.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', color: '#94a3b8', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <FileQuestion size={36} color="#cbd5e1" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>No support requests submitted yet</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>When you submit a query, it will appear here.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '340px' }}>
              {requests.map(req => (
                <div key={req.id} style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{req.subject || 'Support Query'}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '100px', background: req.status === 'resolved' ? '#ecfdf5' : '#fef9c3', color: req.status === 'resolved' ? '#059669' : '#a16207', textTransform: 'capitalize' }}>
                      {req.status || 'New'}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#475569', margin: '2px 0 4px', lineHeight: '1.4' }}>{req.message}</p>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {new Date(req.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 4. Frequently Asked Questions (Hospital Admin FAQs) */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <HelpCircle size={20} color="#087d43" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Frequently Asked Questions</h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Quick operational answers for hospital administrators.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ADMIN_FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: isOpen ? '#f8fafc' : '#ffffff', transition: 'all 0.15s ease' }}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} color="#087d43" /> : <ChevronDown size={18} color="#64748b" />}
                </button>
                {isOpen && (
                  <div style={{ padding: '0 16px 14px 16px', fontSize: '13px', color: '#475569', lineHeight: '1.6', borderTop: '1px solid #f1f5f9' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
