import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import { LanguageProvider } from './context/LanguageContext';
import { VoiceNavProvider, useVoiceNav } from './voicenav/VoiceNavProvider';
import VoiceNavIndicator from './voicenav/VoiceNavIndicator';
import audioFeedback from './voicenav/AudioFeedback';
import audioPromptManager from './voicenav/AudioPromptManager';
import commandParser from './voicenav/CommandParser';

const VOICE_ROUTES = [
  { id: 'home', path: '/', description: 'home, landing page, main menu' },
  { id: 'patient-login', path: '/auth?role=patient', description: 'patient registration or login' },
  { id: 'doctor-login', path: '/auth?role=doctor', description: 'doctor or physician login' },
  { id: 'admin-login', path: '/auth?role=admin', description: 'administrator login' },
  { id: 'language', path: '/language', description: 'choose or change language' },
  { id: 'consent', path: '/consent', description: 'privacy and consent' },
  { id: 'interview', path: '/interview', description: 'clinical history interview or symptoms' },
  { id: 'scan', path: '/scan', description: 'scan prescription, document, or lab report' },
  { id: 'summary', path: '/summary', description: 'health or clinical summary' },
  { id: 'patient-dashboard', path: '/patient-dashboard', description: 'patient dashboard, appointments, reports, history' },
  { id: 'physician-dashboard', path: '/physician', description: 'doctor queue and physician dashboard' },
  { id: 'admin-dashboard', path: '/admin-dashboard', description: 'hospital administration dashboard' },
];

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import LanguageSelectPage from './pages/LanguageSelectPage';
import ConsentPage from './pages/ConsentPage';
import HistoryInterviewPage from './pages/HistoryInterviewPage';
import DocumentScanPage from './pages/DocumentScanPage';
import SummaryPage from './pages/SummaryPage';
import CompletionPage from './pages/CompletionPage';
import PhysicianDashboard from './pages/PhysicianDashboard';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Shared Components
import Header from './components/Header';

// Styles
import './styles/global.css';
import './styles/components.css';

import domTranslator from './engine/DOMTranslator';
import { useLanguage } from './context/LanguageContext';

// Scroll to top and stop audio on route change
function RouteChangeListener() {
  const { pathname } = useLocation();
  const voiceEnabled = pathname !== '/physician' && pathname !== '/admin-dashboard';

  useEffect(() => {
    window.scrollTo(0, 0);
    // Stop any ongoing voice agent speech or prompts when navigating away
    audioFeedback.stop();
    audioPromptManager.stop();
    const pageId = pathname === '/' ? 'landing' : pathname.replace(/^\//, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    audioPromptManager.setCurrentPage(pageId);

    // Trigger instant DOM re-scan for dynamic language translation on route change
    domTranslator.triggerFullScan();
    const timer = setTimeout(() => {
      domTranslator.triggerFullScan();
      if (!voiceEnabled) return;
      if (pageId === 'landing') audioPromptManager.speakInitialLandingWelcome();
      else audioPromptManager.speakPageWelcome(pageId);
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname, voiceEnabled]);

  return null;
}

function GlobalVoiceHandler() {
  const { registerGlobalHandlers } = useVoiceNav();
  const { setCurrentLang } = useLanguage();
  const { logout } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    commandParser.setRoutes(VOICE_ROUTES.map(({ id, description }) => ({ id, description })));
    registerGlobalHandlers({
      // ── Scroll ────────────────────────────────────────────────────────────
      scrollDown: () => window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' }),
      scrollUp:   () => window.scrollBy({ top: -(window.innerHeight * 0.8), behavior: 'smooth' }),

      // ── Navigation ───────────────────────────────────────────────────────
      home:        () => navigate('/'),
      back:        () => window.history.length > 1 ? window.history.back() : navigate('/'),
      logout:      () => { logout?.(); navigate('/'); },
      emergency:   () => { window.open('tel:108', '_self'); },

      // ── Authentication portals ───────────────────────────────────────────
      bookAppointment: () => navigate('/auth?role=patient'),
      login_patient:   () => navigate('/auth?role=patient'),
      login_doctor:    () => navigate('/auth?role=doctor'),
      login_admin:     () => navigate('/auth?role=admin'),
      login_abha:      () => navigate('/auth?role=patient'),
      login_aadhaar:   () => navigate('/auth?role=patient'),
      register_new:    () => navigate('/auth?role=patient'),

      // ── App sections ─────────────────────────────────────────────────────
      scan_document:     () => navigate('/scan'),
      scanRecord:        () => navigate('/scan'),
      select_language:   () => navigate('/language'),
      startConsultation: () => navigate('/language'),
      triage:            () => navigate('/language'),

      // ── Patient Dashboard Tab Navigation (global fallback) ───────────────
      // Page-level handlers override these when patientDashboard is active
      viewAppointments: () => navigate('/patient-dashboard'),
      viewHistory:      () => navigate('/patient-dashboard'),
      viewReports:      () => navigate('/patient-dashboard'),
      viewDonations:    () => navigate('/patient-dashboard'),
      viewCommunities:  () => navigate('/patient-dashboard'),
      viewHelp:         () => navigate('/patient-dashboard'),
      viewProfile:      () => navigate('/patient-dashboard'),
      showAbhaCard:     () => navigate('/patient-dashboard'),
      toggleAyush:      () => navigate('/patient-dashboard'),
      searchHospital:   () => navigate('/patient-dashboard'),

      // ── Named route navigation (from AI navigate_to intent) ──────────────
      navigate: ({ value, target }) => {
        const dest = VOICE_ROUTES.find(r => r.id === (value || target));
        if (dest) navigate(dest.path);
      },
      navigate_to: ({ value }) => {
        const dest = VOICE_ROUTES.find(r => r.id === value);
        if (dest) navigate(dest.path);
      },

      // ── Global Voice Language Switching (all 9 languages) ────────────────
      set_language_hi: () => setCurrentLang('hi'),
      set_language_mr: () => setCurrentLang('mr'),
      set_language_gu: () => setCurrentLang('gu'),
      set_language_ta: () => setCurrentLang('ta'),
      set_language_te: () => setCurrentLang('te'),
      set_language_bn: () => setCurrentLang('bn'),
      set_language_kn: () => setCurrentLang('kn'),
      set_language_ml: () => setCurrentLang('ml'),
      set_language_en: () => setCurrentLang('en'),
    });
  }, [registerGlobalHandlers, navigate, setCurrentLang, logout]);

  return null;
}

function Layout({ children, showHeader = true }) {
  const { pathname, search } = useLocation();
  const authRole = new URLSearchParams(search).get('role');
  const showVoiceIndicator = !(
    pathname === '/auth' && (authRole === 'doctor' || authRole === 'admin')
  );

  return (
    <>
      <GlobalVoiceHandler />
      {showHeader && <Header />}
      <main className="app-main flex-grow">{children}</main>
      {showVoiceIndicator && <VoiceNavIndicator />}
    </>
  );
}

function ProtectedRoute({ children, requiredRole }) {
  const { session, logout } = useSession();
  
  // Enforce midnight auto-logout for doctor and admin roles
  if (session.isAuthenticated && (session.userRole === 'doctor' || session.userRole === 'admin')) {
    if (session.sessionExpiresAt && Date.now() >= session.sessionExpiresAt) {
      logout();
      return <Navigate to={`/auth?role=${requiredRole || session.userRole}`} replace />;
    }
  }

  if (!session.isAuthenticated) {
    return <Navigate to={requiredRole ? `/auth?role=${requiredRole}` : "/auth"} replace />;
  }

  if (requiredRole && session.userRole !== requiredRole) {
    return <Navigate to={`/auth?role=${requiredRole}`} replace />; // redirect to correct login role
  }

  return children;
}

function App() {
  return (
    <Router>
      <SessionProvider>
        <VoiceNavProvider>
          <LanguageProvider>
            <RouteChangeListener />
            <Routes>
              <Route path="/" element={<Layout><LandingPage /></Layout>} />
              <Route path="/auth" element={<Layout><AuthPage /></Layout>} />
              <Route path="/language" element={<Layout><LanguageSelectPage /></Layout>} />
              <Route path="/consent" element={<Layout><ConsentPage /></Layout>} />
              <Route path="/interview" element={<Navigate to="/patient-dashboard" replace />} />
              <Route path="/scan" element={<Layout><DocumentScanPage /></Layout>} />
              <Route path="/summary" element={<Layout><SummaryPage /></Layout>} />
              <Route path="/completion" element={<Layout><CompletionPage /></Layout>} />
              
              {/* Role-Specific Dashboards */}
              <Route path="/patient-dashboard" element={<ProtectedRoute requiredRole="patient"><Layout showHeader={false}><PatientDashboard /></Layout></ProtectedRoute>} />
              <Route path="/physician" element={<ProtectedRoute requiredRole="doctor"><PhysicianDashboard /></ProtectedRoute>} />
              <Route path="/admin-dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </LanguageProvider>
        </VoiceNavProvider>
      </SessionProvider>
    </Router>
  );
}

export default App;
