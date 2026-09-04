/* ============================================
   SWASTHYA SETU — Language Context
   Manages multi-lingual state and syncs audio TTS engine
   ============================================ */

import React, { createContext, useContext, useCallback, useLayoutEffect } from 'react';
import { useSession } from './SessionContext';
import { UI_STRINGS, getAllLanguages } from '../voicenav/LanguagePack';
import domTranslator from '../engine/DOMTranslator';
import audioPromptManager from '../voicenav/AudioPromptManager';

const LanguageContext = createContext(null);

const LANG_SWITCH_SPOKEN = {
  hi: 'भाषा हिंदी में बदल दी गई है।',
  ta: 'மொழி தமிழுக்கு மாற்றப்பட்டது.',
  te: 'భాష తెలుగులోకి మార్చబడింది.',
  bn: 'ভাষা বাংলায় পরিবর্তন করা হয়েছে।',
  mr: 'भाषा मराठीमध्ये बदलण्यात आली आहे.',
  gu: 'ભાષા ગુજરાતીમાં બદલાઈ ગઈ છે.',
  kn: 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.',
  ml: 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി.',
  en: 'Language changed to English.'
};

export function LanguageProvider({ children }) {
  const { session, setLanguage } = useSession();
  const currentLang = session?.language || 'en';

  // Sync DOM Translator and document language whenever currentLang changes
  useLayoutEffect(() => {
    domTranslator.start(currentLang);
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const setCurrentLang = useCallback((langCode) => {
    if (!UI_STRINGS[langCode]) return;
    if (setLanguage) setLanguage(langCode);
    audioPromptManager.setLanguage(langCode, false);
    audioPromptManager.interruptWith(LANG_SWITCH_SPOKEN[langCode], langCode);
  }, [setLanguage]);

  // Translate function
  const t = useCallback((key) => {
    const strings = UI_STRINGS[currentLang] || UI_STRINGS.en;
    return strings[key] || UI_STRINGS.en[key] || null;
  }, [currentLang]);

  const availableLanguages = getAllLanguages();

  return (
    <LanguageContext.Provider value={{ t, currentLang, setCurrentLang, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
