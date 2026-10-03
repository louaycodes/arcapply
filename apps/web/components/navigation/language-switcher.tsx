"use client";

import React from "react";
import { useAppLanguage } from "@/lib/language-context";
import { Languages } from "lucide-react";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useAppLanguage();

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-lg border border-stone-200 dark:border-stone-700 text-xs shadow-xs ${className}`}
      role="group"
      aria-label="Sélection de la langue"
    >
      <Languages className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 ml-1 shrink-0" />
      <button
        type="button"
        onClick={() => setLanguage("fr")}
        className={`py-1 px-2.5 rounded-md font-medium transition-all cursor-pointer ${
          language === "fr"
            ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-bold border border-stone-200/60 dark:border-stone-700"
            : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
        }`}
        title="Français"
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`py-1 px-2.5 rounded-md font-medium transition-all cursor-pointer ${
          language === "en"
            ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-bold border border-stone-200/60 dark:border-stone-700"
            : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
        }`}
        title="English"
      >
        EN
      </button>
    </div>
  );
}
