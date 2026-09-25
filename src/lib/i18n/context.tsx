"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
  type SupportedLanguage,
  TRANSLATIONS,
} from "./translations";

interface I18nContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
});

const STORAGE_KEY = "medvault_lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (saved && (saved === "en" || saved === "hi" || saved === "ta")) {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.cookie = `medvault_lang=${lang};path=/;max-age=31536000`;
      document.documentElement.lang = lang;
    } catch {
      // Storage unavailable
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
      if (dict && dict[key]) {
        return dict[key];
      }
      const fallbackDict = TRANSLATIONS.en;
      if (fallbackDict && fallbackDict[key]) {
        return fallbackDict[key];
      }
      return fallback || key;
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
