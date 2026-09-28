"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radar,
  UserCheck,
  KanbanSquare,
  Settings,
  ShieldCheck,
  Server,
  FileText,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { checkEngineHealth } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";

const navigationItems = [
  { name: "Tableau de bord", href: "/", icon: LayoutDashboard, shortcut: "g d" },
  { name: "Offres d'emploi", href: "/radar", icon: Radar, shortcut: "g r" },
  { name: "Mon Profil", href: "/profile", icon: UserCheck, shortcut: "g p" },
  { name: "Éditeur de CV", href: "/cv", icon: FileText, shortcut: "g c" },
  { name: "Suivi Candidatures", href: "/kanban", icon: KanbanSquare, shortcut: "g k" },
  { name: "Paramètres", href: "/settings", icon: Settings, shortcut: "g s" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isEngineOnline, setIsEngineOnline] = useState<boolean | null>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const healthy = await checkEngineHealth();
      if (mounted) setIsEngineOnline(healthy);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <aside className="w-64 border-r border-border bg-[#F7F3EC] flex flex-col justify-between p-4 min-h-screen shrink-0">
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-border/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-700 flex items-center justify-center text-white shadow-md shadow-orange-600/25 border border-orange-400/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground font-display flex items-center gap-1.5">
              ArcApply
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-900 border border-orange-200/80 shadow-xs">
                PFE 2027
              </span>
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
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-white shadow-sm shadow-orange-600/25 font-semibold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-[#EDE5DA] font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "text-stone-500"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                <kbd
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? "bg-orange-700/80 text-orange-100"
                      : "bg-[#EAE1D4] text-stone-600 border border-[#DDD3C5]"
                  }`}
                >
                  {item.shortcut}
                </kbd>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3">
        {/* User Card */}
        {user && (
          <div className="px-3 py-2.5 rounded-xl bg-white border border-border shadow-artisan flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-orange-200 text-primary font-bold flex items-center justify-center text-[11px] shrink-0 border border-primary/30">
                {user.full_name?.substring(0, 2).toUpperCase() || user.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-800 truncate leading-tight">
                  {user.full_name || user.username}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  @{user.username}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Se déconnecter"
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Engine Status & System Info */}
        <div>
          <div className="px-3 py-2.5 rounded-xl bg-white border border-border shadow-artisan text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-stone-500" />
              <span className="text-stone-600 font-mono text-[11px] font-medium">Service d'IA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isEngineOnline === null
                    ? "bg-amber-500"
                    : isEngineOnline
                    ? "bg-emerald-600"
                    : "bg-rose-600"
                }`}
              />
              <span
                className={`font-mono text-[11px] ${
                  isEngineOnline === null
                    ? "text-amber-700"
                    : isEngineOnline
                    ? "text-emerald-700 font-semibold"
                    : "text-red-700 font-semibold"
                }`}
              >
                {isEngineOnline === null
                  ? "Connexion..."
                  : isEngineOnline
                  ? "Connecté"
                  : "Hors-ligne"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

