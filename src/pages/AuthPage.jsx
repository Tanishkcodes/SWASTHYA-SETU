import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';
import { QrCode, UserCircle, Key, Shield, ArrowLeft, Stethoscope, Users } from 'lucide-react';
import AudioButton from '../components/AudioButton';
import VirtualKeyboard from '../components/VirtualKeyboard';
import ABHAScanner from '../components/ABHAScanner';
import SwasthyaLogo from '../components/SwasthyaLogo';
import BrandTitle from '../components/BrandTitle';
import aiCommandEngine from '../engine/AICommandEngine';
import audioFeedback from '../voicenav/AudioFeedback';
import { db } from '../lib/db';
import '../styles/auth.css';

function normalizeGender(rawGender, t) {
  if (!rawGender) return '';
  const s = rawGender.toString().toLowerCase().trim();
  if (['male', 'mail', 'mael', 'mel', 'purush', 'purus', 'man', 'boy', 'aadmi', 'aan', 'aanu', 'maga', 'chele', 'purusha'].includes(s) || /পুরুষ|पुरुष|ஆண்|పురుషుడు|ಪುರುಷ|പുരുഷൻ|પુરુષ/i.test(s)) {
    return t ? t('male') : 'Male';
  }
  if (['female', 'femail', 'fimail', 'femal', 'fe male', 'mahila', 'mahilaa', 'aurat', 'woman', 'girl', 'stri', 'stree', 'penn', 'pen', 'meye', 'aada'].includes(s) || /মহিলা|महिला|பெண்|మహిళ|ಮಹಿಳೆ|സ്ത്രീ|મહિલા/i.test(s)) {
    return t ? t('female') : 'Female';
  }
  if (['other', 'others', 'transgender', 'trans'].includes(s) || /অন্যান্য|अन्य|மற்றவை|ఇతర|ಇತರ|മറ്റുള്ളവ|અન્ય/i.test(s)) {
    return t ? t('other') : 'Other';
  }
  return rawGender;
}

function completeRegistrationExtraction(text, extracted = {}) {
  const converted = aiCommandEngine._convertSpokenNumberWords(text);
  const aiPhone = String(extracted.phone || '').replace(/\D/g, '');
  const spokenPhone = converted.match(/\b[6-9]\d{9}\b/)?.[0] || '';
  const aiAge = String(extracted.age || '').match(/\d{1,3}/)?.[0] || '';
  const spokenAge = converted.match(/(?:age|umar|umr|वय|उम्र|வயது|వయస్సు|বয়স|વય|ವಯಸ್ಸು|വയസ്സ്)\D{0,8}(\d{1,3})/i)?.[1] || '';
  return {
    ...extracted,
    phone: aiPhone.length === 10 ? aiPhone : spokenPhone,
    age: Number(aiAge) >= 1 && Number(aiAge) <= 120 ? aiAge : spokenAge,
  };
}

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get('role') || 'patient';

  const { t, currentLang } = useLanguage();
  const { setPatient, setStaff, setAyushMode, setAuth, session } = useSession();
  const { audioPromptManager, registerPage, unregisterPage, language, setOnTranscript, clearOnTranscript, setDictationMode } = useVoiceNav();

  // Patient states
  const [activeTab, setActiveTab] = useState('new'); // 'abha', 'aadhaar', 'new'
  const [abhaId, setAbhaId] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: ''
  });

  // Staff states
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Keyboard state
  const [activeInput, setActiveInput] = useState(null); // { name, value }
  const [showKeyboard, setShowKeyboard] = useState(false);
  
  // Registration voice state
  const [isExtracting, setIsExtracting] = useState(false);

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    // If arriving directly, ensure no stuck audio
    audioFeedback.stop();
  }, []);

  // Store latest action in ref
  const handleNextRef = useRef();

  // 1. Command Registration
  useEffect(() => {
    registerPage('auth', {
      next: () => handleNextRef.current?.(),
      back: () => navigate('/'),
      home: () => navigate('/'),
      cancel: () => navigate('/'),
      login_abha: () => role === 'patient' && setActiveTab('abha'),
      login_aadhaar: () => role === 'patient' && setActiveTab('aadhaar'),
      register_new: () => role === 'patient' && setActiveTab('new')
    });

    return () => {
      unregisterPage('auth');
    };
  }, [navigate, registerPage, unregisterPage, role]);

  // 2. Audio Welcome Management
  useEffect(() => {
    let authWelcomeTimer;
    if (role === 'patient') {
      audioPromptManager.setCurrentPage('auth');
      authWelcomeTimer = setTimeout(() => {
        audioPromptManager.speakPageWelcome('auth');
      }, 400);
    }

    return () => {
      if (authWelcomeTimer) clearTimeout(authWelcomeTimer);
      audioFeedback.stop();
      audioPromptManager.setCurrentPage(null);
    };
  }, [role]);

  const handleNext = async () => {
    // ----------------------------
    // PATIENT LOGIN
    // ----------------------------
    if (role === 'patient') {
      let patientData = { authMethod: activeTab };
      
      if (activeTab === 'abha') {
        if (!abhaId) { setAuthError(t('enterAbha')); return; }
        patientData.abhaId = abhaId;
        patientData.name = "Patient (from ABHA)";
      } else if (activeTab === 'aadhaar') {
        if (aadhaar.length < 12) { setAuthError('Invalid Aadhaar'); return; }
        patientData.aadhaarLast4 = aadhaar.slice(-4);
        patientData.name = "Patient (from Aadhaar)";
      } else {
        if (!formData.name) { setAuthError(t('fullName') + ' is required'); return; }
        patientData = { ...patientData, ...formData };
      }

      setAuthError('');
      const { data: savedPatient, error } = await db.patients.upsert({
        name: patientData.name,
        phone: patientData.phone || null,
        age: patientData.age ? Number(patientData.age) : null,
        gender: patientData.gender || null,
        language: currentLang || 'en',
        abhaId: patientData.abhaId || null,
        aadhaarLast4: patientData.aadhaarLast4 || null,
        authMethod: patientData.authMethod,
      });
      if (error || !savedPatient) {
        setAuthError(`Unable to connect to the patient database: ${error?.message || 'unknown error'}`);
        return;
      }
      setAuth(true, 'patient');
      setPatient({ ...patientData, id: savedPatient.id });
      navigate('/patient-dashboard', { replace: true });
      return;
    }

    // ----------------------------
    // STAFF LOGIN (Doctor/Admin)
    // ----------------------------
    if (!staffUsername || !staffPassword) {
      setAuthError('Please enter both username and password.');
      return;
    }

    const { data: staff, error } = await db.staff.login(staffUsername.trim(), staffPassword);
    if (error) { setAuthError(`Staff authentication failed: ${error.message}`); return; }
    if (staff?.role === 'doctor' && role === 'doctor') {
      setStaff(staff);
      setAuth(true, 'doctor');
      navigate('/physician');
    } else if (staff?.role === 'admin' && role === 'admin') {
      setStaff(staff);
      setAuth(true, 'admin');
      navigate('/admin-dashboard');
    } else {
      setAuthError('Invalid username, password, or portal role.');
    }
  };

  handleNextRef.current = handleNext;

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (activeInput && activeInput.name === name) {
      setActiveInput({ name, value });
    }
  };

  const handleKeyboardChange = (e) => {
    const { name, value } = e.target;
    if (name === 'abhaId') setAbhaId(value);
    else if (name === 'aadhaar') setAadhaar(value);
    else if (name === 'staffUsername') setStaffUsername(value);
    else if (name === 'staffPassword') setStaffPassword(value);
    else setFormData(prev => ({ ...prev, [name]: value }));
    
    setActiveInput({ name, value });
  };

  const handleInputFocus = (name, value) => {
    setActiveInput({ name, value });
    if (window.innerWidth <= 768) {
      setShowKeyboard(true);
    }
  };

  // ----------------------------
  // GLOBAL VOICE ORB & FIELD TRANSCRIPT REGISTRATION
  // ----------------------------
  useEffect(() => {
    // Keep the global orb command-aware. Navigation/page commands are handled
    // first; only unhandled free speech reaches the registration extractor.
    setDictationMode(false);
    setOnTranscript(async (text) => {
      if (!text || text.length < 2) return;
      
      if (activeTab === 'abha') {
        const digits = text.replace(/[^0-9]/g, '');
        if (digits.length >= 14) {
          const formatted = `${digits.slice(0,2)}-${digits.slice(2,6)}-${digits.slice(6,10)}-${digits.slice(10,14)}`;
          setAbhaId(formatted);
        } else if (digits.length >= 4) {
          setAbhaId(digits);
        }
      } else if (activeTab === 'aadhaar') {
        const digits = text.replace(/[^0-9]/g, '');
        if (digits.length >= 4) {
          setAadhaar(digits.slice(0, 12));
        }
      } else if (activeTab === 'new') {
        setIsExtracting(true);
        const extracted = completeRegistrationExtraction(
          text,
          await aiCommandEngine.extractRegistrationDetails(text, language)
        );
        setIsExtracting(false);
        
        if (extracted) {
          const directPhone = aiCommandEngine._convertSpokenNumberWords(text).match(/\b[6-9]\d{9}\b/)?.[0] || '';
          setFormData(prev => ({
            ...prev,
            name: (extracted.name && extracted.name.trim().length > 0) ? extracted.name : prev.name,
            age: (extracted.age && extracted.age.trim().length > 0) ? extracted.age : prev.age,
            phone: directPhone || ((extracted.phone && extracted.phone.trim().length > 0) ? extracted.phone : prev.phone),
            gender: (extracted.gender && extracted.gender.trim().length > 0) ? normalizeGender(extracted.gender, t) : prev.gender
          }));
        }
      }
    });
    
    return () => {
      setDictationMode(false);
      clearOnTranscript();
    };
  }, [activeTab, language, setOnTranscript, clearOnTranscript, setDictationMode, t]);

  // Direct test hook to verify speech transcript auto-fill pipeline via URL query
  useEffect(() => {
    const testVoice = queryParams.get('test_voice');
    if (testVoice) {
      const phrases = {
        hindi: "Mera naam Ramesh Kumar hai umar 45 saal phone number 9876543210 purush",
        english: "My name is Priya Sharma age 28 phone 9812345678 female"
      };
      const textToSimulate = phrases[testVoice] || decodeURIComponent(testVoice);
      setActiveTab('new');
      setTimeout(async () => {
        setIsExtracting(true);
        const extracted = completeRegistrationExtraction(
          textToSimulate,
          await aiCommandEngine.extractRegistrationDetails(textToSimulate, language)
        );
        setIsExtracting(false);
        if (extracted) {
          const directPhone = aiCommandEngine._convertSpokenNumberWords(textToSimulate).match(/\b[6-9]\d{9}\b/)?.[0] || '';
          setFormData({
            name: extracted.name || '',
            age: extracted.age || '',
            phone: directPhone || extracted.phone || '',
            gender: extracted.gender ? normalizeGender(extracted.gender, t) : ''
          });
        }
      }, 200);
    }
  }, [location.search, language, t]);

  const isStaff = role === 'doctor' || role === 'admin';

  return (
    <div className="auth-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minHeight: '100vh', paddingTop: 'calc(var(--header-height, 72px) + 2.5rem)', paddingBottom: '4rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', background: 'transparent' }}>
      
      <div className="auth-container" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', padding: '2.5rem', borderRadius: '24px', background: 'var(--gray-50)', boxShadow: '0 20px 40px rgba(20,71,75,0.08)', border: '1px solid var(--teal-200)' }}>
        
        {/* Top Back to Landing Page */}
        <button 
          type="button" 
          onClick={() => navigate('/')} 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--gray-500)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', marginBottom: '1.25rem', padding: '4px 8px', borderRadius: '8px', transition: 'all 0.2s' }}
          className="hover:text-teal-600"
        >
          <ArrowLeft size={18} />
          <span>{t('back') || 'Back'}</span>
        </button>

        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          {isStaff ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: role === 'doctor' ? 'var(--orange-50)' : 'var(--navy-50)', color: role === 'doctor' ? 'var(--orange-500)' : 'var(--navy-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: role === 'doctor' ? 'var(--orange-100)' : 'var(--navy-100)' }}>
                <Shield size={36} />
              </div>
              <h1 className="auth-title" style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--navy-900)' }}>
                {role === 'doctor' ? t('doctorPortal') || 'Physician Login' : t('adminPortal') || 'Admin Login'}
              </h1>
              <p className="auth-subtitle text-sm" style={{ color: 'var(--gray-500)' }}>{t('staffAccessSubtitle') || 'Secure staff access portal'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '8px', background: 'var(--teal-50)', borderRadius: '16px', display: 'inline-flex', border: '1px solid var(--teal-100)' }}>
                <SwasthyaLogo size={56} animated={true} />
              </div>
              <BrandTitle size="md" showTagline={true} taglineSize="sm" animated={true} />
              <h1 className="auth-title flex-center gap-3 mt-3" style={{ fontSize: '1.6rem', fontWeight: '900', justifyContent: 'center', color: 'var(--navy-900)' }}>
                {t('loginTitle')}
              </h1>
              <p className="auth-subtitle text-sm" style={{ color: 'var(--gray-500)' }}>{t('loginSubtitle')}</p>
            </div>
          )}
        </div>

        {authError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium animate-shake" style={{ background: 'var(--red-50)', border: '1px solid var(--red-100)', color: 'var(--red-600)' }}>
            {authError}
          </div>
        )}

        {isStaff ? (
          /* =========================================
             STAFF LOGIN UI
             ========================================= */
          <div className="auth-form animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray-600)', fontWeight: '600' }}><UserCircle size={16}/> {t('username') || 'Username'}</label>
              <input 
                type="text" 
                name="staffUsername"
                className="input-field input-field-lg"
                style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', transition: 'all 0.2s', width: '100%' }}
                placeholder={t('enterUsername') || `Enter ${role} username`}
                value={staffUsername}
                onChange={(e) => setStaffUsername(e.target.value)}
                onFocus={() => handleInputFocus('staffUsername', staffUsername)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray-600)', fontWeight: '600' }}><Key size={16}/> {t('password') || 'Password'}</label>
              <input 
                type="password" 
                name="staffPassword"
                className="input-field input-field-lg"
                style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', transition: 'all 0.2s', width: '100%' }}
                placeholder="••••••••"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                onFocus={() => handleInputFocus('staffPassword', staffPassword)}
              />
            </div>
          </div>
        ) : (
          /* =========================================
             PATIENT LOGIN UI
             ========================================= */
          <>
            <div className="auth-tabs" style={{ marginBottom: '2rem', background: 'var(--gray-100)', padding: '6px', borderRadius: '16px' }}>
              <div className={`auth-tab ${activeTab === 'abha' ? 'active' : ''}`} onClick={() => setActiveTab('abha')} style={activeTab === 'abha' ? { background: 'var(--teal-500)', color: 'white', boxShadow: '0 4px 12px rgba(20,71,75,0.15)', fontWeight: 'bold' } : { color: 'var(--gray-600)' }}>{t('abhaLogin')}</div>
              <div className={`auth-tab ${activeTab === 'aadhaar' ? 'active' : ''}`} onClick={() => setActiveTab('aadhaar')} style={activeTab === 'aadhaar' ? { background: 'var(--teal-500)', color: 'white', boxShadow: '0 4px 12px rgba(20,71,75,0.15)', fontWeight: 'bold' } : { color: 'var(--gray-600)' }}>{t('aadhaarLogin')}</div>
              <div className={`auth-tab ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')} style={activeTab === 'new' ? { background: 'var(--teal-500)', color: 'white', boxShadow: '0 4px 12px rgba(20,71,75,0.15)', fontWeight: 'bold' } : { color: 'var(--gray-600)' }}>{t('newPatient')}</div>
            </div>

            <div className="card" style={{ padding: '0', border: 'none', boxShadow: 'none', background: 'transparent' }}>
              {activeTab === 'abha' && (
                <div className="auth-form animate-fade-in-up">
                  <div 
                    className="qr-scanner-placeholder" 
                    onClick={() => setShowScanner(true)}
                    style={{ background: 'var(--gray-100)', padding: '2rem', borderRadius: '16px', border: '2px dashed var(--teal-200)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--gray-600)', marginBottom: '1.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--teal-50)'; e.currentTarget.style.borderColor = 'var(--teal-400)'; e.currentTarget.style.color = 'var(--teal-600)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'var(--gray-100)'; e.currentTarget.style.borderColor = 'var(--teal-200)'; e.currentTarget.style.color = 'var(--gray-600)'; }}
                  >
                    <QrCode size={48} />
                    <span>{t('scanAbha') || 'Scan ABHA QR Code'}</span>
                  </div>
                  
                  {showScanner && (
                    <ABHAScanner 
                      t={t}
                      onClose={() => setShowScanner(false)}
                      onScan={(text) => {
                        setAbhaId(text);
                        setShowScanner(false);
                      }}
                    />
                  )}
                  
                  <div className="divider-with-text" style={{ textAlign: 'center', color: 'var(--gray-400)', margin: '1rem 0', fontSize: '0.875rem' }}>{t('or') || 'OR'}</div>
                  <div className="input-group">
                    <label className="input-label" style={{ fontWeight: '600', color: 'var(--gray-700)' }}>{t('enterAbha')}</label>
                    <input 
                      type="text" 
                      name="abhaId"
                      className="input-field input-field-lg" 
                      style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', transition: 'all 0.2s', width: '100%' }}
                      placeholder="XX-XXXX-XXXX-XXXX"
                      value={abhaId}
                      onChange={(e) => setAbhaId(e.target.value)}
                      onFocus={() => handleInputFocus('abhaId', abhaId)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'aadhaar' && (
                <div className="auth-form animate-fade-in-up">
                  <div className="input-group">
                    <label className="input-label" style={{ fontWeight: '600', color: 'var(--gray-700)' }}>{t('enterAadhaar')}</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        name="aadhaar"
                        className="input-field input-field-lg flex-grow" 
                        style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', transition: 'all 0.2s', width: '100%' }}
                        placeholder="XXXX XXXX XXXX"
                        value={aadhaar}
                        onChange={(e) => setAadhaar(e.target.value)}
                        maxLength={12}
                        onFocus={() => handleInputFocus('aadhaar', aadhaar)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'new' && (
                <div className="auth-form animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {isExtracting && (
                    <div style={{ padding: '0.75rem', background: 'var(--teal-50)', border: '1px solid var(--teal-200)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--teal-700)', fontWeight: '500' }}>
                      <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid var(--teal-600)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      {t('extractingVoice') || 'Extracting details from voice...'}
                    </div>
                  )}

                  <div className="input-group">
                    <label className="input-label" style={{ fontWeight: '600', color: 'var(--gray-700)' }}>{t('fullName')}</label>
                    <input 
                      type="text" 
                      className="input-field input-field-lg"
                      style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', transition: 'all 0.2s', width: '100%' }}
                      name="name"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.name}
                      onChange={handleFormChange}
                      onFocus={() => handleInputFocus('name', formData.name)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: '600', color: 'var(--gray-700)' }}>{t('age')}</label>
                      <input 
                        type="number" 
                        className="input-field input-field-lg"
                        style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', transition: 'all 0.2s', width: '100%' }}
                        name="age"
                        placeholder="e.g. 45"
                        value={formData.age}
                        onChange={handleFormChange}
                        onFocus={() => handleInputFocus('age', formData.age)}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: '600', color: 'var(--gray-700)' }}>{t('phone')}</label>
                      <input 
                        type="tel" 
                        className="input-field input-field-lg"
                        style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', transition: 'all 0.2s', width: '100%' }}
                        name="phone"
                        placeholder="10-digit mobile"
                        value={formData.phone}
                        onChange={handleFormChange}
                        onFocus={() => handleInputFocus('phone', formData.phone)}
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ fontWeight: '600', color: 'var(--gray-700)' }}>{t('gender')}</label>
                    <div className="gender-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      {[t('male'), t('female'), t('other')].map(g => (
                        <div 
                          key={g}
                          className={`gender-card ${formData.gender === g ? 'selected' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                          style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid', borderColor: formData.gender === g ? 'var(--teal-500)' : 'var(--gray-200)', borderRadius: '12px', cursor: 'pointer', background: formData.gender === g ? 'var(--teal-50)' : 'var(--gray-50)', color: formData.gender === g ? 'var(--teal-700)' : 'var(--gray-600)', transition: 'all 0.2s', boxShadow: formData.gender === g ? '0 4px 12px rgba(13,148,136,0.1)' : 'none' }}
                        >
                          <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>{g}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Bar */}
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
          <button 
            type="button"
            className="btn btn-ghost" 
            onClick={() => navigate('/')} 
            style={{ flex: 1, color: 'var(--gray-600)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderRadius: '12px', border: '1px solid var(--gray-300)', background: 'var(--gray-100)' }}
          >
            <ArrowLeft size={18} />
            {t('back') || 'Back'}
          </button>
          <button 
            type="button"
            className={`btn ${isStaff && role === 'doctor' ? 'btn-accent' : 'btn-primary'}`}
            onClick={handleNext}
            style={{ flex: 2, padding: '16px', fontWeight: 'bold', borderRadius: '12px', ...(isStaff && role === 'admin' ? { background: 'var(--navy-700)' } : {}) }}
          >
            {t('loginSecurely') || 'Login Securely'}
          </button>
        </div>

        {/* Role Switcher Helper */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)', textAlign: 'center', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
          {role === 'patient' ? (
            <>
              <span style={{ fontWeight: '500' }}>Are you a Doctor or Hospital Admin?</span>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '0.6rem' }}>
                <button 
                  type="button"
                  onClick={() => navigate('/auth?role=doctor')} 
                  style={{ background: 'none', border: 'none', color: 'var(--orange-600)', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                  className="hover:underline"
                >
                  <Stethoscope size={15} /> Doctor Portal →
                </button>
                <span style={{ color: 'var(--gray-300)' }}>|</span>
                <button 
                  type="button"
                  onClick={() => navigate('/auth?role=admin')} 
                  style={{ background: 'none', border: 'none', color: 'var(--navy-700)', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                  className="hover:underline"
                >
                  <Shield size={15} /> Admin Portal →
                </button>
              </div>
            </>
          ) : (
            <>
              <span style={{ fontWeight: '500' }}>Are you a Patient looking to start a health session?</span>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '0.6rem' }}>
                <button 
                  type="button"
                  onClick={() => navigate('/auth?role=patient')} 
                  style={{ background: 'none', border: 'none', color: 'var(--teal-600)', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                  className="hover:underline"
                >
                  <Users size={15} /> Go to Patient Intake →
                </button>
                {role === 'doctor' ? (
                  <>
                    <span style={{ color: 'var(--gray-300)' }}>|</span>
                    <button 
                      type="button"
                      onClick={() => navigate('/auth?role=admin')} 
                      style={{ background: 'none', border: 'none', color: 'var(--navy-700)', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                      className="hover:underline"
                    >
                      <Shield size={15} /> Admin Portal →
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ color: 'var(--gray-300)' }}>|</span>
                    <button 
                      type="button"
                      onClick={() => navigate('/auth?role=doctor')} 
                      style={{ background: 'none', border: 'none', color: 'var(--orange-600)', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                      className="hover:underline"
                    >
                      <Stethoscope size={15} /> Doctor Portal →
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {showKeyboard && activeInput && (
        <VirtualKeyboard
          inputName={activeInput.name}
          inputValue={activeInput.value}
          onChange={handleKeyboardChange}
          onClose={() => setShowKeyboard(false)}
        />
      )}
    </div>
  );
}
