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
} from "lucide-react";
import { useEffect, useState } from "react";
import { checkEngineHealth } from "@/lib/api";

const navigationItems = [
  { name: "Cockpit", href: "/", icon: LayoutDashboard, shortcut: "g d" },
  { name: "Radar d'Offres", href: "/radar", icon: Radar, shortcut: "g r" },
  { name: "Master Profile", href: "/profile", icon: UserCheck, shortcut: "g p" },
  { name: "Tableau Kanban", href: "/kanban", icon: KanbanSquare, shortcut: "g k" },
  { name: "Paramètres", href: "/settings", icon: Settings, shortcut: "g s" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isEngineOnline, setIsEngineOnline] = useState<boolean | null>(null);

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
    <aside className="w-64 border-r border-border bg-[#0B0F19]/90 backdrop-blur-md flex flex-col justify-between p-4 min-h-screen">
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-border/50">
          <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold shadow-lg shadow-primary/10">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
              ArcApply
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                PFE 2027
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">Copilote de Candidature</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  <span>{item.name}</span>
                </div>
                <kbd
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? "bg-primary-hover text-white" : "bg-muted text-muted-foreground border border-border/40"
                  }`}
                >
                  {item.shortcut}
                </kbd>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Engine Status & System Info */}
      <div className="pt-4 border-t border-border/50">
        <div className="px-3 py-2.5 rounded-lg bg-card border border-border/60 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground font-mono">Engine local</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isEngineOnline === null
                  ? "bg-warning animate-pulse"
                  : isEngineOnline
                  ? "bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                  : "bg-destructive"
              }`}
            />
            <span
              className={`font-mono text-[11px] ${
                isEngineOnline === null
                  ? "text-warning"
                  : isEngineOnline
                  ? "text-success font-medium"
                  : "text-destructive font-medium"
              }`}
            >
              {isEngineOnline === null ? "..." : isEngineOnline ? ":8000 OK" : "Hors-ligne"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
