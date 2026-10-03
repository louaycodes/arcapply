"use client";

import React from "react";
import { useAppTheme } from "@/lib/theme-context";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useAppTheme();

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-lg border border-stone-200 dark:border-stone-700 text-xs shadow-xs ${className}`}
      role="group"
      aria-label="Mode d'affichage"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`flex items-center gap-1.5 py-1 px-2 sm:px-2.5 rounded-md font-medium transition-all cursor-pointer ${
          theme === "light"
            ? "bg-white text-stone-900 shadow-xs font-bold border border-stone-200/60"
            : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
        }`}
        title="Mode Clair"
      >
        <Sun className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span className="hidden sm:inline">Clair</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-1.5 py-1 px-2 sm:px-2.5 rounded-md font-medium transition-all cursor-pointer ${
          theme === "dark"
            ? "bg-stone-900 text-white shadow-xs font-bold border border-stone-700"
            : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
        }`}
        title="Mode Sombre"
      >
        <Moon className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden sm:inline">Sombre</span>
      </button>
    </div>
  );
}
