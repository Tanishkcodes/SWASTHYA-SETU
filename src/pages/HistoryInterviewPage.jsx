import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';
import engine from '../engine/ClinicalHistoryEngine';
import ClinicalNLP from '../engine/ClinicalNLP';
import RedFlagDetector from '../engine/RedFlagDetector';
import PainScale from '../components/PainScale';
import AudioButton from '../components/AudioButton';
import { AlertTriangle } from 'lucide-react';
import '../styles/interview.css';

export default function HistoryInterviewPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, setChiefComplaint, addHPIResponse, setInterviewProgress, completeSection, addRedFlag } = useSession();
  const { 
    audioPromptManager, 
    registerPage, 
    unregisterPage, 
    setOnTranscript, 
    clearOnTranscript,
    speak,
    language 
  } = useVoiceNav();

  const [currentSection, setCurrentSection] = useState(session.interviewProgress.currentSection || 'chiefComplaint');
  const [currentQ, setCurrentQ] = useState(null);
  const [historyContext, setHistoryContext] = useState({});
  const [freeTextAnswer, setFreeTextAnswer] = useState('');
  const [localRedFlags, setLocalRedFlags] = useState([]);

  // Load first question on mount or section change
  useEffect(() => {
    const q = engine.getInitialQuestion(currentSection, historyContext);
    if (q) {
      setCurrentQ(q);
      // Auto-speak question if not chief complaint (since cc has welcome message)
      if (currentSection !== 'chiefComplaint') {
        const textToSpeak = q.customText || t(q.textKey);
        speak(textToSpeak, language);
      }
    } else {
      // If section has no initial question, mark complete and go to next
      handleSectionComplete();
    }
  }, [currentSection, language]);

  // Handle page mount welcome
  useEffect(() => {
    audioPromptManager.speakPageWelcome('interview');
    return () => {
      clearOnTranscript();
      unregisterPage('interview');
    };
  }, []);

  // Update voice commands when section changes
  useEffect(() => {
    registerPage('interview', {
      back: handleBack,
      skip: handleSectionComplete
    });
  }, [currentSection]);

  // Set up free text voice transcript listener
  useEffect(() => {
    setOnTranscript((transcript, parsedCommand) => {
      // If we are waiting for a free text answer or a choice, process it
      if (currentQ) {
        
        // If it's a choice question and voice matched an option number
        if (parsedCommand.intent === 'selectOption' && parsedCommand.value !== null) {
          if (currentQ.options && currentQ.options[parsedCommand.value]) {
            handleAnswer(currentQ.options[parsedCommand.value].value);
            return;
          }
        }

        // Process with NLP to find symptoms
        const extracted = ClinicalNLP.extractEntities(transcript);
        
        if (currentSection === 'chiefComplaint') {
          if (extracted.symptoms.length > 0) {
            handleAnswer(extracted.symptoms[0], extracted.symptoms[0]);
          } else {
            // Free text
            setFreeTextAnswer(transcript);
            handleAnswer(transcript, 'general');
          }
        } else {
          // Just save as free text for other sections
          handleAnswer(transcript);
        }
      }
    });
  }, [currentQ, currentSection]);


  const handleAnswer = (val, bodySystem = null) => {
    // Stop any ongoing speech when user interacts
    audioPromptManager.stop();
    
    // 1. Save data based on section
    const newContext = { ...historyContext };
    
    if (currentSection === 'chiefComplaint') {
      setChiefComplaint(val, bodySystem);
      newContext.chiefComplaint = val;
      
      // Check red flags for CC
      const flags = RedFlagDetector.check([val], null, session.patient.age);
      if (flags.length > 0) {
        setLocalRedFlags(flags);
        flags.forEach(f => addRedFlag(f));
        audioPromptManager.speakError(); // Play alert sound
      }

    } else if (currentSection === 'hpi') {
      addHPIResponse({ question: currentQ.id, answer: val });
    }
    // ... logic for other sections can be added here
    
    setHistoryContext(newContext);
    audioPromptManager.speakEncouragement();

    // 2. Get next question
    const nextQ = engine.getNextQuestion(currentSection, currentQ.id, val, newContext);
    
    if (nextQ) {
      setCurrentQ(nextQ);
      const textToSpeak = nextQ.customText || t(nextQ.textKey);
      setTimeout(() => speak(textToSpeak, language), 800); // slight delay after encouragement
    } else {
      handleSectionComplete();
    }
  };

  const handleSectionComplete = () => {
    completeSection(currentSection);
    audioPromptManager.speakSectionDone();
    
    // Find next section
    const allSections = engine.sections;
    const currentIndex = allSections.indexOf(currentSection);
    
    if (currentIndex < allSections.length - 1) {
      const nextSection = allSections[currentIndex + 1];
      setCurrentSection(nextSection);
      setInterviewProgress({ currentSection: nextSection });
    } else {
      // Done with interview!
      navigate('/scan');
    }
  };

  const handleBack = () => {
    navigate('/consent'); // simplistic back
  };

  const renderQuestionUI = () => {
    if (!currentQ) return <p>Loading...</p>;

    const questionText = currentQ.customText || t(currentQ.textKey);

    return (
      <div className="question-card animate-fade-in-up">
        <h2 className="question-text flex-center gap-3">
          {questionText}
          <AudioButton textKey={null} customText={questionText} size={28} />
        </h2>

        {/* Dynamic UI based on question type */}
        {currentQ.type === 'bodySystem' && (
          <BodyMap onSelect={(part) => handleAnswer(`pain in ${part}`, part)} />
        )}

        {currentQ.type === 'painScale' && (
          <PainScale onSelect={(val) => handleAnswer(val)} />
        )}

        {(currentQ.type === 'choice' || currentQ.type === 'yes_no' || currentQ.type === 'yes_no_dontknow' || currentQ.type === 'choice_or_text' || currentQ.type === 'multi_choice') && (
          <div className={`options-grid ${currentQ.options.length <= 4 ? 'large-options' : ''}`}>
            {currentQ.options.map((opt, idx) => (
              <div 
                key={opt.id} 
                className="option-card"
                onClick={() => handleAnswer(opt.value)}
              >
                {opt.icon && <span className="option-icon">{opt.icon}</span>}
                <span className="option-label">{opt.label || t(opt.labelKey)}</span>
                <span className="text-xs text-gray-400 mt-2">({idx + 1})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const sectionTitles = {
    chiefComplaint: t('chiefComplaint'),
    hpi: 'History of Present Illness',
    pastMedical: 'Past Medical History',
    personalHistory: 'Personal History',
    reviewOfSystems: 'Review of Systems',
    ayushAssessment: 'AYUSH Prakriti'
  };

  return (
    <div className="interview-page animate-fade-in">
      <div className="interview-header">
        {/* Progress Bar */}
        <div className="interview-progress-bar">
          <div 
            className="interview-progress-fill" 
            style={{ width: `${session.interviewProgress.completionPercentage}%` }}
          />
        </div>
        <div className="flex-between">
          <span className="interview-section-title">
            {sectionTitles[currentSection] || currentSection}
          </span>
          <span className="text-sm text-gray-500">
            {session.interviewProgress.completionPercentage}% Complete
          </span>
        </div>

        {/* Local Red Flags display */}
        {localRedFlags.map((flag, i) => (
          <div key={i} className="red-flag-banner">
            <AlertTriangle className="red-flag-icon" size={24} />
            <span className="red-flag-text">{flag.message}</span>
          </div>
        ))}
      </div>

      <div className="interview-content">
        {renderQuestionUI()}
      </div>

      {/* Manual Skip/Next for demo purposes */}
      <div style={{ marginTop: 'var(--space-8)', display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '800px' }}>
        <button className="btn btn-ghost" onClick={handleBack}>{t('back')}</button>
        <button className="btn btn-outline" onClick={handleSectionComplete}>Skip Section ⏭️</button>
      </div>
    </div>
  );
}
