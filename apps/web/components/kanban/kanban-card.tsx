"use client";

import { useMemo } from "react";
import { JobOffer, ATSMatchResult } from "@/lib/api";
import {
  Building2,
  Sparkles,
  Trophy,
  XCircle,
  AlertTriangle,
  Send,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface KanbanCardProps {
  job: JobOffer;
  atsMatch?: ATSMatchResult;
  onOpenMirror: (job: JobOffer) => void;
  onTransition: (jobId: string, newStatus: string) => Promise<void>;
  isTransitioning?: boolean;
}

export function KanbanCard({
  job,
  atsMatch,
  onOpenMirror,
  onTransition,
  isTransitioning = false,
}: KanbanCardProps) {
  const isLinkedIn = (job.platform || "").toLowerCase() === "linkedin";

  // Calcul du délai pour alerte relance (> 7 jours pour les candidatures envoyées)
  const diffDays = useMemo(() => {
    const rawDate = job.applied_at || job.published_at || job.collected_at;
    if (!rawDate) return 0;
    const date = new Date(rawDate);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }, [job.applied_at, job.published_at, job.collected_at]);

  const isRelanceDue = (job.status === "SUBMITTED" || job.status === "INTERVIEW") && diffDays >= 7;

  return (
    <div className="group relative p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700 transition-all duration-200 shadow-artisan hover:shadow-artisan-card space-y-3">
      {/* Top badges */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
              isLinkedIn
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
            }`}
          >
            {isLinkedIn ? "LinkedIn" : job.platform || "Source"}
          </span>
          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
            {job.country === "France" ? "FR" : job.country === "Tunisie" ? "TN" : job.country || ""}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {atsMatch && (
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                atsMatch.score >= 75
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                  : atsMatch.score >= 50
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
              }`}
            >
              ATS {atsMatch.score}%
            </span>
          )}
        </div>
      </div>

      {/* Relance alert badge if submitted > 7 days */}
      {isRelanceDue && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-[10px] font-semibold text-amber-900 dark:text-amber-300 shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
          <span>Relance conseillée (J+{diffDays})</span>
        </div>
      )}

      {/* Title & Company */}
      <div>
        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-primary transition-colors line-clamp-2 leading-snug font-display">
          {job.title}
        </h4>
        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-stone-500 dark:text-stone-400">
          <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-stone-400 dark:text-stone-500" />
            {job.company}
          </span>
          {job.location && (
            <>
              <span>•</span>
              <span className="truncate max-w-[120px]">{job.location}</span>
            </>
          )}
        </div>
      </div>

      {/* Bottom actions & Contextual transition */}
      <div className="pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-1 text-[11px]">
        <button
          type="button"
          onClick={() => onOpenMirror(job)}
          className="p-1.5 rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 cursor-pointer"
          title="Ouvrir l'analyse profonde et les documents"
        >
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-semibold">Analyse</span>
        </button>

        {/* 4-Column Contextual Transitions */}
        <div className="flex items-center gap-1">
          {/* Colonne 1 : OFFRES (DISCOVERED / REVIEWING / READY) */}
          {(job.status === "DISCOVERED" || job.status === "REVIEWING" || job.status === "READY") && (
            <button
              type="button"
              disabled={isTransitioning}
              onClick={() => onTransition(job.id, "SUBMITTED")}
              className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 hover:bg-primary text-primary hover:text-white border border-orange-200 dark:border-orange-800/60 text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
              title="Marquer comme candidature envoyée"
            >
              <Send className="w-3 h-3" />
              <span>Envoyée</span>
            </button>
          )}

          {/* Colonne 2 : CANDIDATURES ENVOYÉES (SUBMITTED / INTERVIEW) */}
          {(job.status === "SUBMITTED" || job.status === "INTERVIEW") && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={isTransitioning}
                onClick={() => onTransition(job.id, "OFFER")}
                className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 text-emerald-800 dark:text-emerald-300 hover:text-white border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                title="Candidature retenue !"
              >
                <Trophy className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Retenue</span>
              </button>
              <button
                type="button"
                disabled={isTransitioning}
                onClick={() => onTransition(job.id, "REJECTED")}
                className="p-1 rounded-lg text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50 cursor-pointer"
                title="Non retenue"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Colonne 3 : RETENUE (OFFER) */}
          {job.status === "OFFER" && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800/60">
                <Trophy className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Retenue</span>
              </span>
              <button
                type="button"
                disabled={isTransitioning}
                onClick={() => onTransition(job.id, "SUBMITTED")}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors cursor-pointer"
                title="Remettre en candidatures envoyées"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Colonne 4 : NON RETENUE (REJECTED) */}
          {job.status === "REJECTED" && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                <span>Non retenue</span>
              </span>
              <button
                type="button"
                disabled={isTransitioning}
                onClick={() => onTransition(job.id, "SUBMITTED")}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors cursor-pointer"
                title="Remettre en candidatures envoyées"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
