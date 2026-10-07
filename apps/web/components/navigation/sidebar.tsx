"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radar,
  UserCheck,
  KanbanSquare,
  Settings,
  FileText,
  LogOut,
  LogIn,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { useAppLanguage } from "@/lib/language-context";

const navigationItems = [
  { name: { fr: "Tableau de bord", en: "Dashboard" }, href: "/", icon: LayoutDashboard },
  { name: { fr: "Offres de Stage PFE", en: "Internship Offers" }, href: "/radar", icon: Radar },
  { name: { fr: "Mon Profil", en: "My Profile" }, href: "/profile", icon: UserCheck },
  { name: { fr: "Directives Agent", en: "Agent Directives" }, href: "/playbook", icon: Sparkles },
  { name: { fr: "Éditeur de CV", en: "CV Editor" }, href: "/cv", icon: FileText },
  { name: { fr: "Suivi Candidatures", en: "Application Tracker" }, href: "/kanban", icon: KanbanSquare },
  { name: { fr: "Paramètres", en: "Settings" }, href: "/settings", icon: Settings },
];

interface MobileNavContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const MobileNavContext = createContext<MobileNavContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Ferme le tiroir à chaque navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Bloque le défilement de la page et gère la touche Échap quand le tiroir est ouvert
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  return (
    <MobileNavContext.Provider
      value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  return useContext(MobileNavContext);
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { language, t } = useAppLanguage();

  return (
    <>
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-border/80 dark:border-stone-800">
          <img
            src="/logo.png"
            alt="ArcApply Logo"
            className="w-14 h-14 shrink-0 object-contain drop-shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 font-display">
              ArcApply
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{t("Assistant Candidatures", "Application Assistant")}</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t("Fermer le menu", "Close menu")}
              className="p-2 -mr-1 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-white shadow-sm shadow-orange-600/25 font-semibold"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-[#EDE5DA] dark:hover:bg-stone-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "text-stone-500 dark:text-stone-400"
                    }`}
                  />
                  <span>{item.name[language]}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Session & User Section */}
      <div className="pt-4 mt-6 border-t border-border/70 space-y-2.5">
        {user ? (
          <>
            <div className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-border dark:border-stone-700 shadow-artisan flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-orange-200 dark:from-primary/30 dark:to-orange-900 text-primary font-bold flex items-center justify-center text-xs shrink-0 border border-primary/30">
                {user.full_name?.substring(0, 2).toUpperCase() || user.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-stone-800 dark:text-stone-100 truncate leading-tight">
                  {user.full_name || user.username}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate font-mono">
                  @{user.username}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/80 hover:bg-red-50 dark:hover:bg-red-950/40 text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all text-xs font-semibold shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t("Se déconnecter", "Sign out")}</span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary hover:bg-orange-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>{t("Se connecter", "Sign in")}</span>
          </Link>
        )}
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isOpen, close } = useMobileNav();

  if (!user || pathname === "/landing" || pathname === "/login") {
    return null;
  }

  return (
    <>
      {/* Desktop : barre latérale fixe */}
      <aside className="hidden lg:flex w-64 border-r border-border dark:border-stone-800 bg-[#F7F3EC] dark:bg-[#171513] flex-col justify-between p-4 h-screen sticky top-0 overflow-y-auto shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile / tablette : tiroir de navigation */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="absolute inset-0 bg-stone-950/50 backdrop-blur-xs" onClick={close} />
        <aside
          role="dialog"
          aria-modal="true"
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#F7F3EC] dark:bg-[#171513] border-r border-border dark:border-stone-800 flex flex-col justify-between p-4 overflow-y-auto shadow-2xl transition-transform duration-200 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent onClose={close} />
        </aside>
      </div>
    </>
  );
}
