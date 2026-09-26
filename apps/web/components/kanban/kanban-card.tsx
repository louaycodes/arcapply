"use client";

import { JobOffer, ATSMatchResult } from "@/lib/api";
import { AtsScoreBadge } from "../radar/ats-score-badge";
import {
  Building2,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trophy,
  Loader2,
  ArrowRight,
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
  const updatedDate = new Date(job.updated_at || job.collected_at);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isRelanceDue = job.status === "SUBMITTED" && diffDays >= 7;

  return (
    <div className="group relative p-3.5 rounded-xl border border-border/80 bg-card/95 hover:border-border transition-all duration-200 hover:shadow-lg space-y-3">
      {/* Top badges */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full border ${
              isLinkedIn
                ? "bg-[#0A66C2]/15 text-[#70B5F9] border-[#0A66C2]/30"
                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
            }`}
          >
            {isLinkedIn ? "LI" : "JT"}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {job.country === "France" ? "🇫🇷" : job.country === "Tunisie" ? "🇹🇳" : ""}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {atsMatch && (
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                atsMatch.score >= 75
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : atsMatch.score >= 50
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}
            >
              ATS {atsMatch.score}%
            </span>
          )}
        </div>
      </div>

      {/* Relance alert badge if submitted > 7 days */}
      {isRelanceDue && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-[10px] font-semibold text-amber-400 animate-pulse">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Relance due (J+{diffDays})</span>
        </div>
      )}

      {/* Title & Company */}
      <div>
        <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {job.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Building2 className="w-3 h-3 text-muted-foreground" />
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
      <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-1 text-[11px]">
        <button
          type="button"
          onClick={() => onOpenMirror(job)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
          title="Ouvrir la vue miroir de révision"
        >
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium hidden sm:inline">Miroir</span>
        </button>

        {/* Status contextual actions */}
        <div className="flex items-center gap-1">
          {job.status === "DISCOVERED" && (
            <button
              type="button"
              disabled={isTransitioning}
              onClick={() => onTransition(job.id, "REVIEWING")}
              className="px-2 py-1 rounded-md bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <span>Réviser</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}

          {job.status === "REVIEWING" && (
            <button
              type="button"
              disabled={isTransitioning}
              onClick={() => onTransition(job.id, "READY")}
              className="px-2 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <span>Valider Prêt</span>
              <CheckCircle2 className="w-3 h-3" />
            </button>
          )}

          {job.status === "READY" && (
            <button
              type="button"
              onClick={() => onOpenMirror(job)}
              className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              <span>Soumettre (5s)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {job.status === "SUBMITTED" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={isTransitioning}
                onClick={() => onTransition(job.id, "INTERVIEW")}
                className="px-2 py-1 rounded-md bg-sky-500/15 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/30 text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                title="Marquer comme entretien décroché"
              >
                <span>Entretien 🎉</span>
              </button>
              <button
                type="button"
                disabled={isTransitioning}
                onClick={() => onTransition(job.id, "REJECTED")}
                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                title="Consigner un refus"
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
                className="px-2 py-1 rounded-md bg-green-500/20 hover:bg-green-500 text-green-300 hover:text-white border border-green-500/40 text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                title="Offre de stage reçue !"
              >
                <Trophy className="w-3 h-3" />
                <span>Offre reçue</span>
              </button>
              <button
                type="button"
                disabled={isTransitioning}
                onClick={() => onTransition(job.id, "REJECTED")}
                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                title="Non retenu après entretien"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {job.status === "OFFER" && (
            <span className="text-[10px] font-bold text-green-400 flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>Gagné</span>
            </span>
          )}

          {job.status === "REJECTED" && (
            <span className="text-[10px] font-medium text-muted-foreground">
              Classé
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
