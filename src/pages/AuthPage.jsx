import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';
import { UserCircle, Key, Shield, ArrowLeft, Stethoscope, Users, Eye, EyeOff, QrCode } from 'lucide-react';
import VirtualKeyboard from '../components/VirtualKeyboard';
import SwasthyaLogo from '../components/SwasthyaLogo';
import BrandTitle from '../components/BrandTitle';
import aiCommandEngine from '../engine/AICommandEngine';
import audioFeedback from '../voicenav/AudioFeedback';
import { db, getAuthLockStatus } from '../lib/db';
import '../styles/auth.css';

const ABHAScanner = React.lazy(() => import('../components/ABHAScanner'));

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
  const isStaff = role === 'doctor' || role === 'admin';

  const { t, currentLang } = useLanguage();
  const { loginPatient, loginStaff, session } = useSession();
  const { audioPromptManager, registerPage, unregisterPage, language, setOnTranscript, clearOnTranscript, setDictationMode, speak } = useVoiceNav();

  // Loading state
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Patient states
  const [activeTab, setActiveTab] = useState('new'); // 'abha', 'aadhaar', 'new'
  const [abhaId, setAbhaId] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: ''
  });

  // Staff states
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [lockRemaining, setLockRemaining] = useState(0);

  // Live 1-second interval to continuously tick down lockout seconds in real-time
  useEffect(() => {
    if (!isStaff) return;
    const updateLockoutTimer = () => {
      const u = staffUsername.trim();
      if (!u) {
        setLockRemaining(0);
        return;
      }
      const status = getAuthLockStatus(u);
      if (status.locked) {
        setLockRemaining(status.remainingSeconds);
      } else {
        setLockRemaining(0);
        setAuthError(prev => (prev && prev.includes('locked') ? '' : prev));
      }
    };

    updateLockoutTimer();
    const timer = setInterval(updateLockoutTimer, 1000);
    return () => clearInterval(timer);
  }, [isStaff, staffUsername]);

  // Keyboard state
  const [activeInput, setActiveInput] = useState(null); // { name, value }
  const [showKeyboard, setShowKeyboard] = useState(false);
  
  // Registration voice state
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    // If arriving directly, ensure no stuck audio
    audioFeedback.stop();
  }, []);

  // If user is already authenticated with the matching role, redirect directly to their dashboard
  useEffect(() => {
    if (session?.isAuthenticated && session?.userRole === role) {
      if (role === 'doctor') {
        navigate('/physician', { replace: true });
      } else if (role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (role === 'patient') {
        navigate('/patient-dashboard', { replace: true });
      }
    }
  }, [session?.isAuthenticated, session?.userRole, role, navigate]);

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
    }, {
      next: ['Continue, submit, log in, or finish after checking the entered patient details'],
      back: ['Return to the previous page'],
      home: ['Return to the Swasthya Setu landing page'],
      cancel: ['Cancel patient identification and return home'],
      login_abha: ['Use an ABHA health ID to identify the patient'],
      login_aadhaar: ['Use an Aadhaar number to identify the patient'],
      register_new: ['Register a new patient using name, age, phone, and gender'],
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
    if (isLoggingIn) return;
    setAuthError('');
    setIsLoggingIn(true);

    try {
      // ----------------------------
      // PATIENT LOGIN (INSTANT 0ms UI TRANSITION)
      // ----------------------------
      if (role === 'patient') {
        let patientData = { authMethod: activeTab };
        
        if (activeTab === 'abha') {
          if (!abhaId) { setAuthError(t('enterAbha')); setIsLoggingIn(false); return; }
          patientData.abhaId = abhaId;
          patientData.name = "Patient (from ABHA)";
        } else if (activeTab === 'aadhaar') {
          if (aadhaar.length < 12) { setAuthError('Invalid Aadhaar'); setIsLoggingIn(false); return; }
          patientData.aadhaarLast4 = aadhaar.slice(-4);
          patientData.name = "Patient (from Aadhaar)";
        } else {
          if (!formData.name) { setAuthError((t('fullName') || 'Full Name') + ' is required'); setIsLoggingIn(false); return; }
          patientData = { ...patientData, ...formData };
        }

        const localId = 'pat-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const fullPatient = { ...patientData, id: localId };

        // 1. Instantly log in and navigate without blocking on network latency
        loginPatient(fullPatient);
        navigate('/patient-dashboard', { replace: true });

        // 2. Persist to database in parallel and update ID seamlessly
        db.patients.upsert({
          name: patientData.name,
          phone: patientData.phone || null,
          age: patientData.age ? Number(patientData.age) : null,
          gender: patientData.gender || null,
          language: currentLang || 'en',
          abhaId: patientData.abhaId || null,
          aadhaarLast4: patientData.aadhaarLast4 || null,
          authMethod: patientData.authMethod,
        }).then(({ data: savedPatient }) => {
          if (savedPatient?.id) {
            loginPatient({ ...patientData, id: savedPatient.id });
          }
        }).catch(err => console.warn('Background patient database sync:', err));
        return;
      }

      // ----------------------------
      // STAFF LOGIN (Doctor/Admin)
      // ----------------------------
      if (!staffUsername || !staffPassword) {
        setAuthError('Please enter both username and password.');
        setIsLoggingIn(false);
        return;
      }

      const { data: staff, error } = await db.staff.login(staffUsername.trim(), staffPassword);
      if (error) { setAuthError(error.message); setIsLoggingIn(false); return; }
      if (staff?.role === 'doctor' && role === 'doctor') {
        loginStaff(staff);
        navigate('/physician', { replace: true });
      } else if (staff?.role === 'admin' && role === 'admin') {
        loginStaff(staff);
        navigate('/admin-dashboard', { replace: true });
      } else {
        setAuthError('Invalid username, password, or portal role.');
        setIsLoggingIn(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setAuthError('An unexpected error occurred during login. Please try again.');
      setIsLoggingIn(false);
    }
  };

  handleNextRef.current = handleNext;

  const handleInputFocus = (name, value) => {
    setActiveInput({ name, value: value || '' });
  };

  const handleKeyboardChange = (e) => {
    const val = (e && e.target) ? e.target.value : (typeof e === 'string' ? e : '');
    const name = activeInput?.name;
    if (!name) return;
    if (name === 'staffUsername') setStaffUsername(val);
    else if (name === 'staffPassword') setStaffPassword(val);
    else if (name === 'abhaId') setAbhaId(val);
    else if (name === 'aadhaar') setAadhaar(val);
    else {
      setFormData(prev => ({ ...prev, [name]: val }));
    }
    setActiveInput(prev => ({ ...prev, value: val }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (activeInput && activeInput.name === name) {
      setActiveInput({ name, value });
    }
  };

  // ----------------------------
  // GLOBAL VOICE ORB & FIELD TRANSCRIPT REGISTRATION (AI-POWERED)
  // ----------------------------
  useEffect(() => {
    setDictationMode(false);
    setOnTranscript(async (text, recognitionResult = {}) => {
      if (!text || text.trim().length < 2) return;
      
      setIsExtracting(true);
      let extracted = null;
      try {
        extracted = await aiCommandEngine.extractRegistrationDetails(
          text,
          language || currentLang || 'en',
          {
            activeTab,
            existingFields: {
              name: formData.name,
              age: formData.age,
              gender: formData.gender,
              phonePresent: Boolean(formData.phone),
              abhaPresent: Boolean(abhaId),
              aadhaarPresent: Boolean(aadhaar),
            },
            recognitionAlternatives: recognitionResult.recognitionAlternatives || [],
          }
        );
      } catch (error) {
        console.warn('Patient voice details could not be extracted:', error);
      } finally {
        setIsExtracting(false);
      }

      if (!extracted) return;

      // One semantic result can navigate the patient portal or fill it. This
      // supports indirect, conversational requests without a phrase list.
      if (extracted.requestedAction === 'back' || extracted.requestedAction === 'home') {
        navigate('/');
        return;
      }
      if (extracted.requestedAction === 'use_abha' && !extracted.abhaId) {
        setActiveTab('abha');
        return;
      }
      if (extracted.requestedAction === 'use_aadhaar' && !extracted.aadhaar) {
        setActiveTab('aadhaar');
        return;
      }
      if (extracted.requestedAction === 'new_patient') {
        setActiveTab('new');
        return;
      }
      if (extracted.requestedAction === 'submit') {
        handleNextRef.current?.();
        return;
      }

      // 1. If ABHA ID was detected
      if (extracted.abhaId) {
        setActiveTab('abha');
        setAbhaId(extracted.abhaId);
        speak?.(extracted.confirmationMessage || `ABHA number set: ${extracted.abhaId}`, language);
        return;
      }

      // 2. If Aadhaar number was detected
      if (extracted.aadhaar) {
        setActiveTab('aadhaar');
        setAadhaar(extracted.aadhaar);
        speak?.(extracted.confirmationMessage || `Aadhaar number set`, language);
        return;
      }

      // 3. If User is on ABHA or Aadhaar tab and spoke just digits/numbers
      if (activeTab === 'abha' && !extracted.name) {
        const converted = aiCommandEngine._convertSpokenNumberWords(text);
        const digits = converted.replace(/[^0-9]/g, '');
        if (digits.length >= 14) {
          const formatted = `${digits.slice(0,2)}-${digits.slice(2,6)}-${digits.slice(6,10)}-${digits.slice(10,14)}`;
          setAbhaId(formatted);
          speak?.(`ABHA number set: ${formatted}`, language);
          return;
        } else if (digits.length >= 4) {
          setAbhaId(digits);
          speak?.(`ABHA number: ${digits}`, language);
          return;
        }
      } else if (activeTab === 'aadhaar' && !extracted.name) {
        const converted = aiCommandEngine._convertSpokenNumberWords(text);
        const digits = converted.replace(/[^0-9]/g, '');
        if (digits.length >= 12) {
          setAadhaar(digits.slice(0, 12));
          speak?.(`Aadhaar number set`, language);
          return;
        } else if (digits.length >= 4) {
          setAadhaar(prev => (prev + digits).slice(0, 12));
          return;
        }
      }

      // 4. Fill New Patient Registration Form with AI Extracted entities
      const newName = extracted.name?.trim() || '';
      const newAge = extracted.age ? String(extracted.age).trim() : '';
      const newPhone = extracted.phone?.trim() || '';
      const newGender = extracted.gender ? normalizeGender(extracted.gender, t) : '';

      if (newName || newAge || newPhone || newGender) {
        setActiveTab('new');
        setFormData(prev => ({
          ...prev,
          name:   newName.length > 0 ? newName : prev.name,
          age:    newAge.length > 0  ? newAge  : prev.age,
          phone:  newPhone.length > 0 ? newPhone : prev.phone,
          gender: newGender.length > 0 ? newGender : prev.gender,
        }));

        if (extracted.confirmationMessage) {
          speak?.(extracted.confirmationMessage, language);
        } else {
          const confirmParts = [];
          if (newName)   confirmParts.push(`Name: ${newName}`);
          if (newAge)    confirmParts.push(`Age: ${newAge}`);
          if (newPhone)  confirmParts.push(`Phone: ${newPhone}`);
          if (newGender) confirmParts.push(`Gender: ${newGender}`);
          speak?.(confirmParts.join(', '), language);
        }
      }
    });
    
    return () => {
      setDictationMode(false);
      clearOnTranscript();
    };
  }, [activeTab, language, currentLang, setOnTranscript, clearOnTranscript, setDictationMode, t, speak, navigate, formData.name, formData.age, formData.gender, formData.phone, abhaId, aadhaar]);

  // Direct test hook to verify speech transcript auto-fill pipeline via URL query
  useEffect(() => {
    const testVoice = queryParams.get('test_voice');
    if (testVoice) {
      const phrases = {
        hindi:           "Mera naam Ramesh Kumar hai umar 45 saal phone number 9876543210 purush",
        english:         "My name is Priya Sharma age 28 phone 9812345678 female",
        tamil:           "என் பெயர் Kavitha, வயது 32, phone 9876543210, பெண்",
        telugu:          "నా పేరు Ravi Teja, వయసు 35, phone 9123456789, పురుషుడు",
        marathi:         "माझे नाव Suresh Patil आहे, वय 40, phone 9876543210, पुरुष",
        bengali:         "আমার নাম Anita, বয়স 25, phone 9876543210, মহিলা",
        gujarati:        "મારું નામ Hiren Shah, ઉંમર 38, phone 9876543210, purush",
        kannada:         "ನನ್ನ ಹೆಸರು Ravi Kumar, ವಯಸ್ಸು 30, phone 9876543210, ಪುರುಷ",
        malayalam:       "എന്റെ പേര് Arun Nair, വയസ്സ് 27, phone 9876543210, ആൺ",
        self_correction: "Mera naam Suresh nahi Ramesh Kumar hai, umar 30 nahi 35 saal, phone 9876543210, purush",
        mixed:           "My name is Priya, umar 28 saal, phone number nine eight seven six five four three two one zero, female",
      };

      const textToSimulate = phrases[testVoice] || decodeURIComponent(testVoice);
      setActiveTab('new');
      setTimeout(async () => {
        setIsExtracting(true);
        const extracted = await aiCommandEngine.extractRegistrationDetails(textToSimulate, language || currentLang || 'en', { activeTab: 'new' });
        setIsExtracting(false);
        if (extracted) {
          setFormData({
            name: extracted.name || '',
            age: extracted.age ? String(extracted.age) : '',
            phone: extracted.phone || '',
            gender: extracted.gender ? normalizeGender(extracted.gender, t) : ''
          });
        }
      }, 200);
    }
  }, [location.search, language, currentLang, t]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTIVE SESSION GUARD: If already logged into a DIFFERENT portal, require logout
  // ─────────────────────────────────────────────────────────────────────────────
  if (session?.isAuthenticated && session?.userRole && session?.userRole !== role) {
    const roleLabels = {
      patient: 'Patient Portal',
      doctor: 'Doctor / Physician Portal',
      admin: 'Hospital Admin Portal',
    };
    const activePortalName = roleLabels[session.userRole] || 'Active Portal';
    const targetPortalName = roleLabels[role] || 'Portal';
    const activeUserName = session.userRole === 'patient'
      ? (session.patient?.name || session.patient?.phone || 'Patient')
      : (session.staff?.name || session.staff?.username || 'Staff User');

    const handleReturnToActive = () => {
      if (session.userRole === 'doctor') navigate('/physician');
      else if (session.userRole === 'admin') navigate('/admin-dashboard');
      else navigate('/patient-dashboard');
    };

    return (
      <div className="auth-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', padding: '2rem' }}>
        <div style={{
          width: '100%',
          maxWidth: '520px',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '3rem 2.5rem',
          boxShadow: '0 25px 60px rgba(15, 23, 42, 0.1)',
          border: '1px solid var(--gray-200)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: '#fffbeb',
            border: '2px solid #fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <Shield size={34} />
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--navy-900)', marginBottom: '0.75rem', letterSpacing: '-0.3px' }}>
            Active Session Detected
          </h2>

          <p style={{ color: 'var(--gray-600)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            You are currently logged in as <strong style={{ color: 'var(--navy-900)' }}>{activeUserName}</strong> in the <strong style={{ color: 'var(--teal-700)' }}>{activePortalName}</strong>.
            <br />
            To access the <strong>{targetPortalName}</strong>, please log out of your current session first.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReturnToActive}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '700',
                background: session.userRole === 'admin' ? 'var(--navy-800)' : session.userRole === 'doctor' ? 'var(--orange-600)' : 'var(--teal-600)',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Return to My {activePortalName} →
            </button>

            <button
              type="button"
              onClick={() => logout()}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '0.925rem',
                fontWeight: '600',
                color: '#dc2626',
                border: '1px solid #fecaca',
                background: '#fef2f2',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Log Out and Switch to {targetPortalName}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gray-500)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                marginTop: '0.5rem',
                fontWeight: '500'
              }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleNext();
                  }
                }}
              />
            </div>
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray-600)', fontWeight: '600' }}><Key size={16}/> {t('password') || 'Password'}</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input 
                  type={showStaffPassword ? "text" : "password"} 
                  name="staffPassword"
                  className="input-field input-field-lg"
                  style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', transition: 'all 0.2s', width: '100%', paddingRight: '46px' }}
                  placeholder="••••••••"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  onFocus={() => handleInputFocus('staffPassword', staffPassword)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNext();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowStaffPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: showStaffPassword ? 'var(--teal-600)' : 'var(--gray-400)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    borderRadius: '8px',
                    transition: 'color 0.2s'
                  }}
                  title={showStaffPassword ? "Hide password" : "Show password"}
                  aria-label={showStaffPassword ? "Hide password" : "Show password"}
                >
                  {showStaffPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
                    <React.Suspense fallback={null}>
                      <ABHAScanner
                        t={t}
                        onClose={() => setShowScanner(false)}
                        onScan={(text) => {
                          setAbhaId(text);
                          setShowScanner(false);
                        }}
                      />
                    </React.Suspense>
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNext();
                        }
                      }}
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNext();
                        }
                      }}
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
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
          {(() => {
            const mins = Math.floor(lockRemaining / 60);
            const secs = lockRemaining % 60;
            const lockTimeStr = mins > 0 ? `${mins}m ${String(secs).padStart(2, '0')}s` : `${secs}s`;
            const isLocked = lockRemaining > 0;

            return (
              <button 
                type="button"
                disabled={isLoggingIn || isLocked}
                className={`btn ${isStaff && role === 'doctor' ? 'btn-accent' : 'btn-primary'}`}
                onClick={handleNext}
                style={{
                  flex: 2,
                  padding: '16px',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  opacity: (isLoggingIn || isLocked) ? 0.7 : 1,
                  cursor: (isLoggingIn || isLocked) ? 'not-allowed' : 'pointer',
                  ...(isStaff && role === 'admin' && !isLocked ? { background: 'var(--navy-700)' } : {}),
                  ...(isLocked ? { background: '#94a3b8', borderColor: '#94a3b8', color: '#fff' } : {})
                }}
              >
                {isLoggingIn ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    Connecting...
                  </span>
                ) : isLocked ? (
                  `Locked (${lockTimeStr})`
                ) : (
                  t('loginSecurely') || 'Login Securely'
                )}
              </button>
            );
          })()}
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
