"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import {
  LayoutDashboard,
  Radar,
  UserCheck,
  KanbanSquare,
  Settings,
  FileText,
  Sparkles,
  Compass,
  Menu,
} from "lucide-react";
import { useMobileNav } from "./sidebar";
import { useAppLanguage } from "@/lib/language-context";
import { useAuth } from "@/components/auth/auth-context";

const PAGE_META: Record<string, { title: { fr: string; en: string }; icon: React.ComponentType<{ className?: string }> }> = {
  "/": { title: { fr: "Tableau de bord", en: "Dashboard" }, icon: LayoutDashboard },
  "/radar": { title: { fr: "Offres de Stage PFE", en: "Internship Offers" }, icon: Radar },
  "/profile": { title: { fr: "Mon Profil", en: "My Profile" }, icon: UserCheck },
  "/playbook": { title: { fr: "Directives Agent", en: "Agent Directives" }, icon: Sparkles },
  "/cv": { title: { fr: "Éditeur de CV", en: "CV Editor" }, icon: FileText },
  "/kanban": { title: { fr: "Suivi des Candidatures", en: "Application Tracker" }, icon: KanbanSquare },
  "/settings": { title: { fr: "Paramètres", en: "Settings" }, icon: Settings },
  "/onboarding": { title: { fr: "Configuration du profil", en: "Profile Setup" }, icon: Compass },
};

export function TopNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { open: openMobileNav } = useMobileNav();
  const { language, t } = useAppLanguage();

  if (!user || pathname === "/landing" || pathname === "/login") {
    return null;
  }

  // Trouver le titre de la page courante
  const currentKey = Object.keys(PAGE_META).find((k) =>
    k === "/" ? pathname === "/" : pathname.startsWith(k)
  ) || "/";

  const { title, icon: Icon } = PAGE_META[currentKey] || {
    title: { fr: "ArcApply", en: "ArcApply" },
    icon: Sparkles,
  };

  return (
    <header className="h-14 border-b border-border/80 bg-background/85 dark:bg-stone-900/85 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-30 transition-colors">
      {/* Section Gauche : Titre de section propre (sans mention 'ArcApply Cockpit') */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={openMobileNav}
          aria-label={t("Ouvrir le menu", "Open menu")}
          className="lg:hidden p-2 -ml-1 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 items-center justify-center text-primary shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-foreground font-display truncate">
            {title[language]}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" title={t("Moteur opérationnel", "Engine online")} />
        </div>
      </div>

      {/* Section Droite : Options de navigation Dark/Light et FR/EN */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
