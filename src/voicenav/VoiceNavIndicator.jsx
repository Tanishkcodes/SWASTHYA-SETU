/* ============================================
   SWASTHYA SETU — VoiceNav Floating Indicator
   Always-visible microphone orb with state animations
   ============================================ */

import React from 'react';
import { useVoiceNav } from './VoiceNavProvider';
import { t } from './LanguagePack';
import '../styles/voicenav.css';

export default function VoiceNavIndicator() {
  const {
    micState,
    isListening,
    isSpeaking,
    interimTranscript,
    transcript,
    voiceError,
    recognitionFeedback,
    toggleListening,
    isVoiceEnabled,
    isSpeechSupported,
    language,
  } = useVoiceNav();

  if (!isVoiceEnabled) return null;

  const stateConfig = {
    idle: {
      className: 'voicenav-orb--idle',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      ),
      label: isSpeechSupported ? t(language, 'speakOrTap') : 'Voice not supported',
    },
    listening: {
      className: 'voicenav-orb--listening',
      icon: (
        <div className="voicenav-waves">
          <span className="voicenav-wave voicenav-wave--1"></span>
          <span className="voicenav-wave voicenav-wave--2"></span>
          <span className="voicenav-wave voicenav-wave--3"></span>
          <span className="voicenav-wave voicenav-wave--4"></span>
          <span className="voicenav-wave voicenav-wave--5"></span>
        </div>
      ),
      label: t(language, 'listening'),
    },
    speaking: {
      className: 'voicenav-orb--speaking',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      ),
      label: '...',
    },
    processing: {
      className: 'voicenav-orb--processing',
      icon: (
        <div className="voicenav-spinner">
          <span></span><span></span><span></span>
        </div>
      ),
      label: t(language, 'processing'),
    },
  };

  const connectingText = {
    en: 'Connecting microphone…', hi: 'माइक्रोफ़ोन जुड़ रहा है…',
    ta: 'மைக்ரோஃபோன் இணைகிறது…', te: 'మైక్రోఫోన్ కనెక్ట్ అవుతోంది…',
    bn: 'মাইক্রোফোন সংযুক্ত হচ্ছে…', mr: 'मायक्रोफोन जोडला जात आहे…',
    gu: 'માઇક્રોફોન જોડાઈ રહ્યો છે…', kn: 'ಮೈಕ್ರೋಫೋನ್ ಸಂಪರ್ಕಿಸುತ್ತಿದೆ…',
    ml: 'മൈക്രോഫോൺ ബന്ധിപ്പിക്കുന്നു…',
  };
  const config = micState === 'connecting'
    ? { ...stateConfig.processing, label: connectingText[language] || connectingText.en }
    : stateConfig[micState] || stateConfig.idle;

  return (
    <div className="voicenav-container">
      {/* 1. Recognition Feedback Banner: Green for Recognized / Red for Unrecognized */}
      {recognitionFeedback && (
        <div className={`voicenav-transcript voicenav-feedback--${recognitionFeedback.type} animate-fade-in-up`} role="status">
          <p className="voicenav-transcript-text" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            {recognitionFeedback.text}
          </p>
        </div>
      )}

      {/* 2. Live interim speech while user is actively talking */}
      {!recognitionFeedback && micState === 'listening' && interimTranscript && (
        <div className="voicenav-transcript animate-fade-in-up">
          <p className="voicenav-transcript-text">
            {interimTranscript}
          </p>
        </div>
      )}

      {/* 3. Processing banner after hearing speech: shows "Processing...", NEVER raw unverified text */}
      {!recognitionFeedback && ['processing', 'connecting'].includes(micState) && (
        <div className="voicenav-transcript voicenav-transcript--processing animate-fade-in-up">
          <p className="voicenav-transcript-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="voicenav-pulse-dot"></span>
            <span>{micState === 'connecting' ? config.label : t(language, 'processing') || 'Processing...'}</span>
          </p>
        </div>
      )}

      {/* 4. Hardware microphone error */}
      {!recognitionFeedback && voiceError && (
        <div className="voicenav-transcript voicenav-feedback--error animate-fade-in-up" role="alert">
          <p className="voicenav-transcript-text">{voiceError}</p>
        </div>
      )}

      {/* Main orb button */}
      <button
        className={`voicenav-orb ${config.className}`}
        onClick={toggleListening}
        disabled={!isSpeechSupported}
        aria-label={isSpeaking ? 'Start listening' : isListening ? 'Stop listening' : 'Start listening'}
        title={config.label}
      >
        {/* Pulse rings for listening state */}
        {micState === 'listening' && (
          <>
            <span className="voicenav-pulse-ring voicenav-pulse-ring--1"></span>
            <span className="voicenav-pulse-ring voicenav-pulse-ring--2"></span>
          </>
        )}

        {/* Icon */}
        <span className="voicenav-orb-icon">
          {config.icon}
        </span>
      </button>

      {/* State label removed per user request */}
    </div>
  );
}
