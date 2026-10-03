"use client";

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
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";

const navigationItems = [
  { name: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { name: "Offres de Stage PFE", href: "/radar", icon: Radar },
  { name: "Mon Profil", href: "/profile", icon: UserCheck },
  { name: "Directives Agent", href: "/playbook", icon: Sparkles },
  { name: "Éditeur de CV", href: "/cv", icon: FileText },
  { name: "Suivi Candidatures", href: "/kanban", icon: KanbanSquare },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 border-r border-border bg-[#F7F3EC] flex flex-col justify-between p-4 min-h-screen shrink-0">
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-border/80">
          <img
            src="/logo.png"
            alt="ArcApply Logo"
            className="w-14 h-14 shrink-0 object-contain drop-shadow-sm"
          />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground font-display">
              ArcApply
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Assistant Candidatures</p>
          </div>
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
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Session & User Section */}
      <div className="pt-4 border-t border-border/70 space-y-2.5">
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
                <p className="text-[11px] text-muted-foreground truncate font-mono">
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
              <span>Se déconnecter</span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary hover:bg-orange-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Se connecter</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
