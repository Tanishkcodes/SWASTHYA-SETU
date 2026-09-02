/* ============================================
   SWASTHYA SETU — Session Context
   Manages patient session state throughout intake
   ============================================ */

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { db } from '../lib/db';

const SessionContext = createContext(null);

export function getNextMidnightTimestamp() {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // Sets time to 00:00:00 of tomorrow (midnight)
  return midnight.getTime();
}

const initialState = {
  // Authentication
  isAuthenticated: false,
  userRole: null, // 'patient', 'doctor', 'admin'
  sessionExpiresAt: null, // Midnight timestamp for doctor & admin, null for patient
  loginTimestamp: null,

  // Patient identity
  patient: {
    id: null,
    abhaId: '',
    aadhaarLast4: '',
    name: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    authMethod: '', // 'abha', 'aadhaar', 'new'
  },
  staff: null,

  // Session settings
  language: 'en',
  isAyushMode: false,
  consents: {
    voice: false,
    document: false,
    abha: false,
    share: false,
  },

  // Interview data
  history: {
    chiefComplaint: null,
    bodySystem: null,
    hpiResponses: [],          // { question, answer, category }
    pastMedical: [],           // { condition, present, since, treatment }
    pastSurgical: [],          // { surgery, when, where, complications }
    medications: [],           // { name, dose, frequency, duration }
    allergies: [],             // { type, allergen, reaction }
    familyHistory: [],         // { relative, condition }
    personalHistory: {},       // { smoking, alcohol, tobacco, diet, sleep, exercise, etc. }
    reviewOfSystems: {},       // { system: { symptom: true/false } }
    ayushAssessment: null,     // Dashavidha Pariksha data
  },

  // Interview progress
  interviewProgress: {
    currentSection: 'chiefComplaint',
    currentQuestionIndex: 0,
    completedSections: [],
    totalSections: 9,
    completionPercentage: 0,
  },

  // Documents
  documents: [],  // { id, type, imageData, extractedData, timestamp }
  summary: null,
  redFlags: [],
  tokenNumber: null,
  isSubmitted: false,
  sessionStartTime: null,
  intakeId: null,
};

const getInitialState = () => {
  try {
    const saved = localStorage.getItem('swasthya_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if doctor or admin session has expired past midnight
      if (parsed.isAuthenticated && (parsed.userRole === 'doctor' || parsed.userRole === 'admin')) {
        const now = Date.now();
        if (!parsed.sessionExpiresAt || now >= parsed.sessionExpiresAt) {
          console.warn("Doctor/Admin session expired at midnight. Requiring login.");
          return {
            ...initialState,
            language: parsed.language || initialState.language,
            isAyushMode: parsed.isAyushMode || false,
          };
        }
      }
      return { ...initialState, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load session from localStorage", e);
  }
  return initialState;
};

function sessionReducer(state, action) {
  switch (action.type) {
    case 'SET_AUTH': {
      const isAuth = action.payload.isAuthenticated;
      const role = action.payload.role;
      let expiresAt = null;
      // Doctor and Admin sessions automatically expire at midnight (12:00 AM)
      if (isAuth && (role === 'doctor' || role === 'admin')) {
        expiresAt = action.payload.expiresAt || getNextMidnightTimestamp();
      }
      return {
        ...state,
        isAuthenticated: isAuth,
        userRole: role,
        sessionExpiresAt: expiresAt,
        loginTimestamp: isAuth ? (action.payload.loginTimestamp || Date.now()) : null,
      };
    }

    case 'LOGIN_PATIENT': {
      return {
        ...state,
        isAuthenticated: true,
        userRole: 'patient',
        sessionExpiresAt: null,
        loginTimestamp: Date.now(),
        patient: { ...state.patient, ...action.payload },
        sessionStartTime: state.sessionStartTime || Date.now(),
      };
    }

    case 'LOGIN_STAFF': {
      const staff = action.payload;
      return {
        ...state,
        isAuthenticated: true,
        userRole: staff.role,
        sessionExpiresAt: getNextMidnightTimestamp(),
        loginTimestamp: Date.now(),
        staff: staff,
      };
    }

    case 'SET_PATIENT':
      return {
        ...state,
        patient: { ...state.patient, ...action.payload },
        sessionStartTime: state.sessionStartTime || Date.now(),
      };

    case 'SET_STAFF':
      return { ...state, staff: action.payload };

    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };

    case 'SET_AYUSH_MODE':
      return { ...state, isAyushMode: action.payload };

    case 'SET_CONSENT':
      return {
        ...state,
        consents: { ...state.consents, [action.payload.key]: action.payload.value },
      };

    case 'SET_ALL_CONSENTS':
      return {
        ...state,
        consents: {
          voice: action.payload,
          document: action.payload,
          abha: action.payload,
          share: action.payload,
        },
      };

    case 'SET_CHIEF_COMPLAINT':
      return {
        ...state,
        history: { ...state.history, chiefComplaint: action.payload.complaint, bodySystem: action.payload.bodySystem },
      };

    case 'ADD_HPI_RESPONSE':
      return {
        ...state,
        history: {
          ...state.history,
          hpiResponses: [...state.history.hpiResponses, action.payload],
        },
      };

    case 'SET_PAST_MEDICAL':
      return {
        ...state,
        history: { ...state.history, pastMedical: action.payload },
      };

    case 'ADD_PAST_MEDICAL':
      return {
        ...state,
        history: {
          ...state.history,
          pastMedical: [...state.history.pastMedical, action.payload],
        },
      };

    case 'SET_PAST_SURGICAL':
      return {
        ...state,
        history: { ...state.history, pastSurgical: action.payload },
      };

    case 'ADD_MEDICATION':
      return {
        ...state,
        history: {
          ...state.history,
          medications: [...state.history.medications, action.payload],
        },
      };

    case 'SET_MEDICATIONS':
      return {
        ...state,
        history: { ...state.history, medications: action.payload },
      };

    case 'ADD_ALLERGY':
      return {
        ...state,
        history: {
          ...state.history,
          allergies: [...state.history.allergies, action.payload],
        },
      };

    case 'SET_FAMILY_HISTORY':
      return {
        ...state,
        history: { ...state.history, familyHistory: action.payload },
      };

    case 'SET_PERSONAL_HISTORY':
      return {
        ...state,
        history: { ...state.history, personalHistory: { ...state.history.personalHistory, ...action.payload } },
      };

    case 'SET_REVIEW_OF_SYSTEMS':
      return {
        ...state,
        history: {
          ...state.history,
          reviewOfSystems: { ...state.history.reviewOfSystems, ...action.payload },
        },
      };

    case 'SET_AYUSH_ASSESSMENT':
      return {
        ...state,
        history: { ...state.history, ayushAssessment: action.payload },
      };

    case 'SET_INTERVIEW_PROGRESS':
      return {
        ...state,
        interviewProgress: { ...state.interviewProgress, ...action.payload },
      };

    case 'COMPLETE_SECTION': {
      const completed = [...state.interviewProgress.completedSections];
      if (!completed.includes(action.payload)) {
        completed.push(action.payload);
      }
      return {
        ...state,
        interviewProgress: {
          ...state.interviewProgress,
          completedSections: completed,
          completionPercentage: Math.round((completed.length / state.interviewProgress.totalSections) * 100),
        },
      };
    }

    case 'ADD_DOCUMENT':
      return {
        ...state,
        documents: [...state.documents, {
          ...action.payload,
          id: action.payload.id || Date.now().toString(),
          timestamp: action.payload.timestamp || new Date().toISOString(),
        }],
      };

    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(d => d.id === action.payload.id ? { ...d, ...action.payload.data } : d),
      };

    case 'REMOVE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter(d => d.id !== action.payload),
      };

    case 'SET_SUMMARY':
      return { ...state, summary: action.payload };

    case 'ADD_RED_FLAG':
      return {
        ...state,
        redFlags: [...state.redFlags, action.payload],
      };

    case 'CLEAR_RED_FLAGS':
      return { ...state, redFlags: [] };

    case 'SET_TOKEN':
      return { ...state, tokenNumber: action.payload };

    case 'SET_SUBMITTED':
      return { ...state, isSubmitted: true };

    case 'SET_INTAKE_ID':
      return { ...state, intakeId: action.payload };

    case 'RESET_SESSION':
      return { ...initialState };

    default:
      return state;
  }
}

export function SessionProvider({ children }) {
  const [session, dispatch] = useReducer(sessionReducer, initialState, getInitialState);

  const logout = useCallback(() => {
    try {
      if (session.staff && ['doctor', 'admin', 'nurse'].includes(session.userRole)) {
        void db.staff.recordLogout(session.staff).catch(error => {
          console.warn('Could not close staff activity session during logout:', error);
        });
      }
      localStorage.removeItem('swasthya_session');
    } catch (e) {}
    dispatch({ type: 'RESET_SESSION' });
  }, [session.userRole, session.staff]);

  // Save session state to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('swasthya_session', JSON.stringify({
        isAuthenticated: session.isAuthenticated,
        userRole: session.userRole,
        sessionExpiresAt: session.sessionExpiresAt,
        loginTimestamp: session.loginTimestamp,
        patient: session.patient,
        staff: session.staff,
        isAyushMode: session.isAyushMode,
        tokenNumber: session.tokenNumber,
        isSubmitted: session.isSubmitted
        ,intakeId: session.intakeId
      }));
    } catch (e) {
      console.error("Failed to save session", e);
    }
  }, [session]);

  // Persist the complete intake as it evolves. A short debounce avoids one
  // network request per keystroke while ensuring navigation never loses data.
  React.useEffect(() => {
    if (!session.patient?.id || session.userRole !== 'patient') return;
    const timer = setTimeout(async () => {
      const { data, error } = await db.intakes.save({
        id: session.intakeId,
        patientId: session.patient.id,
        language: session.language,
        isAyushMode: session.isAyushMode,
        consents: session.consents,
        history: session.history,
        interviewProgress: session.interviewProgress,
        documents: session.documents.map(({ imageData, ...document }) => document),
        summary: session.summary,
        redFlags: session.redFlags,
        submitted: session.isSubmitted,
      });
      if (error) console.error('Failed to persist clinical intake', error);
      else if (!session.intakeId && data?.id) dispatch({ type: 'SET_INTAKE_ID', payload: data.id });
    }, 650);
    return () => clearTimeout(timer);
  }, [session]);

  // Real-time watchdog: Auto-logout Doctor & Admin at midnight (12:00 AM)
  React.useEffect(() => {
    if (!session.isAuthenticated || (session.userRole !== 'doctor' && session.userRole !== 'admin')) {
      return;
    }

    const checkMidnightExpiry = () => {
      if (session.sessionExpiresAt && Date.now() >= session.sessionExpiresAt) {
        console.warn("Doctor/Admin 24h midnight session expired. Logging out automatically.");
        logout();
      }
    };

    // Immediate check
    checkMidnightExpiry();

    // Check periodically every 5 seconds
    const interval = setInterval(checkMidnightExpiry, 5000);

    // Also check when tab regains focus or visibility
    window.addEventListener('focus', checkMidnightExpiry);
    document.addEventListener('visibilitychange', checkMidnightExpiry);

    // Set precise timer for exact midnight transition
    const msUntilExpiry = session.sessionExpiresAt ? Math.max(0, session.sessionExpiresAt - Date.now()) : 0;
    let timer;
    if (msUntilExpiry > 0 && msUntilExpiry < 2147483647) {
      timer = setTimeout(checkMidnightExpiry, msUntilExpiry);
    }

    return () => {
      clearInterval(interval);
      if (timer) clearTimeout(timer);
      window.removeEventListener('focus', checkMidnightExpiry);
      document.removeEventListener('visibilitychange', checkMidnightExpiry);
    };
  }, [session.isAuthenticated, session.userRole, session.sessionExpiresAt, logout]);

  // Convenience dispatchers
  const setAuth = useCallback((isAuthenticated, role) => dispatch({ type: 'SET_AUTH', payload: { isAuthenticated, role } }), []);
  const setPatient = useCallback((data) => dispatch({ type: 'SET_PATIENT', payload: data }), []);
  const setStaff = useCallback((data) => dispatch({ type: 'SET_STAFF', payload: data }), []);
  const setLanguage = useCallback((lang) => dispatch({ type: 'SET_LANGUAGE', payload: lang }), []);
  const setAyushMode = useCallback((val) => dispatch({ type: 'SET_AYUSH_MODE', payload: val }), []);
  const setConsent = useCallback((key, value) => dispatch({ type: 'SET_CONSENT', payload: { key, value } }), []);
  const setAllConsents = useCallback((val) => dispatch({ type: 'SET_ALL_CONSENTS', payload: val }), []);
  const setChiefComplaint = useCallback((complaint, bodySystem) => dispatch({ type: 'SET_CHIEF_COMPLAINT', payload: { complaint, bodySystem } }), []);
  const addHPIResponse = useCallback((response) => dispatch({ type: 'ADD_HPI_RESPONSE', payload: response }), []);
  const addPastMedical = useCallback((item) => dispatch({ type: 'ADD_PAST_MEDICAL', payload: item }), []);
  const addMedication = useCallback((med) => dispatch({ type: 'ADD_MEDICATION', payload: med }), []);
  const addAllergy = useCallback((allergy) => dispatch({ type: 'ADD_ALLERGY', payload: allergy }), []);
  const setFamilyHistory = useCallback((data) => dispatch({ type: 'SET_FAMILY_HISTORY', payload: data }), []);
  const setPersonalHistory = useCallback((data) => dispatch({ type: 'SET_PERSONAL_HISTORY', payload: data }), []);
  const setReviewOfSystems = useCallback((data) => dispatch({ type: 'SET_REVIEW_OF_SYSTEMS', payload: data }), []);
  const setAyushAssessment = useCallback((data) => dispatch({ type: 'SET_AYUSH_ASSESSMENT', payload: data }), []);
  const setInterviewProgress = useCallback((data) => dispatch({ type: 'SET_INTERVIEW_PROGRESS', payload: data }), []);
  const completeSection = useCallback((section) => dispatch({ type: 'COMPLETE_SECTION', payload: section }), []);
  const addDocument = useCallback((doc) => dispatch({ type: 'ADD_DOCUMENT', payload: doc }), []);
  const updateDocument = useCallback((id, data) => dispatch({ type: 'UPDATE_DOCUMENT', payload: { id, data } }), []);
  const removeDocument = useCallback((id) => dispatch({ type: 'REMOVE_DOCUMENT', payload: id }), []);
  const setSummary = useCallback((summary) => dispatch({ type: 'SET_SUMMARY', payload: summary }), []);
  const addRedFlag = useCallback((flag) => dispatch({ type: 'ADD_RED_FLAG', payload: flag }), []);
  const setToken = useCallback((token) => dispatch({ type: 'SET_TOKEN', payload: token }), []);
  const setSubmitted = useCallback(() => dispatch({ type: 'SET_SUBMITTED' }), []);
  const resetSession = useCallback(() => dispatch({ type: 'RESET_SESSION' }), []);

  const loginPatient = useCallback((patientData) => {
    dispatch({ type: 'LOGIN_PATIENT', payload: patientData });
    try {
      const current = JSON.parse(localStorage.getItem('swasthya_session') || '{}');
      localStorage.setItem('swasthya_session', JSON.stringify({
        ...current,
        isAuthenticated: true,
        userRole: 'patient',
        sessionExpiresAt: null,
        loginTimestamp: Date.now(),
        patient: { ...(current.patient || {}), ...patientData },
      }));
    } catch (e) {}
  }, []);

  const loginStaff = useCallback((staffData) => {
    dispatch({ type: 'LOGIN_STAFF', payload: staffData });
    try {
      const current = JSON.parse(localStorage.getItem('swasthya_session') || '{}');
      localStorage.setItem('swasthya_session', JSON.stringify({
        ...current,
        isAuthenticated: true,
        userRole: staffData.role,
        sessionExpiresAt: getNextMidnightTimestamp(),
        loginTimestamp: Date.now(),
        staff: staffData,
      }));
    } catch (e) {}
  }, []);

  const value = {
    session,
    dispatch,
    logout,
    loginPatient, loginStaff,
    setAuth, setPatient, setStaff, setLanguage, setAyushMode, setConsent, setAllConsents,
    setChiefComplaint, addHPIResponse, addPastMedical, addMedication,
    addAllergy, setFamilyHistory, setPersonalHistory, setReviewOfSystems,
    setAyushAssessment, setInterviewProgress, completeSection,
    addDocument, updateDocument, removeDocument,
    setSummary, addRedFlag, setToken, setSubmitted, resetSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export default SessionContext;
