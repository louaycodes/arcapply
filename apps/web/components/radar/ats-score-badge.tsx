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
    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
    : isMedium
    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300"
    : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 hover:border-rose-300";

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
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold transition-all cursor-pointer shadow-sm ${badgeStyle}`}
        title="Cliquer pour voir l'inventaire des compétences et l'audit ATS"
      >
        <span
          className="w-2 h-2 rounded-full mr-1 shrink-0"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
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
                <span className="text-stone-500">Adéquation mathématique</span>
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
                  <span>Validées dans votre Master Profile ({match.matched_skills.length})</span>
                </div>
                {match.matched_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.matched_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-semibold font-mono"
                      >
                        ✓ {s}
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
                  <span>Transférables / Proximité Sémantique (0.6x) ({match.transferable_skills.length})</span>
                </div>
                {match.transferable_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.transferable_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md bg-amber-100/70 border border-amber-300 text-amber-900 text-xs font-semibold font-mono"
                      >
                        ⚡ {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic">Aucune compétence transférable identifiée.</p>
                )}
              </div>

              {/* 3. Missing Skills (Strict Zero Hallucination Quarantine) */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Compétences Manquantes ({match.missing_skills.length})</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 font-semibold">
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    Zéro-Hallucination
                  </span>
                </div>
                {match.missing_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.missing_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md bg-rose-100/70 border border-rose-300 text-rose-900 text-xs font-semibold font-mono"
                      >
                        ✕ {s}
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
                Ce score est calculé déterministement selon la formule :
                <code className="text-stone-900 font-mono ml-1 font-semibold">
                  (validées + 0.6 × transférables) / total
                </code>
                . Aucune compétence manquante ne sera inventée dans vos livrables.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
