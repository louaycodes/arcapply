"use client";

import React from "react";
import { useAppLanguage } from "@/lib/language-context";
import { Languages } from "lucide-react";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useAppLanguage();

  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-lg border border-stone-200 dark:border-stone-700 text-xs shadow-xs ${className}`}
    >
      <Languages className="w-3.5 h-3.5 text-stone-500 ml-1 shrink-0" />
      <button
        type="button"
        onClick={() => setLanguage("fr")}
        className={`py-1 px-2.5 rounded-md font-medium transition-all ${
          language === "fr"
            ? "bg-white text-stone-900 shadow-xs font-bold border border-stone-200/60"
            : "text-stone-500 hover:text-stone-800"
        }`}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`py-1 px-2.5 rounded-md font-medium transition-all ${
          language === "en"
            ? "bg-white text-stone-900 shadow-xs font-bold border border-stone-200/60"
            : "text-stone-500 hover:text-stone-800"
        }`}
      >
        EN
      </button>
    </div>
  );
}
