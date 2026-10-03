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
} from "lucide-react";

const PAGE_META: Record<string, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
  "/": { title: "Tableau de bord", icon: LayoutDashboard },
  "/radar": { title: "Offres de Stage PFE", icon: Radar },
  "/profile": { title: "Mon Profil", icon: UserCheck },
  "/playbook": { title: "Directives Agent", icon: Sparkles },
  "/cv": { title: "Éditeur de CV", icon: FileText },
  "/kanban": { title: "Suivi des Candidatures", icon: KanbanSquare },
  "/settings": { title: "Paramètres", icon: Settings },
};

export function TopNavbar() {
  const pathname = usePathname();

  // Trouver le titre de la page courante
  const currentKey = Object.keys(PAGE_META).find((k) =>
    k === "/" ? pathname === "/" : pathname.startsWith(k)
  ) || "/";

  const { title, icon: Icon } = PAGE_META[currentKey] || {
    title: "ArcApply",
    icon: Sparkles,
  };

  return (
    <header className="h-14 border-b border-border/80 bg-background/85 dark:bg-stone-900/85 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Section Gauche : Titre de section propre (sans mention 'ArcApply Cockpit') */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 flex items-center justify-center text-primary">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground font-display">
            {title}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" title="Moteur opérationnel" />
        </div>
      </div>

      {/* Section Droite : Options de navigation Dark/Light et FR/EN */}
      <div className="flex items-center gap-2.5">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
