"use client";

import { useState } from "react";
import { ATSMatchResult } from "@/lib/api";
import { useAppLanguage } from "@/lib/language-context";
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
  const { t } = useAppLanguage();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[11px] font-mono text-stone-600 dark:text-stone-400">
        <Target className="w-3 h-3 text-stone-500 dark:text-stone-400" />
        <span>ATS...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[10px] font-mono text-stone-500 dark:text-stone-400">
        <span>ATS N/A</span>
      </div>
    );
  }

  const score = match.score;
  const isHigh = score >= 70;
  const isMedium = score >= 40 && score < 70;

  const badgeStyle = isHigh
    ? "backdrop-blur-md bg-emerald-500/15 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-300 border border-emerald-400/50 dark:border-emerald-500/30 shadow-xs ring-1 ring-emerald-500/20 hover:bg-emerald-500/25 dark:hover:bg-emerald-900/50 hover:border-emerald-500/60"
    : isMedium
    ? "backdrop-blur-md bg-amber-500/15 dark:bg-amber-950/40 text-amber-950 dark:text-amber-300 border border-amber-400/50 dark:border-amber-500/30 shadow-xs ring-1 ring-amber-500/20 hover:bg-amber-500/25 dark:hover:bg-amber-900/50 hover:border-amber-500/60"
    : "backdrop-blur-md bg-rose-500/15 dark:bg-rose-950/40 text-rose-950 dark:text-rose-300 border border-rose-400/50 dark:border-rose-500/30 shadow-xs ring-1 ring-rose-500/20 hover:bg-rose-500/25 dark:hover:bg-rose-900/50 hover:border-rose-500/60";

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
        title={t("Cliquer pour voir l'inventaire des compétences et l'audit ATS", "Click to see the skills inventory and the ATS audit")}
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
          className="fixed inset-0 z-50 !mt-0 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 ring-1 ring-stone-900/5 dark:ring-white/10"
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
                    {t(`Alignement ATS : ${score}%`, `ATS match: ${score}%`)}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                    {t(`(${match.matched_skills.length} validées / ${match.total_required} requises)`, `(${match.matched_skills.length} matched / ${match.total_required} required)`)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display mt-2">
                  {t("Inventaire Déterministe des Compétences", "Deterministic Skills Inventory")}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-stone-500 dark:text-stone-400">{t("Niveau de correspondance", "Match level")}</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">{score} / 100</span>
              </div>
              <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${progressBg}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {/* Skills Breakdown */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* 1. Matched Skills */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t(`Présentes sur votre profil (${match.matched_skills.length})`, `Found on your profile (${match.matched_skills.length})`)}</span>
                </div>
                {match.matched_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.matched_skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold font-mono"
                      >
                        <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                        <span>{s}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-stone-400 italic">{t("Aucune correspondance directe détectée.", "No direct match detected.")}</p>
                )}
              </div>

              {/* 2. Transferable Skills */}
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{t(`Compétences proches ou transférables (${match.transferable_skills.length})`, `Related or transferable skills (${match.transferable_skills.length})`)}</span>
                </div>
                {match.transferable_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.transferable_skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold font-mono"
                      >
                        <Zap className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                        <span>{s}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-stone-400 italic">{t("Aucune compétence transférable identifiée.", "No transferable skills identified.")}</p>
                )}
              </div>

              {/* 3. Missing Skills */}
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>{t(`Compétences à acquérir (${match.missing_skills.length})`, `Skills to acquire (${match.missing_skills.length})`)}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold">
                    <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    {t("Non inventées", "Never invented")}
                  </span>
                </div>
                {match.missing_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.missing_skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100/70 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-semibold font-mono"
                      >
                        <X className="w-3 h-3 text-rose-700 dark:text-rose-400" />
                        <span>{s}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-stone-400 italic">{t("Toutes les compétences requises sont couvertes !", "All required skills are covered!")}</p>
                )}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {t("Ce score évalue la compatibilité entre votre profil et les attentes du recruteur. Vos candidatures n'incluent que vos compétences réelles pour garantir la crédibilité de votre dossier.", "This score assesses how well your profile matches the recruiter's expectations. Your applications only include your real skills to keep your file credible.")}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
