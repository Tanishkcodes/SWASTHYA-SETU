import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useLanguage } from '../context/LanguageContext';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';
import {
  Stethoscope, ClipboardList, Activity, FileText, AlertTriangle, Users,
  Search, CheckCircle, LogOut, Pill, FilePlus, Sparkles, Filter, Shield,
  Heart, Leaf, Printer, Clock, CalendarCheck, ToggleLeft, ToggleRight, RefreshCw
} from 'lucide-react';
import { db } from '../lib/db';
import '../styles/physician.css';

export default function PhysicianDashboard() {
  const navigate = useNavigate();
  const { session, logout } = useSession();
  const { t } = useLanguage();
  const { audioPromptManager } = useVoiceNav();
  
  const [queue, setQueue] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'critical', 'waiting', 'completed'
  const [prescribedMeds, setPrescribedMeds] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [consultCompleted, setConsultCompleted] = useState(false);

  // ── Schedule Management ──
  const DOCTOR_ID = session.staff?.doctor_id || 'd0000001-0001-0001-0001-000000000001';
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [scheduleView, setScheduleView] = useState(false);
  const [doctorSchedule, setDoctorSchedule] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(todayStr);

  const loadSchedule = async (date) => {
    const { data, error } = await db.slots.getForDoctor(DOCTOR_ID, date);
    if (error) { console.error('Unable to load schedule', error); return; }
    setDoctorSchedule({ slots: data.map(slot => ({
      ...slot, time24: slot.time_24, label: slot.time_label, isOpen: slot.is_open,
    })) });
  };

  useEffect(() => {
    loadSchedule(scheduleDate);
  }, [scheduleDate]);

  const toggleSlot = async (time24, currentOpen) => {
    const { error } = await db.slots.setOpen(DOCTOR_ID, scheduleDate, time24, !currentOpen);
    if (error) { alert(`Unable to update slot: ${error.message}`); return; }
    await loadSchedule(scheduleDate);
  };

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = (e) => {
      e.preventDefault();
      navigate('/', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);

    if (audioPromptManager?.speakText) {
      audioPromptManager.speakText(t('doctorWelcome') || "Doctor portal active. Select a patient from your OPD queue.");
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [audioPromptManager, navigate, t]);

  useEffect(() => {
    let active = true;
    Promise.all([
      db.appointments.getDoctorQueue(DOCTOR_ID, todayStr),
      db.intakes.getSubmittedQueue(todayStr),
    ]).then(([appointmentsResult, intakesResult]) => {
      if (!active) return;
      const { data, error } = appointmentsResult;
      if (error) { console.error('Unable to load OPD queue', error); setQueue([]); return; }
      const appointmentQueue = (data || []).map(row => {
        const intake = row.clinical_intakes?.[0];
        return {
          id: row.id,
          source: 'appointment',
          token: String(row.token_number || '').replace(/^#/, ''),
          name: row.patients?.name || 'Patient',
          age: row.patients?.age || '',
          gender: row.patients?.gender || '',
          time: row.time_label,
          status: row.status === 'confirmed' ? 'waiting' : row.status,
          summary: intake?.clinical_summary || { subjective: {}, redFlags: intake?.red_flags || [] },
        };
      });
      if (intakesResult.error) console.error('Unable to load intake queue', intakesResult.error);
      const intakeQueue = (intakesResult.data || []).map(intake => ({
        id: intake.id,
        source: 'intake',
        token: String(intake.token_number || '').replace(/^#/, ''),
        name: intake.patients?.name || 'Patient', age: intake.patients?.age || '',
        gender: intake.patients?.gender || '', time: 'Intake submitted', status: 'waiting',
        summary: intake.clinical_summary || { subjective: {}, redFlags: intake.red_flags || [] },
      }));
      const mapped = [...appointmentQueue, ...intakeQueue];
      setQueue(mapped);
      setActivePatient(mapped[0] || null);
    });
    return () => { active = false; };
  }, [DOCTOR_ID, todayStr]);

  const handleComplete = async () => {
    if (activePatient) {
      const { error } = activePatient.source === 'intake'
        ? await db.intakes.updateStatus(activePatient.id, 'completed', { prescription: prescribedMeds || null, doctor_notes: doctorNotes || null })
        : await db.appointments.updateStatus(activePatient.id, 'completed', {
          prescription: prescribedMeds || null,
          doctor_notes: doctorNotes || null,
        });
      if (error) { alert(`Unable to complete consultation: ${error.message}`); return; }
      setConsultCompleted(true);
      setQueue(prev => prev.map(p => p.id === activePatient.id ? { ...p, status: 'completed' } : p));
      setTimeout(() => {
        const remaining = queue.filter(p => p.id !== activePatient.id && p.status !== 'completed');
        setActivePatient(remaining.length > 0 ? remaining[0] : null);
        setConsultCompleted(false);
        setPrescribedMeds('');
        setDoctorNotes('');
      }, 1200);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth?role=doctor');
  };

  const filteredQueue = queue.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.token.toString().includes(searchQuery);
    if (!matchesSearch) return false;
    if (filterType === 'critical') return p.summary?.redFlags?.length > 0;
    if (filterType === 'waiting') return p.status === 'waiting';
    if (filterType === 'completed') return p.status === 'completed';
    return true;
  });

  return (
    <div className="physician-layout" style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      
      {/* ── Sidebar (OPD Queue) ── */}
      <aside className="physician-sidebar" style={{ background: 'white', borderRight: '1px solid var(--gray-200)' }}>
        <div className="sidebar-header" style={{ background: 'var(--navy-900)', color: 'white', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '1.1rem' }}>
            <Users size={22} color="var(--teal-400)" />
            <span>{t('opdQueue') || 'Live OPD Queue'}</span>
          </div>
          <span className="badge" style={{ background: 'var(--teal-500)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            {queue.filter(p => p.status === 'waiting').length} Waiting
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder') || 'Search token or name...'}
              style={{ width: '100%', background: 'var(--gray-100)', border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '8px 12px 8px 36px', fontSize: '0.875rem', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'critical', 'waiting'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  background: filterType === type ? 'var(--teal-600)' : 'var(--gray-100)',
                  color: filterType === type ? 'white' : 'var(--gray-600)'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Queue List */}
        <div className="patient-queue" style={{ padding: '0.75rem', overflowY: 'auto' }}>
          {filteredQueue.map(p => (
            <div 
              key={p.id} 
              className={`queue-item ${activePatient?.id === p.id ? 'active' : ''}`}
              onClick={() => setActivePatient(p)}
              style={{
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '8px',
                border: activePatient?.id === p.id ? '2px solid var(--teal-500)' : '1px solid var(--gray-200)',
                background: activePatient?.id === p.id ? 'var(--teal-50)' : (p.status === 'completed' ? '#f0fdf4' : 'white'),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: p.status === 'completed' ? '#166534' : 'var(--navy-800)',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  #{p.token}
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--navy-900)', fontSize: '0.9rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{p.age}y • {p.gender} • {p.time}</div>
                </div>
              </div>

              {p.summary?.redFlags?.length > 0 && (
                <div title="Critical AI Alert" style={{ padding: '4px', background: 'var(--red-100)', borderRadius: '50%' }}>
                  <AlertTriangle size={16} color="var(--red-600)" />
                </div>
              )}
            </div>
          ))}

          {filteredQueue.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem', padding: '2rem 0' }}>
              No patients match criteria.
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content (Doctor Workbench) ── */}
      <main className="physician-main" style={{ padding: '1.5rem 2rem', overflowY: 'auto' }}>
        
        {/* Physician Header */}
        <header className="physician-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'white', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'var(--teal-50)', color: 'var(--teal-600)', borderRadius: '12px' }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--navy-900)', margin: 0 }}>
                {t('doctorPortal') || 'Physician Clinical Workbench'}
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', margin: 0 }}>Swasthya Setu OPD Triage Suite</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Schedule Manager Toggle Button */}
            <button
              onClick={() => setScheduleView(!scheduleView)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: scheduleView ? '#0c4e47' : 'var(--teal-50)',
                color: scheduleView ? '#ffffff' : 'var(--teal-700)',
                border: '1px solid var(--teal-200)', borderRadius: '10px',
                padding: '8px 14px', fontSize: '0.8rem', fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <CalendarCheck size={16} />
              {scheduleView ? 'Back to Queue' : 'Manage Schedule'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--orange-50)', color: 'var(--orange-700)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid var(--orange-200)' }} title="Doctor session automatically expires at 12:00 AM midnight">
              <Clock size={14} /> Session Active till 12:00 AM
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--navy-900)' }}>Dr. A. K. Sharma, MD</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--teal-600)', fontWeight: '600' }}>Senior Physician (OPD 104)</div>
            </div>
            <button 
              onClick={handleLogout}
              style={{ background: 'var(--gray-100)', border: 'none', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gray-700)', fontWeight: '600', cursor: 'pointer' }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {activePatient ? (
          <div className="patient-view animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            
            {/* Left Column: AI Clinical Summary & SOAP Note */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Patient Banner */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--navy-800), var(--navy-950))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '900' }}>
                    #{activePatient.token}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--navy-900)', margin: 0 }}>{activePatient.name}</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', margin: '4px 0 0 0' }}>{activePatient.age} yrs • {activePatient.gender} • Checked in: {activePatient.time}</p>
                  </div>
                </div>

                <button 
                  onClick={handleComplete}
                  disabled={consultCompleted}
                  className="btn btn-primary"
                  style={{
                    background: consultCompleted ? '#166534' : 'linear-gradient(135deg, var(--teal-500), var(--teal-600))',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 'bold'
                  }}
                >
                  <CheckCircle size={18} />
                  {consultCompleted ? 'Consultation Completed!' : 'Mark Consult Complete'}
                </button>
              </div>

              {/* Red Flags Alert */}
              {activePatient.summary?.redFlags && activePatient.summary.redFlags.length > 0 && (
                <div style={{ background: 'var(--red-50)', borderLeft: '4px solid var(--red-500)', padding: '1.25rem', borderRadius: '0 14px 14px 0', display: 'flex', gap: '1rem' }}>
                  <AlertTriangle color="var(--red-600)" size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: '800', color: 'var(--red-900)', margin: '0 0 4px 0', fontSize: '0.95rem' }}>AI Triage Red Flag Alert</h4>
                    {activePatient.summary.redFlags.map((f, i) => (
                      <p key={i} style={{ margin: 0, fontSize: '0.875rem', color: 'var(--red-800)', fontWeight: '500' }}>{f.message}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* AI SOAP Note Card */}
              <div style={{ background: 'white', borderRadius: '18px', border: '1px solid var(--gray-200)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ background: 'var(--gray-50)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-200)', fontWeight: '800', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--teal-600)" /> AI Synthesized Intake History (SOAP Format)
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--teal-800)', textTransform: 'uppercase', marginBottom: '6px' }}>Subjective History of Present Illness (HPI):</h5>
                    <p style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--gray-200)', color: 'var(--navy-900)', lineHeight: 1.6, margin: 0, fontSize: '0.925rem' }}>
                      {activePatient.summary.subjective?.hpi || 'No patient history recorded.'}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--teal-800)', textTransform: 'uppercase', marginBottom: '6px' }}>Past Medical & Surgical History:</h5>
                      <div style={{ background: 'var(--gray-50)', padding: '0.875rem', borderRadius: '12px', border: '1px solid var(--gray-200)', color: 'var(--navy-900)', fontSize: '0.875rem' }}>
                        {activePatient.summary.subjective?.pmh || 'None reported.'}
                      </div>
                    </div>

                    {activePatient.summary.ayush && (
                      <div>
                        <h5 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#15803d', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Leaf size={14} /> AYUSH Constitution Assessment:
                        </h5>
                        <div style={{ background: '#f0fdf4', padding: '0.875rem', borderRadius: '12px', border: '1px solid #bbf7d0', color: '#166534', fontWeight: '600', fontSize: '0.875rem' }}>
                          {activePatient.summary.ayush}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SNOMED-CT Codes */}
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--teal-800)', textTransform: 'uppercase', marginBottom: '6px' }}>Mapped Clinical SNOMED-CT Terminology:</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {activePatient.summary.snmmedCodes?.map(c => (
                        <span key={c.code} style={{ background: 'var(--teal-50)', color: 'var(--teal-800)', border: '1px solid var(--teal-200)', padding: '6px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
                          {c.term} (Code: {c.code})
                        </span>
                      )) || <span style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>No clinical codes assigned</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescription & Clinical Notes Writer */}
              <div style={{ background: 'white', borderRadius: '18px', border: '1px solid var(--gray-200)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--navy-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pill size={20} color="var(--teal-600)" /> Doctor Prescription & Order Pad
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gray-700)', display: 'block', marginBottom: '4px' }}>Prescribed Medicines (e.g. Paracetamol 500mg TDS x 3 days):</label>
                    <textarea 
                      rows={3}
                      value={prescribedMeds}
                      onChange={(e) => setPrescribedMeds(e.target.value)}
                      placeholder="Type prescribed medications here..."
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--gray-300)', outline: 'none', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gray-700)', display: 'block', marginBottom: '4px' }}>Physician Advice & Lifestyle Notes:</label>
                    <input 
                      type="text"
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      placeholder="e.g. Steam inhalation 2x daily, follow-up in 5 days"
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--gray-300)', outline: 'none', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Printer size={16} /> Print Rx
                    </button>
                    <button className="btn btn-primary" onClick={handleComplete} style={{ padding: '8px 20px', borderRadius: '10px', fontWeight: 'bold' }}>
                      Sign & Issue Digital Rx
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Scans & Diagnostics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: 'white', borderRadius: '18px', border: '1px solid var(--gray-200)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--navy-900)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--teal-600)" /> Patient Uploaded Scans
                </h4>
                <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--gray-200)', fontSize: '0.875rem', color: 'var(--gray-800)' }}>
                  {activePatient.summary.subjective?.documents || 'No scanned documents uploaded.'}
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '18px', border: '1px solid var(--gray-200)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--navy-900)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="var(--teal-600)" /> Rapid Clinical Actions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', borderRadius: '10px' }}>
                    Order Blood & Pathology Tests
                  </button>
                  <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', borderRadius: '10px' }}>
                    Refer to Specialist
                  </button>
                  <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', borderRadius: '10px', color: '#15803d', borderColor: '#bbf7d0', background: '#f0fdf4' }}>
                    Prescribe AYUSH Herbals
                  </button>
                </div>
              </div>
            </div>

          </div>
        ) : (
          scheduleView ? (
            // ── Doctor Schedule Management Panel ──
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarCheck size={22} color="var(--teal-600)" />
                    Slot Availability Manager
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--gray-500)' }}>Toggle slots open/closed. Patients see this in real-time when booking.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--gray-300)', fontSize: '0.9rem', fontWeight: '600', color: 'var(--navy-900)', outline: 'none' }}
                  />
                  <button
                    onClick={() => loadSchedule(scheduleDate)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--gray-100)', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', color: 'var(--gray-700)' }}
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              {doctorSchedule && ['morning', 'afternoon', 'evening'].map(session => {
                const sessionSlots = doctorSchedule.slots.filter(s => s.session === session);
                const emoji = session === 'morning' ? '☀️' : session === 'afternoon' ? '🌤️' : '🌙';
                const sessionLabel = session.charAt(0).toUpperCase() + session.slice(1);
                return (
                  <div key={session} style={{ background: 'white', borderRadius: '18px', border: '1px solid var(--gray-200)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontWeight: '800', fontSize: '1rem', color: 'var(--navy-900)' }}>
                      <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
                      <span>{sessionLabel} Slots</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)' }}>
                        {sessionSlots.filter(s => s.isOpen).length}/{sessionSlots.length} open
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                      {sessionSlots.map(slot => (
                        <div key={slot.time24} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: '12px',
                          border: slot.isOpen ? '1px solid var(--teal-200)' : '1px solid var(--gray-200)',
                          background: slot.isOpen ? 'var(--teal-50)' : 'var(--gray-50)'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: slot.isOpen ? 'var(--teal-800)' : 'var(--gray-400)' }}>{slot.label}</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: '600', color: slot.isOpen ? 'var(--teal-600)' : 'var(--gray-400)', marginTop: '2px' }}>
                              Capacity: {slot.capacity} patients
                            </div>
                          </div>
                          <button
                            onClick={() => toggleSlot(slot.time24, slot.isOpen)}
                            title={slot.isOpen ? 'Click to close this slot' : 'Click to open this slot'}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: slot.isOpen ? 'var(--teal-600)' : 'var(--gray-400)',
                              padding: '4px', borderRadius: '6px',
                              transition: 'all 0.2s'
                            }}
                          >
                            {slot.isOpen
                              ? <ToggleRight size={28} color="#0f766e" />
                              : <ToggleLeft size={28} color="#94a3b8" />
                            }
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div style={{ background: 'var(--teal-50)', border: '1px solid var(--teal-200)', borderRadius: '14px', padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--teal-800)', fontWeight: '600' }}>
                💡 Changes take effect immediately. Patients booking on the Patient Portal will see updated availability in real-time.
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--gray-500)' }}>
              <Users size={48} color="var(--gray-300)" style={{ marginBottom: '1rem' }} />
              <h3>No Active Patient Selected</h3>
              <p>Select a patient from the left OPD queue to review their clinical summary.</p>
            </div>
          )
        )}

      </main>
    </div>
  );
}
