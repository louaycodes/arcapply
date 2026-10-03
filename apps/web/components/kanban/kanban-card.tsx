"use client";

import { useMemo } from "react";
import { JobOffer, ATSMatchResult } from "@/lib/api";
import {
  Building2,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Trophy,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
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
  const isLinkedIn = job.platform.toLowerCase() === "linkedin";

  // Calcul du délai pour alerte relance (> 7 jours)
  const diffDays = useMemo(() => {
    const rawDate = job.published_at || job.collected_at;
    if (!rawDate) return 0;
    const date = new Date(rawDate);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }, [job.published_at, job.collected_at]);

  const isRelanceDue = job.status === "SUBMITTED" && diffDays >= 7;

  return (
    <div className="group relative p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-all duration-200 shadow-artisan hover:shadow-artisan-card space-y-3">
      {/* Top badges */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
              isLinkedIn
                ? "bg-blue-50 text-blue-800 border-blue-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            {isLinkedIn ? "LinkedIn" : "Jobteaser"}
          </span>
          <span className="text-[10px] text-stone-500 font-medium">
            {job.country === "France" ? "FR" : job.country === "Tunisie" ? "TN" : job.country || ""}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {atsMatch && (
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                atsMatch.score >= 75
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : atsMatch.score >= 50
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              ATS {atsMatch.score}%
            </span>
          )}
        </div>
      </div>

      {/* Relance alert badge if submitted > 7 days */}
      {isRelanceDue && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-300 text-[10px] font-semibold text-amber-900 shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-700" />
          <span>Relance due (J+{diffDays})</span>
        </div>
      )}

      {/* Title & Company */}
      <div>
        <h4 className="text-xs font-bold text-stone-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug font-display">
          {job.title}
        </h4>
        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-stone-500">
          <span className="font-semibold text-stone-800 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-stone-400" />
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
      <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-1 text-[11px]">
        <button
          type="button"
          onClick={() => onOpenMirror(job)}
          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors flex items-center gap-1 cursor-pointer"
          title="Ouvrir la vue miroir de révision"
        >
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-semibold hidden sm:inline">Miroir</span>
        </button>

        {/* Status contextual actions */}
        <div className="flex items-center gap-1">
          {job.status === "DISCOVERED" && (
            <button
              type="button"
              disabled={isTransitioning}
              onClick={() => onTransition(job.id, "REVIEWING")}
              className="px-2 py-1 rounded-lg bg-orange-50 hover:bg-primary text-primary hover:text-white border border-orange-200 text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>Préparer</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}

          {job.status === "REVIEWING" && (
            <button
              type="button"
              disabled={isTransitioning}
              onClick={() => onTransition(job.id, "READY")}
              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>Valider</span>
              <CheckCircle2 className="w-3 h-3" />
            </button>
          )}

          {job.status === "READY" && (
            <button
              type="button"
              onClick={() => onOpenMirror(job)}
              className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white text-[10px] font-bold flex items-center gap-1 shadow-artisan-button tactile-button transition-all cursor-pointer"
            >
              <span>Finaliser</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {job.status === "SUBMITTED" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={isTransitioning}
                onClick={() => onTransition(job.id, "INTERVIEW")}
                className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-600 text-sky-800 hover:text-white border border-sky-200 text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                title="Marquer comme entretien décroché"
              >
                <span>Entretien</span>
              </button>
              <button
                type="button"
                disabled={isTransitioning}
                onClick={() => onTransition(job.id, "REJECTED")}
                className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                title="Marquer comme non retenu"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {job.status === "INTERVIEW" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={isTransitioning}
                onClick={() => onTransition(job.id, "OFFER")}
                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                title="Offre de stage reçue !"
              >
                <Trophy className="w-3 h-3 text-emerald-600" />
                <span>Offre reçue</span>
              </button>
              <button
                type="button"
                disabled={isTransitioning}
                onClick={() => onTransition(job.id, "REJECTED")}
                className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                title="Non retenu après entretien"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {job.status === "OFFER" && (
            <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Trophy className="w-3 h-3 text-emerald-600" />
              <span>Gagné</span>
            </span>
          )}

          {job.status === "REJECTED" && (
            <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
              Classé
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
