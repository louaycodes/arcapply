"use client";

import { useState } from "react";
import { ATSMatchResult } from "@/lib/api";
import {
  CheckCircle2,
  Check,
  Zap,
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
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-[11px] font-mono text-stone-600">
        <Target className="w-3 h-3 text-stone-500" />
        <span>ATS...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-[10px] font-mono text-stone-500">
        <span>ATS N/A</span>
      </div>
    );
  }

  const score = match.score;
  const isHigh = score >= 70;
  const isMedium = score >= 40 && score < 70;

  const badgeStyle = isHigh
    ? "backdrop-blur-md bg-emerald-500/15 text-emerald-950 border border-emerald-400/50 shadow-xs ring-1 ring-emerald-500/20 hover:bg-emerald-500/25 hover:border-emerald-500/60"
    : isMedium
    ? "backdrop-blur-md bg-amber-500/15 text-amber-950 border border-amber-400/50 shadow-xs ring-1 ring-amber-500/20 hover:bg-amber-500/25 hover:border-amber-500/60"
    : "backdrop-blur-md bg-rose-500/15 text-rose-950 border border-rose-400/50 shadow-xs ring-1 ring-rose-500/20 hover:bg-rose-500/25 hover:border-rose-500/60";

  const progressBg = isHigh
    ? "bg-emerald-600"
    : isMedium
    ? "bg-amber-600"
    : "bg-rose-600";

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${badgeStyle}`}
        title="Cliquer pour voir l'inventaire des compétences et l'audit ATS"
      >
        <span
          className="w-2 h-2 rounded-full mr-0.5 shrink-0 shadow-xs"
          style={{
            backgroundColor: isHigh ? "#15803D" : isMedium ? "#B45309" : "#B91C1C",
          }}
        />
        <span>ATS {score}%</span>
      </button>

      {/* Detail Dialog / Popover Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/80 bg-white/90 backdrop-blur-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 ring-1 ring-stone-900/5"
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
                  <span className="text-xs text-stone-500 font-mono">
                    ({match.matched_skills.length} validées / {match.total_required} requises)
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-900 font-display mt-2">
                  Inventaire Déterministe des Compétences
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-stone-500">Niveau de correspondance</span>
                <span className="font-semibold text-stone-900">{score} / 100</span>
              </div>
              <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${progressBg}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {/* Skills Breakdown */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* 1. Matched Skills */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Présentes sur votre profil ({match.matched_skills.length})</span>
                </div>
                {match.matched_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.matched_skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-semibold font-mono"
                      >
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>{s}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic">Aucune correspondance directe détectée.</p>
                )}
              </div>

              {/* 2. Transferable Skills */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Compétences proches ou transférables ({match.transferable_skills.length})</span>
                </div>
                {match.transferable_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.transferable_skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/70 border border-amber-300 text-amber-900 text-xs font-semibold font-mono"
                      >
                        <Zap className="w-3 h-3 text-amber-700" />
                        <span>{s}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic">Aucune compétence transférable identifiée.</p>
                )}
              </div>

              {/* 3. Missing Skills */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Compétences à acquérir ({match.missing_skills.length})</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 font-semibold">
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    Non inventées
                  </span>
                </div>
                {match.missing_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.missing_skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100/70 border border-rose-300 text-rose-900 text-xs font-semibold font-mono"
                      >
                        <X className="w-3 h-3 text-rose-700" />
                        <span>{s}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic">Toutes les compétences requises sont couvertes !</p>
                )}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Ce score évalue la compatibilité entre votre profil et les attentes du recruteur. Vos candidatures n'incluent que vos compétences réelles pour garantir la crédibilité de votre dossier.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
