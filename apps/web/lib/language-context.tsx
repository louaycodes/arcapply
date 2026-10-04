"use client";

import React, { createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { Language, LANGUAGE_STORAGE_KEY, getStoredLanguage, tr } from "./i18n";

export type { Language };
export { LANGUAGE_STORAGE_KEY, getStoredLanguage, tr };

export function localeFor(lang: Language): string {
  return lang === "en" ? "en-US" : "fr-FR";
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  /** Sélectionne la version française ou anglaise d'un texte d'interface. */
  t: (fr: string, en: string) => string;
  /** Locale BCP 47 pour le formatage des dates et nombres. */
  locale: string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "fr",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (fr) => fr,
  locale: "fr-FR",
});

// useLayoutEffect côté client uniquement (évite l'avertissement SSR)
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : () => {};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");

  // Lecture avant le premier rendu visible pour éviter un flash du français en mode anglais
  useIsomorphicLayoutEffect(() => {
    const stored = getStoredLanguage();
    if (stored !== "fr") setLanguageState(stored);
  }, []);

  // Synchronise l'attribut lang et le titre de l'onglet (les métadonnées serveur sont en français)
  const pathname = usePathname();
  useIsomorphicLayoutEffect(() => {
    document.documentElement.lang = language;
    document.title = tr(
      language,
      "ArcApply — Vos candidatures d'ingénieur en toute simplicité",
      "ArcApply — Your engineering applications, made simple"
    );
  }, [language, pathname]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "fr" ? "en" : "fr");
  }, [language, setLanguage]);

  // Référence stable lisant la langue courante : les callbacks enregistrés une seule fois
  // (abonnements SSE, minuteries) traduisent toujours dans la langue active.
  const languageRef = useRef(language);
  languageRef.current = language;
  const t = useCallback((fr: string, en: string) => tr(languageRef.current, fr, en), []);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, toggleLanguage, t, locale: localeFor(language) }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useAppLanguage() {
  return useContext(LanguageContext);
}
