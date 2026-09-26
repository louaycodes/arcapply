"use client";

import { useState } from "react";
import { ATSMatchResult } from "@/lib/api";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Info,
  ChevronRight,
  X,
  Target,
} from "lucide-react";

interface AtsScoreBadgeProps {
  match?: ATSMatchResult | null;
  loading?: boolean;
}

export function AtsScoreBadge({ match, loading = false }: AtsScoreBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/60 border border-border/40 text-[11px] font-mono text-muted-foreground animate-pulse">
        <Target className="w-3 h-3 animate-spin text-muted-foreground" />
        <span>ATS...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/30 border border-border/30 text-[10px] font-mono text-muted-foreground">
        <span>ATS N/A</span>
      </div>
    );
  }

  const score = match.score;
  const isHigh = score >= 70;
  const isMedium = score >= 40 && score < 70;

  const badgeStyle = isHigh
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
    : isMedium
    ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
    : "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25";

  const progressBg = isHigh
    ? "bg-emerald-500"
    : isMedium
    ? "bg-amber-500"
    : "bg-rose-500";

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold transition-all cursor-pointer shadow-sm ${badgeStyle}`}
        title="Cliquer pour voir l'inventaire des compétences et l'audit ATS"
      >
        <span className="w-1.5 h-1.5 rounded-full animate-ping mr-0.5 opacity-75" style={{ backgroundColor: isHigh ? "#10B981" : isMedium ? "#F59E0B" : "#EF4444" }} />
        <span>ATS {score}%</span>
      </button>

      {/* Detail Dialog / Popover Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${badgeStyle}`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    Alignement ATS : {score}%
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({match.matched_skills.length} validées / {match.total_required} requises)
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground mt-2">
                  Inventaire Déterministe des Compétences
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Adéquation mathématique</span>
                <span className="font-semibold text-foreground">{score} / 100</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${progressBg}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {/* Skills Breakdown */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* 1. Matched Skills */}
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validées dans votre Master Profile ({match.matched_skills.length})</span>
                </div>
                {match.matched_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.matched_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium font-mono"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Aucune correspondance directe détectée.</p>
                )}
              </div>

              {/* 2. Transferable Skills */}
              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Transférables / Proximité Sémantique (0.6x) ({match.transferable_skills.length})</span>
                </div>
                {match.transferable_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.transferable_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium font-mono"
                      >
                        ⚡ {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Aucune compétence transférable identifiée.</p>
                )}
              </div>

              {/* 3. Missing Skills (Strict Zero Hallucination Quarantine) */}
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                    <XCircle className="w-4 h-4" />
                    <span>Compétences Manquantes ({match.missing_skills.length})</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <ShieldAlert className="w-3 h-3" />
                    Zéro-Hallucination
                  </span>
                </div>
                {match.missing_skills.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {match.missing_skills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium font-mono"
                        >
                          ✕ {s}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                      Ces compétences sont absentes de votre profil vérifié. Le moteur ArcApply s'interdit formellement de les inventer ou extrapoler lors de la génération de vos candidatures.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-emerald-400 italic">Aucune lacune critique détectée !</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-semibold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
