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

const VoiceNavContext = createContext(null);

// Check if Web Speech API is available
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechSupported = !!SpeechRecognition;

export function VoiceNavProvider({ children }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micState, setMicState] = useState('idle'); // idle | listening | speaking | processing
  const [language, setLanguageState] = useState('en');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [lastCommand, setLastCommand] = useState(null);

  const recognitionRef = useRef(null);
  const commandHandlersRef = useRef({});
  const currentPageRef = useRef(null);
  const isListeningRef = useRef(false);
  const onTranscriptCallbackRef = useRef(null);
  const languageRef = useRef('en');
  const isDictationModeRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');

  useEffect(() => {
    languageRef.current = language;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = getLanguageInfo(language).speechCode;
      } catch (e) {}
    }
  }, [language]);

  // Initialize speech recognition with continuous listening & adaptive silence debounce
  useEffect(() => {
    if (!isSpeechSupported) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      let interim = '';
      let newFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinal += text;
        } else {
          interim += text;
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

      silenceTimerRef.current = setTimeout(() => {
        const full = (accumulatedTranscriptRef.current + (interim ? ' ' + interim : '')).trim();
        if (full && isListeningRef.current) {
          setTranscript(full);
          setInterimTranscript('');
          accumulatedTranscriptRef.current = '';
          handleVoiceInput(full);
          if (!isDictationModeRef.current) {
            stopListening();
          }
        }
      }, newFinal ? 2200 : 3800);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // Keep listening smoothly without abrupt cancellation
        return;
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
  const handleVoiceInput = useCallback(async (text) => {
    setMicState('processing');

    // ── DICTATION MODE: Skip ALL command parsing ──
    // When VoiceInput is actively dictating into a form field,
    // raw text goes straight to the callback without AI classification.
    if (isDictationModeRef.current && onTranscriptCallbackRef.current) {
      onTranscriptCallbackRef.current(text, { intent: 'free_text', confidence: 1, raw: text, value: text });
      audioFeedback.playSuccess();
      audioPromptManager.resetIdleTimer();
      setTimeout(() => setMicState('idle'), 500);
      return;
    }

    // Discover visible semantic controls so newly-added pages work without a
    // hand-maintained phrase list. AI may choose only from these safe actions.
    const domElements = Array.from(document.querySelectorAll('button, a[href], [role="button"], input[type="submit"]'))
      .filter(element => !element.disabled && element.getAttribute('aria-hidden') !== 'true' && element.getClientRects().length)
      .slice(0, 60);
    const domActions = domElements.map((element, index) => ({
      intent: `activate_${index}`,
      description: element.getAttribute('aria-label') || element.getAttribute('title') || element.innerText?.trim() || element.value || `control ${index + 1}`,
    })).filter(action => action.description);
    const pageHandlers = commandHandlersRef.current[currentPageRef.current] || {};
    const handlerActions = Object.keys(pageHandlers).map(intent => ({ intent, description: intent.replace(/_/g, ' ') }));
    const globalActions = Object.keys(commandHandlersRef.current.__global__ || {}).map(intent => ({ intent, description: intent.replace(/_/g, ' ') }));
    const result = await commandParser.parse(text, currentPageRef.current, {
      actions: [...handlerActions, ...globalActions, ...domActions],
      expectsFreeText: Boolean(onTranscriptCallbackRef.current),
    });
    setLastCommand(result);

    // If it's a recognized command, dispatch it
    let handled = false;
    if (result.intent && result.intent !== 'free_text' && result.intent !== 'out_of_context') {
      // Check page-level handlers first
      const aliases = {
        book_appointment: 'bookAppointment', login_doctor: 'loginDoctor',
        login_admin: 'loginAdmin', login_patient: 'loginPatient',
        scan_document: 'scanDocument', select_language: 'selectLanguage',
        read_summary: 'readSummary',
      };
      const resolvedIntent = aliases[result.intent] || result.intent;
      if (pageHandlers && (pageHandlers[result.intent] || pageHandlers[resolvedIntent])) {
        (pageHandlers[result.intent] || pageHandlers[resolvedIntent])(result);
        handled = true;
      }
      // Check global handlers
      else if (commandHandlersRef.current['__global__'] && (commandHandlersRef.current['__global__'][result.intent] || commandHandlersRef.current['__global__'][resolvedIntent])) {
        (commandHandlersRef.current['__global__'][result.intent] || commandHandlersRef.current['__global__'][resolvedIntent])(result);
        handled = true;
      }

      if (!handled && /^activate_\d+$/.test(result.intent)) {
        const element = domElements[Number(result.intent.slice(9))];
        if (element) { element.click(); handled = true; }
      }
      
      // Built-in handlers for common actions that work on every page
      if (!handled) {
        switch (result.intent) {
          case 'scrollUp':
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
        }
      }

      if (handled) {
        audioFeedback.playSuccess();
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

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    accumulatedTranscriptRef.current = '';

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
      // If currently speaking, clicking the orb should just stop the speech
      audioFeedback.stop();
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
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = getLanguageInfo(lang).speechCode;
      } catch (e) {}
    }
  }, []);

  // Register page with its voice commands and handlers
  const registerPage = useCallback((pageId, handlers) => {
    currentPageRef.current = pageId;
    commandHandlersRef.current[pageId] = handlers;
    commandParser.registerPageCommands(pageId, Object.fromEntries(
      Object.keys(handlers || {}).map(intent => [intent, [intent.replace(/_/g, ' ')]])
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
  const registerGlobalHandlers = useCallback((handlers) => {
    commandHandlersRef.current['__global__'] = handlers;
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
