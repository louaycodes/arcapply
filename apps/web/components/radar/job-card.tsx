"use client";

import { JobOffer, ATSMatchResult } from "@/lib/api";
import { AtsScoreBadge } from "./ats-score-badge";
import {
  Building2,
  MapPin,
  ExternalLink,
  Archive,
  Sparkles,
  Clock,
  ArrowRight,
  Mail,
} from "lucide-react";

interface JobCardProps {
  job: JobOffer;
  atsMatch?: ATSMatchResult;
  atsLoading?: boolean;
  onArchive: (id: string) => void;
  onOpenCV?: (job: JobOffer) => void;
  onOpenLetter?: (job: JobOffer) => void;
  isNew?: boolean;
}

export function JobCard({
  job,
  atsMatch,
  atsLoading = false,
  onArchive,
  onOpenCV,
  onOpenLetter,
  isNew = false,
}: JobCardProps) {
  const isLinkedIn = job.platform.toLowerCase() === "linkedin";
  const isFrance = job.country.toLowerCase() === "france";
  const isTunisia = job.country.toLowerCase() === "tunisie";

  const formattedDate = new Date(job.collected_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`group relative p-5 rounded-xl border bg-card/90 transition-all duration-200 hover:shadow-xl hover:border-border/90 flex flex-col justify-between ${
        isNew
          ? "border-primary/60 shadow-lg shadow-primary/10 ring-1 ring-primary/40 animate-pulse"
          : "border-border/70"
      }`}
    >
      <div className="space-y-3">
        {/* Top Badges Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                isLinkedIn
                  ? "bg-[#0A66C2]/15 text-[#70B5F9] border-[#0A66C2]/30"
                  : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {isLinkedIn ? "LinkedIn" : "Jobteaser"}
            </span>

            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
              {isFrance ? "🇫🇷 France" : isTunisia ? "🇹🇳 Tunisie" : job.country}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <AtsScoreBadge match={atsMatch} loading={atsLoading} />
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Title & Company */}
        <div>
          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {job.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              {job.company}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              {job.location || job.country}
            </span>
          </div>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {job.description_raw}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="pt-4 mt-3 border-t border-border/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onArchive(job.id)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Archiver cette offre (Touche x)"
          >
            <Archive className="w-4 h-4" />
          </button>

          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Voir l'annonce source"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenLetter?.(job)}
            className="px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Rédiger une lettre de motivation sobre"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lettre</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCV?.(job)}
            className="px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-transparent text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <span>CV</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
