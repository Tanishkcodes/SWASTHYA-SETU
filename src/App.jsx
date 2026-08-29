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

// Scroll to top and stop audio on route change
function RouteChangeListener() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Stop any ongoing voice agent speech or prompts when navigating away
    audioFeedback.stop();
    audioPromptManager.stop();
    const pageId = pathname === '/' ? 'landing' : pathname.replace(/^\//, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    audioPromptManager.setCurrentPage(pageId);
    const timer = setTimeout(() => {
      if (pageId === 'landing') audioPromptManager.speakInitialLandingWelcome();
      else audioPromptManager.speakPageWelcome(pageId);
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

function GlobalVoiceHandler() {
  const { registerGlobalHandlers } = useVoiceNav();
  const navigate = useNavigate();

  useEffect(() => {
    commandParser.setRoutes(VOICE_ROUTES.map(({ id, description }) => ({ id, description })));
    registerGlobalHandlers({
      scrollDown: () => {
        window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
      },
      scrollUp: () => {
        window.scrollBy({ top: -(window.innerHeight * 0.8), behavior: 'smooth' });
      },
      bookAppointment: () => {
        navigate('/auth?role=patient');
      },
      home: () => {
        navigate('/');
      },
      navigate: ({ target }) => {
        const destination = VOICE_ROUTES.find(route => route.id === target);
        if (destination) navigate(destination.path);
      }
    });
  }, [registerGlobalHandlers, navigate]);

  return null;
}

function Layout({ children, showHeader = true }) {
  return (
    <>
      <GlobalVoiceHandler />
      {showHeader && <Header />}
      <main className="app-main flex-grow">{children}</main>
      <VoiceNavIndicator />
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
              <Route path="/interview" element={<Layout><HistoryInterviewPage /></Layout>} />
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
