/* ============================================
   SWASTHYA SETU — VoiceNav Provider
   Global voice navigation context wrapping entire app
   Handles: speech recognition, command dispatch, 
   audio feedback, and page-level command registration
   ============================================ */

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import commandParser from './CommandParser';
import audioFeedback from './AudioFeedback';
import audioPromptManager from './AudioPromptManager';
import { getLanguageInfo } from './LanguagePack';
import { db } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';

const VoiceNavContext = createContext(null);

// Check if Web Speech API is available
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechSupported = !!SpeechRecognition;

export function VoiceNavProvider({ children }) {
  const languageContext = useLanguage();
  const currentLang = languageContext?.currentLang || 'en';
  const setCurrentLang = languageContext?.setCurrentLang;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micState, setMicState] = useState('idle'); // idle | listening | speaking | processing
  const [voiceError, setVoiceError] = useState('');
  const [language, setLanguageState] = useState(currentLang);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [lastCommand, setLastCommand] = useState(null);

  const recognitionRef = useRef(null);
  const commandHandlersRef = useRef({});
  const currentPageRef = useRef(null);
  const isListeningRef = useRef(false);
  const onTranscriptCallbackRef = useRef(null);
  const languageRef = useRef(currentLang);
  const isDictationModeRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');
  const recognitionAlternativesRef = useRef(['', '', '']);

  // Synchronize language and speech recognition engine whenever currentLang changes
  useEffect(() => {
    setLanguageState(currentLang);
    languageRef.current = currentLang;
    commandParser.setLanguage(currentLang);
    audioPromptManager.setLanguage(currentLang);
    if (recognitionRef.current) {
      try {
        const langInfo = getLanguageInfo(currentLang);
        recognitionRef.current.lang = langInfo.speechCode;
      } catch (e) {}
    }
  }, [currentLang]);

  // Initialize speech recognition with continuous listening & adaptive silence debounce
  useEffect(() => {
    if (!isSpeechSupported) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      let interim = '';
      const interimAlternatives = ['', '', ''];
      let newFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          newFinal += ` ${text}`;
          for (let alternativeIndex = 0; alternativeIndex < 3; alternativeIndex++) {
            const alternativeText = result[alternativeIndex]?.transcript || text;
            recognitionAlternativesRef.current[alternativeIndex] =
              `${recognitionAlternativesRef.current[alternativeIndex]} ${alternativeText}`.trim();
          }
        } else {
          interim += ` ${text}`;
          for (let alternativeIndex = 0; alternativeIndex < 3; alternativeIndex++) {
            interimAlternatives[alternativeIndex] += ` ${result[alternativeIndex]?.transcript || text}`;
          }
        }
      }

      if (newFinal) {
        accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + ' ' + newFinal).trim();
      }

      // Update live visual transcript indicator
      const display = (accumulatedTranscriptRef.current + (interim ? ' ' + interim : '')).trim();
      if (display) {
        setInterimTranscript(display);
      }

      // Reset adaptive silence timer: generous pause for natural human breathing/thinking pauses
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Ultra-responsive silence pause for instant voice navigation
      const finalPauseMs = isDictationModeRef.current ? 1400 : 450;
      const interimPauseMs = isDictationModeRef.current ? 2200 : 800;
      silenceTimerRef.current = setTimeout(() => {
        const full = (accumulatedTranscriptRef.current + (interim ? ' ' + interim : '')).trim();
        if (full && isListeningRef.current) {
          const recognitionAlternatives = recognitionAlternativesRef.current
            .map((finalText, index) => `${finalText} ${interimAlternatives[index] || ''}`.trim())
            .filter((candidate, index, all) => candidate && candidate !== full && all.indexOf(candidate) === index);
          setTranscript(full);
          setInterimTranscript('');
          accumulatedTranscriptRef.current = '';
          recognitionAlternativesRef.current = ['', '', ''];
          handleVoiceInput(full, recognitionAlternatives);
          if (!isDictationModeRef.current) {
            stopListening();
          }
        }
      }, newFinal ? finalPauseMs : interimPauseMs);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // Keep listening smoothly without abrupt cancellation
        return;
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceError('Microphone access is blocked. Allow microphone access for localhost in Chrome, then tap the microphone again.');
        setIsListening(false);
        isListeningRef.current = false;
        setMicState('idle');
        return;
      }
      if (event.error === 'audio-capture') {
        setVoiceError('No working microphone was found. Check the microphone connection and Windows input settings.');
        setIsListening(false);
        isListeningRef.current = false;
        setMicState('idle');
        return;
      }
      if (event.error === 'network') {
        setVoiceError('Speech recognition could not connect. Check the internet connection and try again.');
      }
      if (event.error !== 'aborted') {
        console.warn('Speech recognition status:', event.error);
      }
      if (isListeningRef.current) {
        // Retry restarting recognition seamlessly
        try {
          recognitionRef.current?.start();
          return;
        } catch (e) {}
      }
      setIsListening(false);
      isListeningRef.current = false;
      setMicState('idle');
    };

    recognition.onend = () => {
      // Auto-restart if user is still in listening mode (continuous YouTube-style recognition)
      if (isListeningRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          return;
        } catch (e) {
          setTimeout(() => {
            if (isListeningRef.current && recognitionRef.current) {
              try { recognitionRef.current.start(); } catch (err) {}
            }
          }, 80);
          return;
        }
      }
      setIsListening(false);
      isListeningRef.current = false;
      setMicState('idle');
    };

    recognitionRef.current = recognition;

    // Listen for speaking state changes from audio feedback
    audioFeedback.onSpeakingChange = (speaking) => {
      setIsSpeaking(speaking);
      if (speaking) {
        setMicState('speaking');
      } else if (!isListeningRef.current) {
        setMicState('idle');
      }
    };

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
      }
    };
  }, []);

  // Handle voice input — parse and dispatch
  const handleVoiceInput = useCallback(async (text, recognitionAlternatives = []) => {
    setMicState('processing');

    // ── DICTATION MODE: Skip ALL command parsing ──
    // When VoiceInput is actively dictating into a form field,
    // raw text goes straight to the callback without AI classification.
    if (isDictationModeRef.current && onTranscriptCallbackRef.current) {
      onTranscriptCallbackRef.current(text, {
        intent: 'free_text', confidence: 1, raw: text, value: text, recognitionAlternatives,
      });
      audioFeedback.playSuccess();
      audioPromptManager.resetIdleTimer();
      setTimeout(() => setMicState('idle'), 500);
      return;
    }

    // Discover visible semantic controls so newly-added pages work without a
    // hand-maintained phrase list. AI may choose only from these safe actions.
    const seenControlLabels = new Set();
    const domElements = Array.from(document.querySelectorAll('button, a[href], [role="button"], input[type="submit"]'))
      .filter(element => !element.disabled && element.getAttribute('aria-hidden') !== 'true' && element.getClientRects().length)
      .filter(element => {
        const label = (element.getAttribute('aria-label') || element.getAttribute('title') || element.innerText || element.value || '')
          .trim().replace(/\s+/g, ' ').toLocaleLowerCase();
        if (!label || seenControlLabels.has(label)) return false;
        seenControlLabels.add(label);
        return true;
      })
      .slice(0, 40);
    const domActions = domElements.map((element, index) => ({
      intent: `activate_${index}`,
      description: String(element.getAttribute('aria-label') || element.getAttribute('title') || element.innerText?.trim() || element.value || `control ${index + 1}`).slice(0, 120),
    })).filter(action => action.description);
    const pageHandlers = commandHandlersRef.current[currentPageRef.current] || {};
    const handlerActions = Object.keys(pageHandlers).map(intent => ({ intent, description: intent.replace(/_/g, ' ') }));
    const globalActions = Object.keys(commandHandlersRef.current.__global__ || {}).map(intent => ({ intent, description: intent.replace(/_/g, ' ') }));
    const result = await commandParser.parse(text, currentPageRef.current, {
      actions: [...handlerActions, ...globalActions, ...domActions],
      expectsFreeText: Boolean(onTranscriptCallbackRef.current),
      recognitionAlternatives,
    });
    setLastCommand(result);

    // If it's a recognized command, dispatch it
    let handled = false;
    if (result.intent && result.intent !== 'free_text' && result.intent !== 'out_of_context') {
      // Normalized intent aliases — covers both snake_case and camelCase variants
      const aliases = {
        book_appointment:  'bookAppointment',
        login_doctor:      'loginDoctor',
        login_admin:       'loginAdmin',
        login_patient:     'loginPatient',
        scan_document:     'scanDocument',
        select_language:   'selectLanguage',
        read_summary:      'readSummary',
        view_appointments: 'viewAppointments',
        view_history:      'viewHistory',
        view_reports:      'viewReports',
        view_donations:    'viewDonations',
        view_communities:  'viewCommunities',
        view_help:         'viewHelp',
        view_profile:      'viewProfile',
        show_abha_card:    'showAbhaCard',
        toggle_ayush:      'toggleAyush',
        search_hospital:   'searchHospital',
        start_consultation:'startConsultation',
        select_doctor:     'select_doctor',
        select_hospital:   'select_hospital',
        confirm_booking:   'confirm',
        confirmBooking:    'confirm',
        book_now:          'confirm',
        go_next:           'next',
        go_back:           'back',
        previous:          'back',
      };
      const resolvedIntent = aliases[result.intent] || result.intent;

      // 1. Page-level handlers (highest priority)
      if (pageHandlers && (pageHandlers[result.intent] || pageHandlers[resolvedIntent])) {
        (pageHandlers[result.intent] || pageHandlers[resolvedIntent])(result);
        handled = true;
      }
      // 2. Global handlers
      else if (commandHandlersRef.current['__global__'] && (commandHandlersRef.current['__global__'][result.intent] || commandHandlersRef.current['__global__'][resolvedIntent])) {
        (commandHandlersRef.current['__global__'][result.intent] || commandHandlersRef.current['__global__'][resolvedIntent])(result);
        handled = true;
      }

      // 3. AI DOM activation with SMART text-label matching (not just index)
      if (!handled && /^activate_\d+$/.test(result.intent)) {
        const idx = Number(result.intent.slice(9));
        const target = domElements[idx];
        if (target) { target.click(); handled = true; }
      }

      // 4. Semantic DOM label search — try to find a visible button matching the raw transcript
      if (!handled && result.intent === 'activate_label') {
        const label = (result.value || text || '').toLowerCase();
        const matchedEl = domElements.find(el => {
          const elText = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();
          return elText.includes(label) || label.includes(elText.slice(0, 10));
        });
        if (matchedEl) { matchedEl.click(); handled = true; }
      }
      
      // 5. Built-in handlers for common actions that work on every page
      if (!handled) {
        switch (result.intent) {
          case 'selectOption': {
            const options = Array.from(document.querySelectorAll('[data-voice-option]'))
              .filter(element => !element.disabled && element.getClientRects().length);
            const option = options[Number(result.value)];
            if (option) { option.click(); handled = true; }
            break;
          }
          case 'next':
          case 'back':
          case 'confirm':
          case 'skip': {
            const action = document.querySelector(`[data-voice-action="${result.intent}"]`);
            if (action && action.getClientRects().length && !action.disabled) { action.click(); handled = true; }
            break;
          }
          case 'scrollUp':
            window.scrollBy({ top: -(window.innerHeight * 0.8), behavior: 'smooth' });
            handled = true;
            break;
          case 'scrollDown':
            window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
            handled = true;
            break;
          case 'home':
            window.scrollTo({ top: 0, behavior: 'smooth' });
            handled = true;
            break;
          case 'navigate_to':
          case 'navigate': {
            // Let global handler take it — if we're here, it wasn't registered, navigate via commandParser routes
            const routeTarget = result.value || result.target;
            if (routeTarget && commandParser.routes?.length) {
              const route = commandParser.routes.find(r => r.id === routeTarget);
              if (route) { window.location.href = route.path; handled = true; }
            }
            break;
          }
        }
      }


      if (handled) {
        audioFeedback.playSuccess();
        if (result.message) {
          // Speak AI-generated localized confirmation in user's spoken language
          audioFeedback.speak(result.message, languageRef.current);
        }
      } else if (!onTranscriptCallbackRef.current) {
        // Not handled, and page is NOT expecting free text (e.g., Landing Page)
        audioFeedback.playError();
        if (result.message) {
          // Speak AI-generated localized message
          audioFeedback.speak(result.message, languageRef.current);
        } else {
          // Fallback if AI didn't provide a message
          const fallbackText = getLanguageInfo(languageRef.current).strings?.voiceNotUnderstood || "I didn't understand that.";
          audioFeedback.speak(fallbackText, languageRef.current);
        }
      }
    } else if (result.intent === 'out_of_context' && !onTranscriptCallbackRef.current) {
      // Explicitly marked as out of context by AI, and page is NOT expecting free text
      audioFeedback.playError();
      if (result.message) {
        audioFeedback.speak(result.message, languageRef.current);
      } else {
        const fallbackText = getLanguageInfo(languageRef.current).strings?.voiceNotUnderstood || "I didn't understand that.";
        audioFeedback.speak(fallbackText, languageRef.current);
      }
    }

    // If there's a transcript callback (e.g., for free-form interview input), call it
    // IMPORTANT: Only call it if the voice input was NOT handled as a system/navigation command
    if (onTranscriptCallbackRef.current && !handled) {
      onTranscriptCallbackRef.current(text, result);
    }

    // Reset idle timer
    audioPromptManager.resetIdleTimer();
    db.voice.log({
      page_id: currentPageRef.current,
      language: languageRef.current,
      intent: result.intent || 'unknown',
      confidence: Number(result.confidence || 0),
      handled,
    }).catch(() => {});

    setTimeout(() => setMicState('idle'), 500);
  }, []);

  // Start listening
  const startListening = useCallback((continuous = true) => {
    if (!isSpeechSupported || !recognitionRef.current || !isVoiceEnabled) return;

    // Stop any current speech
    audioFeedback.stop();
    setVoiceError('');
    setTranscript('');
    setInterimTranscript('');

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    accumulatedTranscriptRef.current = '';
    recognitionAlternativesRef.current = ['', '', ''];

    try {
      const langInfo = getLanguageInfo(languageRef.current);
      recognitionRef.current.lang = langInfo.speechCode;
      recognitionRef.current.continuous = true;
      recognitionRef.current.start();
      setIsListening(true);
      isListeningRef.current = true;
      setMicState('listening');
      setInterimTranscript('');
      audioFeedback.playListeningStart();
    } catch (e) {
      // Already started or other error
      console.warn('Could not start recognition:', e);
      setIsListening(true);
      isListeningRef.current = true;
      setMicState('listening');
    }
  }, [isVoiceEnabled]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    }
    setIsListening(false);
    isListeningRef.current = false;
    setMicState('idle');
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isSpeaking) {
      // A microphone click always means "listen". Stop page narration first,
      // then start recognition from the same user gesture.
      audioFeedback.stop();
      startListening(true);
    } else if (isListening) {
      const pending = accumulatedTranscriptRef.current.trim();
      stopListening();
      if (pending) {
        handleVoiceInput(pending);
        accumulatedTranscriptRef.current = '';
      }
    } else {
      startListening(true);
    }
  }, [isListening, isSpeaking, startListening, stopListening, handleVoiceInput]);

  // Speak text
  const speak = useCallback(async (text, lang = null) => {
    // Stop listening while speaking
    if (isListeningRef.current) {
      stopListening();
    }
    await audioFeedback.speak(text, lang || languageRef.current);
  }, [stopListening]);

  // Set language
  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    languageRef.current = lang;
    commandParser.setLanguage(lang);
    audioPromptManager.setLanguage(lang);
    if (setCurrentLang) setCurrentLang(lang);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = getLanguageInfo(lang).speechCode;
      } catch (e) {}
    }
  }, [setCurrentLang]);

  // Register page with its voice commands and handlers
  const registerPage = useCallback((pageId, handlers, commands = {}) => {
    currentPageRef.current = pageId;
    commandParser.setCurrentPage(pageId);
    commandHandlersRef.current[pageId] = handlers;
    commandParser.registerPageCommands(pageId, Object.fromEntries(
      Object.keys(handlers || {}).map(intent => [intent, commands[intent] || [intent.replace(/_/g, ' ')]] )
    ));
  }, []);

  // Unregister page
  const unregisterPage = useCallback((pageId) => {
    delete commandHandlersRef.current[pageId];
    commandParser.unregisterPageCommands(pageId);
    if (currentPageRef.current === pageId) {
      currentPageRef.current = null;
    }
  }, []);

  // Register global handlers
  const registerGlobalHandlers = useCallback((handlers, descriptions = {}) => {
    commandHandlersRef.current['__global__'] = handlers;
    commandParser.registerPageCommands('__global__', Object.fromEntries(
      Object.keys(handlers || {}).map(intent => [intent, descriptions[intent] || [intent.replace(/_/g, ' ')]])
    ));
  }, []);

  // Set callback for free-text transcript (used by interview page)
  const setOnTranscript = useCallback((callback) => {
    onTranscriptCallbackRef.current = callback;
  }, []);

  // Clear transcript callback
  const clearOnTranscript = useCallback(() => {
    onTranscriptCallbackRef.current = null;
  }, []);

  // Dictation mode: bypass command parser entirely for form field input
  const setDictationMode = useCallback((enabled) => {
    isDictationModeRef.current = enabled;
  }, []);

  const value = {
    // State
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    micState,
    voiceError,
    language,
    isVoiceEnabled,
    isSpeechSupported,
    lastCommand,

    // Actions
    startListening,
    stopListening,
    toggleListening,
    speak,
    setLanguage,
    setIsVoiceEnabled,

    // Page registration
    registerPage,
    unregisterPage,
    registerGlobalHandlers,

    // Transcript callback
    setOnTranscript,
    clearOnTranscript,
    setDictationMode,

    // Direct access to engines
    audioFeedback,
    audioPromptManager,
    commandParser,
  };

  return (
    <VoiceNavContext.Provider value={value}>
      {children}
    </VoiceNavContext.Provider>
  );
}

export function useVoiceNav() {
  const context = useContext(VoiceNavContext);
  if (!context) {
    return {
      isListening: false,
      isSpeaking: false,
      transcript: '',
      interimTranscript: '',
      micState: 'idle',
      voiceError: '',
      language: 'en',
      isVoiceEnabled: true,
      startListening: () => {},
      stopListening: () => {},
      toggleListening: () => {},
      speak: async () => {},
      registerPage: () => {},
      unregisterPage: () => {},
      registerGlobalHandlers: () => {},
      setLanguage: () => {},
      setOnTranscript: () => {},
      clearOnTranscript: () => {},
      setDictationMode: () => {},
      audioFeedback,
      audioPromptManager,
      commandParser
    };
  }
  return context;
}

export default VoiceNavContext;
