/* ============================================
   SWASTHYA SETU — Language Context
   Manages multi-lingual state and syncs audio TTS engine
   ============================================ */

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useSession } from './SessionContext';
import { UI_STRINGS, getAllLanguages } from '../voicenav/LanguagePack';
import domTranslator from '../engine/DOMTranslator';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { session, setLanguage } = useSession();
  const [currentLang, setCurrentLangState] = useState(session?.language || 'en');

  // Sync DOM Translator and document language whenever currentLang changes
  useEffect(() => {
    domTranslator.start(currentLang);
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const setCurrentLang = useCallback((langCode) => {
    setCurrentLangState(langCode);
    if (setLanguage) setLanguage(langCode);
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
