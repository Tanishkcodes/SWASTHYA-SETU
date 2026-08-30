import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../lib/db';
import AdminDonationRequests from '../components/AdminDonationRequests';
import { 
  Users, Activity, Settings, TrendingUp, Shield, LogOut, Plus, 
  CheckCircle, AlertCircle, Cpu, Download, Globe, Clock, Sparkles, HeartHandshake
} from 'lucide-react';
import '../styles/physician.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, session } = useSession();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('overview');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffList, setStaffList] = useState([
    { id: 1, name: 'Dr. A. K. Sharma', role: 'Physician', dept: 'General OPD', status: 'Active (Room 104)' },
    { id: 2, name: 'Dr. Priya Mehta', role: 'Cardiologist', dept: 'Cardiology', status: 'Active (Room 201)' },
    { id: 3, name: 'Sister Sunita V.', role: 'Head Nurse', dept: 'Triage Desk', status: 'On Shift' },
    { id: 4, name: 'Dr. Rajesh Vaidya', role: 'AYUSH Specialist', dept: 'Ayurvedic OPD', status: 'Active (Room 108)' }
  ]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = (e) => {
      e.preventDefault();
      navigate('/', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  useEffect(() => {
    db.staff.getAll().then(({ data, error }) => {
      if (error) { console.error('Unable to load staff', error); return; }
      setStaffList((data || []).map(item => ({
        ...item, dept: item.department, status: item.is_active ? 'Active' : 'Inactive',
      })));
    });
  }, []);

  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Physician',
    degrees: 'MBBS, MD',
    dept: 'General Medicine',
    experience: 8,
    age: 35,
    gender: 'Female',
    hospitalName: 'Sawai Man Singh Hospital',
    username: '',
    password: '',
  });

  const handleNameChange = (val) => {
    const autoUsername = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    setNewStaff(prev => ({
      ...prev,
      name: val,
      username: prev.username ? prev.username : (autoUsername ? `dr.${autoUsername}` : ''),
      password: prev.password ? prev.password : 'Doctor@123'
    }));
  };

  const handleAddStaff = async () => {
    if (!newStaff.name) {
      alert('Please enter the full name');
      return;
    }

    const assignedUsername = newStaff.username || newStaff.name.toLowerCase().replace(/[^a-z0-9]/g, '') || `doc-${Math.floor(100 + Math.random() * 900)}`;
    const assignedPassword = newStaff.password || 'Doctor@123';
    const isDoctorRole = /physician|doctor|ayush|specialist/i.test(newStaff.role);
    const normalizedRole = /admin/i.test(newStaff.role) ? 'admin' : /nurse/i.test(newStaff.role) ? 'nurse' : 'doctor';
    const system = /ayush|ayurveda/i.test(newStaff.role) || /ayur/i.test(newStaff.dept) ? 'Ayurveda' : 'Allopathy';

    if (isDoctorRole) {
      const { data, error } = await db.doctors.createDoctor({
        name: newStaff.name,
        degrees: newStaff.degrees || 'MBBS, MD',
        speciality: newStaff.dept || 'General Medicine',
        system,
        experience: parseInt(newStaff.experience, 10) || 5,
        age: parseInt(newStaff.age, 10) || 35,
        gender: newStaff.gender || 'Female',
        hospitalName: newStaff.hospitalName || 'Sawai Man Singh Hospital',
        username: assignedUsername,
        initialPassword: assignedPassword,
      });

      if (error) {
        alert(`Unable to register doctor: ${error.message}`);
        return;
      }

      setStaffList(prev => [
        {
          id: data.doctor.id,
          name: data.doctor.name,
          role: newStaff.role,
          dept: data.doctor.speciality,
          username: assignedUsername,
          status: 'Active Credentials Issued',
        },
        ...prev,
      ]);

      alert(`✅ Doctor registered successfully!\n\nLogin ID: ${assignedUsername}\nInitial Password: ${assignedPassword}\n\nThe doctor can now log in and change their password.`);
    } else {
      const { data: id, error } = await db.staff.create({
        username: assignedUsername,
        password: assignedPassword,
        name: newStaff.name,
        role: normalizedRole,
        department: newStaff.dept,
      });

      if (error) {
        alert(`Unable to create staff account: ${error.message}`);
        return;
      }

      setStaffList(prev => [
        {
          id,
          name: newStaff.name,
          role: newStaff.role,
          dept: newStaff.dept,
          username: assignedUsername,
          status: 'Active Credentials Issued',
        },
        ...prev,
      ]);

      alert(`✅ Staff account created!\n\nUsername: ${assignedUsername}\nPassword: ${assignedPassword}`);
    }

    setNewStaff({
      name: '',
      role: 'Physician',
      degrees: 'MBBS, MD',
      dept: 'General Medicine',
      experience: 8,
      age: 35,
      gender: 'Female',
      hospitalName: 'Sawai Man Singh Hospital',
      username: '',
      password: '',
    });
    setShowAddStaffModal(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth?role=admin');
  };

  return (
    <div className="physician-layout" style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      
      {/* ── Sidebar Navigation ── */}
      <aside className="physician-sidebar" style={{ background: 'var(--navy-950)', color: 'white' }}>
        <div className="sidebar-header" style={{ borderBottom: '1px solid var(--navy-800)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '1.1rem', color: 'white' }}>
            <Shield size={22} color="var(--teal-400)" />
            <span>Clinic Admin Portal</span>
          </div>
        </div>
        
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem',
              background: activeTab === 'overview' ? 'var(--teal-600)' : 'transparent',
              color: activeTab === 'overview' ? 'white' : 'var(--gray-400)'
            }}
          >
            <Activity size={18} /> System Overview
          </button>

          <button 
            onClick={() => setActiveTab('staff')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem',
              background: activeTab === 'staff' ? 'var(--teal-600)' : 'transparent',
              color: activeTab === 'staff' ? 'white' : 'var(--gray-400)'
            }}
          >
            <Users size={18} /> Manage Staff ({staffList.length})
          </button>

          <button 
            onClick={() => setActiveTab('donations')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem',
              background: activeTab === 'donations' ? 'var(--teal-600)' : 'transparent',
              color: activeTab === 'donations' ? 'white' : 'var(--gray-400)'
            }}
          >
            <HeartHandshake size={18} /> Donation Requests
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem',
              background: activeTab === 'analytics' ? 'var(--teal-600)' : 'transparent',
              color: activeTab === 'analytics' ? 'white' : 'var(--gray-400)'
            }}
          >
            <TrendingUp size={18} /> AI Triage Analytics
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem',
              background: activeTab === 'settings' ? 'var(--teal-600)' : 'transparent',
              color: activeTab === 'settings' ? 'white' : 'var(--gray-400)'
            }}
          >
            <Settings size={18} /> System Settings
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="physician-main" style={{ padding: '1.5rem 2rem', overflowY: 'auto' }}>
        
        {/* Admin Header */}
        <header className="physician-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'white', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'var(--navy-50)', color: 'var(--navy-600)', borderRadius: '12px' }}>
              <Shield size={24} />
            </div>
            <div>
              <h1 style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--navy-900)', margin: 0 }}>
                Swasthya Setu Administration
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', margin: 0 }}>AI-Assisted OPD Triage & Multi-Language System Control</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--navy-50)', color: 'var(--navy-700)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid var(--navy-200)' }} title="Admin session automatically expires at 12:00 AM midnight">
              <Clock size={14} /> Session Active till 12:00 AM
            </div>
            <button 
              onClick={handleLogout}
              style={{ background: 'var(--red-50)', border: '1px solid var(--red-200)', padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--red-600)', fontWeight: '600', cursor: 'pointer' }}
            >
              <LogOut size={16} /> Logout Admin
            </button>
          </div>
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Top Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: '600' }}>Patients Triaged Today</div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--navy-900)', marginTop: '4px' }}>1,248</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--green-600)', fontWeight: '600', marginTop: '4px' }}>↑ 12% increase vs yesterday</div>
              </div>

              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: '600' }}>Avg AI Intake Speed</div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--teal-700)', marginTop: '4px' }}>3m 42s</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--green-600)', fontWeight: '600', marginTop: '4px' }}>Saved ~15 mins per patient</div>
              </div>

              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: '600' }}>Active OPD Doctors</div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--navy-900)', marginTop: '4px' }}>42</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '4px' }}>Across 8 Departments</div>
              </div>

              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: '600' }}>System Uptime</div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#166534', marginTop: '4px' }}>99.9%</div>
                <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '600', marginTop: '4px' }}>ABDM Server Linked</div>
              </div>
            </div>

            {/* OPD Department Live Capacity */}
            <div style={{ background: 'white', borderRadius: '18px', border: '1px solid var(--gray-200)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--navy-900)', marginBottom: '1.25rem' }}>
                Live Department OPD Load & Capacity
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '700', marginBottom: '4px' }}>
                    <span>General Medicine OPD</span>
                    <span style={{ color: '#ef4444' }}>85% Capacity (Heavy Load)</span>
                  </div>
                  <div style={{ background: 'var(--gray-200)', borderRadius: '10px', height: '12px', overflow: 'hidden' }}>
                    <div style={{ width: '85%', background: '#ef4444', height: '100%' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '700', marginBottom: '4px' }}>
                    <span>AYUSH & Holistic Health OPD</span>
                    <span style={{ color: 'var(--teal-700)' }}>60% Capacity (Optimal)</span>
                  </div>
                  <div style={{ background: 'var(--gray-200)', borderRadius: '10px', height: '12px', overflow: 'hidden' }}>
                    <div style={{ width: '60%', background: 'var(--teal-600)', height: '100%' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '700', marginBottom: '4px' }}>
                    <span>Cardiology OPD</span>
                    <span style={{ color: '#eab308' }}>45% Capacity</span>
                  </div>
                  <div style={{ background: 'var(--gray-200)', borderRadius: '10px', height: '12px', overflow: 'hidden' }}>
                    <div style={{ width: '45%', background: '#eab308', height: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="animate-fade-in" style={{ background: 'white', borderRadius: '18px', border: '1px solid var(--gray-200)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--navy-900)', margin: 0 }}>Staff & Physician Roster</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', margin: '4px 0 0 0' }}>Manage on-duty doctors, nurses, and AYUSH practitioners.</p>
              </div>

              <button 
                onClick={() => setShowAddStaffModal(true)}
                className="btn btn-primary"
                style={{ padding: '10px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
              >
                <Plus size={18} /> Add New Staff Member
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {staffList.map(member => (
                <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: 'var(--gray-50)', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--teal-100)', color: 'var(--teal-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem' }}>
                      {member.name ? member.name.replace(/^Dr\.\s*/i, '')[0] : 'D'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--navy-900)' }}>{member.name}</h4>
                        {member.username && (
                          <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: '600', fontFamily: 'monospace' }}>
                            @{member.username}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>{member.role} • {member.dept || member.department || 'Clinical Department'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge" style={{ background: '#dcfce7', color: '#15803d', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
                      {member.status || 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'donations' && (
          <AdminDonationRequests staffId={session.staff?.id} />
        )}

        {/* TAB 3: AI TRIAGE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'white', borderRadius: '18px', border: '1px solid var(--gray-200)', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--navy-900)', marginBottom: '1rem' }}>
                Multi-Language Usage Distribution (9 Regional Languages)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                  { lang: 'Hindi (हिंदी)', pct: '42%' },
                  { lang: 'English', pct: '28%' },
                  { lang: 'Tamil (தமிழ்)', pct: '9%' },
                  { lang: 'Telugu (తెలుగు)', pct: '7%' },
                  { lang: 'Marathi (मराठी)', pct: '6%' },
                  { lang: 'Bengali (বাংলা)', pct: '4%' },
                  { lang: 'Others (Guj, Kn, Ml)', pct: '4%' }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: '600' }}>{item.lang}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--teal-700)', marginTop: '4px' }}>{item.pct}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in" style={{ background: 'white', borderRadius: '18px', border: '1px solid var(--gray-200)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--navy-900)', marginBottom: '1rem' }}>
              System Integration & API Status
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--navy-900)' }}>Google Gemini AI Engine</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Model: gemini-3.6-flash</div>
                </div>
                <span style={{ color: '#166534', fontWeight: 'bold', fontSize: '0.875rem' }}>Connected (Fallback Active)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--navy-900)' }}>ElevenLabs TTS Engine</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Voice Model: Multilingual v2</div>
                </div>
                <span style={{ color: '#166534', fontWeight: 'bold', fontSize: '0.875rem' }}>Connected</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--navy-900)' }}>ABDM / ABHA ID Gateway</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Ayushman Bharat Digital Mission</div>
                </div>
                <span style={{ color: '#166534', fontWeight: 'bold', fontSize: '0.875rem' }}>Verified Gateway</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Add Staff / Doctor Modal */}
      {showAddStaffModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--navy-900)' }}>Add New Doctor / Staff Member</h3>
            <p style={{ margin: '0 0 1.25rem 0', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
              Registering a doctor automatically syncs the database and issues encrypted initial login credentials.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gray-700)' }}>Full Name:</label>
                <input 
                  type="text" 
                  value={newStaff.name} 
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Dr. Gayatri Joshi"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-300)', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gray-700)' }}>Role:</label>
                  <select 
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-300)', marginTop: '4px' }}
                  >
                    <option value="Physician">Physician / Doctor</option>
                    <option value="AYUSH Specialist">AYUSH Specialist</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Receptionist">Receptionist</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gray-700)' }}>Degrees / Qualifications:</label>
                  <input 
                    type="text" 
                    value={newStaff.degrees} 
                    onChange={(e) => setNewStaff({ ...newStaff, degrees: e.target.value })}
                    placeholder="e.g. MBBS, MD"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-300)', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gray-700)' }}>Department / Specialization:</label>
                <input 
                  type="text" 
                  value={newStaff.dept} 
                  onChange={(e) => setNewStaff({ ...newStaff, dept: e.target.value })}
                  placeholder="e.g. General Medicine / Cardiology"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-300)', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gray-700)' }}>Age:</label>
                  <input 
                    type="number" 
                    value={newStaff.age} 
                    onChange={(e) => setNewStaff({ ...newStaff, age: e.target.value })}
                    placeholder="36"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-300)', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gray-700)' }}>Gender:</label>
                  <select 
                    value={newStaff.gender} 
                    onChange={(e) => setNewStaff({ ...newStaff, gender: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-300)', marginTop: '4px' }}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gray-700)' }}>Experience (Yrs):</label>
                  <input 
                    type="number" 
                    value={newStaff.experience} 
                    onChange={(e) => setNewStaff({ ...newStaff, experience: e.target.value })}
                    placeholder="10"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-300)', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gray-700)' }}>Hospital / Center:</label>
                <select 
                  value={newStaff.hospitalName} 
                  onChange={(e) => setNewStaff({ ...newStaff, hospitalName: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--gray-300)', marginTop: '4px' }}
                >
                  <option value="Sawai Man Singh Hospital">Sawai Man Singh Hospital, Jaipur</option>
                  <option value="AIIMS New Delhi">AIIMS New Delhi</option>
                  <option value="Indraprastha Apollo Hospitals">Indraprastha Apollo Hospitals</option>
                  <option value="Shalby Hospital Jaipur">Shalby Hospital Jaipur</option>
                  <option value="All India Institute of Ayurveda (AIIA)">All India Institute of Ayurveda (AIIA)</option>
                  <option value="National Institute of Ayurveda (NIA)">National Institute of Ayurveda (NIA)</option>
                  <option value="Narayana Health City">Narayana Health City, Bangalore</option>
                  <option value="Fortis Escorts Hospital">Fortis Escorts Hospital, Jaipur</option>
                  <option value="Tata Memorial Hospital">Tata Memorial Hospital, Mumbai</option>
                  <option value="Jaipur Hospital">Jaipur Hospital</option>
                </select>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  🔑 Initial Login Credentials (Given to Doctor)
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gray-600)' }}>Login ID / Username:</label>
                    <input 
                      type="text" 
                      value={newStaff.username} 
                      onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                      placeholder="e.g. dr.ananya"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--gray-300)', marginTop: '2px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gray-600)' }}>Initial Password:</label>
                    <input 
                      type="text" 
                      value={newStaff.password} 
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      placeholder="Doctor@123"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--gray-300)', marginTop: '2px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <small style={{ display: 'block', marginTop: '6px', color: '#64748b', fontSize: '0.72rem' }}>
                  The password will be stored encrypted. The doctor can change it anytime in their portal.
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddStaffModal(false)} className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                Cancel
              </button>
              <button onClick={handleAddStaff} className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '8px', fontWeight: 'bold' }}>
                Register Doctor & Issue Login
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
