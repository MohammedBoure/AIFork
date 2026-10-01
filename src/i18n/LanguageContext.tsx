import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { translations } from './translations';
import type { Language } from './translations';
import { LanguageContext } from './useLanguage';

const LANGUAGE_STORAGE_KEY = 'thoughtgraph_ai_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') return saved;
      return 'ar';
    } catch {
      return 'ar';
    }
  });

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch (err) {
      console.error('Failed to save language preference:', err);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const nextLang: Language = prev === 'ar' ? 'en' : 'ar';
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
      } catch (err) {
        console.error('Failed to save language preference:', err);
      }
      return nextLang;
    });
  }, []);

  const isRTL = language === 'ar';
  const dir: 'rtl' | 'ltr' = isRTL ? 'rtl' : 'ltr';

  // Synchronize document direction and lang attributes
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: translations[language],
      isRTL,
      dir,
    }),
    [language, setLanguage, toggleLanguage, isRTL, dir]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
