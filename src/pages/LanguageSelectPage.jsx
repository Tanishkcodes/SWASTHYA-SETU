import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';
import { getAllLanguages } from '../voicenav/LanguagePack';
import AudioButton from '../components/AudioButton';
import { Volume2 } from 'lucide-react';
import '../styles/language.css';

export default function LanguageSelectPage() {
  const navigate = useNavigate();
  const { t, setCurrentLang } = useLanguage();
  const { session, setLanguage: setSessionLanguage } = useSession();
  const { audioPromptManager, registerPage, unregisterPage, commandParser, speak } = useVoiceNav();

  const languages = getAllLanguages();
  const [selectedLang, setSelectedLang] = useState(session.language || 'en');

  useEffect(() => {
    // Speak welcome in currently selected language
    audioPromptManager.speakPageWelcome('language');

    registerPage('language', {
      next: () => navigate('/consent'),
      back: () => navigate('/auth'),
      select_english: () => handleSelect('en'),
      select_hindi: () => handleSelect('hi'),
      select_tamil: () => handleSelect('ta'),
      select_telugu: () => handleSelect('te'),
      select_bengali: () => handleSelect('bn'),
      select_marathi: () => handleSelect('mr'),
      select_gujarati: () => handleSelect('gu'),
      select_kannada: () => handleSelect('kn'),
      select_malayalam: () => handleSelect('ml'),
      free_text: (result) => {
        // Fallback check if they said a language name that LLM missed
        const langMatch = commandParser.matchLanguage(result.raw);
        if (langMatch.lang) {
          handleSelect(langMatch.lang);
        }
      }
    }, {
      next: ['Continue with the selected language'],
      back: ['Return to patient identification'],
      select_english: ['Choose English'], select_hindi: ['Choose Hindi'],
      select_tamil: ['Choose Tamil'], select_telugu: ['Choose Telugu'],
      select_bengali: ['Choose Bengali'], select_marathi: ['Choose Marathi'],
      select_gujarati: ['Choose Gujarati'], select_kannada: ['Choose Kannada'],
      select_malayalam: ['Choose Malayalam'],
      free_text: ['A naturally spoken language choice in any supported language'],
    });

    return () => unregisterPage('language');
  }, [audioPromptManager, navigate, registerPage, unregisterPage, commandParser]);

  const handleSelect = (langCode) => {
    setSelectedLang(langCode);
    setSessionLanguage(langCode); // Update session context
    setCurrentLang(langCode); // Update UI text language
    
    // LanguageContext announces the change once in the selected language.
  };

  const handleNext = () => {
    setSessionLanguage(selectedLang);
    setCurrentLang(selectedLang);
    navigate('/consent');
  };

  return (
    <div className="language-page animate-fade-in">
      <div className="language-header">
        <h1 className="language-title flex-center gap-3">
          {t('selectLanguage')}
          <AudioButton textKey="welcomeLanguage" />
        </h1>
        <p className="language-subtitle flex-center gap-2">
          {t('tapOrSay')} <Volume2 size={18} />
        </p>
      </div>

      <div className="language-grid stagger-children">
        {languages.map((lang, index) => (
          <div 
            key={lang.code}
            className={`language-card animate-fade-in-up ${selectedLang === lang.code ? 'selected' : ''}`}
            onClick={() => handleSelect(lang.code)}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="language-info">
              <span className="language-native">{lang.nativeName}</span>
              <span className="language-english">{lang.name}</span>
            </div>
            
            <button 
              className="language-audio-btn"
              onClick={(e) => {
                e.stopPropagation();
                speak(lang.script, lang.code);
              }}
              title={`Listen to ${lang.name}`}
            >
              <Volume2 size={24} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-10)', display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '1000px' }}>
        <button className="btn btn-ghost btn-lg" onClick={() => navigate('/auth')}>
          {t('back')}
        </button>
        <button 
          className="btn btn-primary btn-xl animate-pulse-glow" 
          onClick={handleNext}
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
}
