"use client";

import { useMemo } from "react";
import { JobOffer, ATSMatchResult } from "@/lib/api";
import { AtsScoreBadge } from "./ats-score-badge";
import {
  Building2,
  MapPin,
  ExternalLink,
  Archive,
  Sparkles,
  Clock,
  Mail,
  CheckCircle2,
  Briefcase,
  Layers,
  Laptop,
  Coins,
  Send,
} from "lucide-react";

interface JobCardProps {
  job: JobOffer;
  atsMatch?: ATSMatchResult;
  atsLoading?: boolean;
  onArchive: (id: string) => void;
  onOpenCV?: (job: JobOffer) => void;
  onOpenLetter?: (job: JobOffer) => void;
  onOpenMirror?: (job: JobOffer) => void;
  isNew?: boolean;
}

const PLATFORM_CONFIG: Record<string, { label: string; className: string }> = {
  top100_enterprises: {
    label: "🏢 Portail Officiel",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  },
  linkedin: {
    label: "LinkedIn",
    className: "bg-[#0A66C2]/15 text-[#70B5F9] border-[#0A66C2]/30",
  },
  keejob: {
    label: "Keejob",
    className: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  },
  tunisietravail: {
    label: "TunisieTravail",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  tanitjobs: {
    label: "Tanitjobs",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  wttj: {
    label: "Welcome Jungle",
    className: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  },
  "1jeune1solution": {
    label: "1j1s",
    className: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  },
  jobteaser: {
    label: "Jobteaser",
    className: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  },
  emploitunisie: {
    label: "EmploiTunisie",
    className: "bg-blue-600/15 text-blue-400 border-blue-600/30",
  },
  stagetunisie: {
    label: "StageTunisie",
    className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
  optioncarriere: {
    label: "OptionCarriere",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  aneti: {
    label: "ANETI",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  hellowork: {
    label: "HelloWork",
    className: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  },
  indeed: {
    label: "Indeed",
    className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  apec: {
    label: "Apec",
    className: "bg-indigo-600/15 text-indigo-300 border-indigo-600/30",
  },
  moovijob: {
    label: "Moovijob",
    className: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  },
  esn_direct: {
    label: "Portails ESN",
    className: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  },
  monster: {
    label: "Monster",
    className: "bg-purple-600/15 text-purple-300 border-purple-600/30",
  },
  stagiaires_fr: {
    label: "Stagiaires.fr",
    className: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  },
  cadremploi: {
    label: "Cadremploi",
    className: "bg-emerald-600/15 text-emerald-300 border-emerald-600/30",
  },
  meteojob: {
    label: "Meteojob",
    className: "bg-sky-600/15 text-sky-300 border-sky-600/30",
  },
  letudiant: {
    label: "L'Etudiant",
    className: "bg-rose-600/15 text-rose-300 border-rose-600/30",
  },
  chooseyourboss: {
    label: "ChooseYourBoss",
    className: "bg-lime-500/15 text-lime-300 border-lime-500/30",
  },
  stackoverflow_jobs: {
    label: "StackOverflow",
    className: "bg-orange-600/15 text-orange-300 border-orange-600/30",
  },
  numeum: {
    label: "Numeum",
    className: "bg-indigo-400/15 text-indigo-300 border-indigo-400/30",
  },
  capdigital: {
    label: "Cap Digital",
    className: "bg-teal-600/15 text-teal-300 border-teal-600/30",
  },
  offre_emploi_tn: {
    label: "Offre-Emploi.tn",
    className: "bg-amber-600/15 text-amber-300 border-amber-600/30",
  },
};

export function JobCard({
  job,
  atsMatch,
  atsLoading = false,
  onArchive,
  onOpenCV,
  onOpenLetter,
  onOpenMirror,
  isNew = false,
}: JobCardProps) {
  const platKey = job.platform.toLowerCase();
  const platformInfo = PLATFORM_CONFIG[platKey] || {
    label: job.platform,
    className: "bg-muted text-muted-foreground border-border/50",
  };
  const isFrance = job.country.toLowerCase() === "france";
  const isTunisia = job.country.toLowerCase() === "tunisie";

  // Calcul du temps relatif ergonomique (sans format rigide)
  const relativeTime = useMemo(() => {
    const rawDate = job.published_at || job.collected_at;
    if (!rawDate) return "Récemment";
    const date = new Date(rawDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 2) return "À l'instant";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    const weeks = Math.floor(diffDays / 7);
    return `Il y a ${weeks} sem.`;
  }, [job.published_at, job.collected_at]);

  // Parsing sécurisé des compétences
  const skillsList: string[] = useMemo(() => {
    if (!job.skills_required) return [];
    try {
      const parsed = JSON.parse(job.skills_required);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [job.skills_required]);

  return (
    <div
      className={`group relative p-5 rounded-xl border bg-card/95 transition-all duration-200 hover:shadow-lg hover:border-border/90 flex flex-col justify-between ${
        isNew
          ? "border-primary/60 shadow-md shadow-primary/10 ring-1 ring-primary/40"
          : "border-border/70 hover:border-border"
      }`}
    >
      <div className="space-y-3.5">
        {/* Top Badges Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {job.is_direct_career_site ? (
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-300 border-amber-500/30 flex items-center gap-1 shadow-xs">
                <span>🏢</span>
                <span>Site Officiel</span>
              </span>
            ) : (
              <span
                className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${platformInfo.className}`}
              >
                {platformInfo.label}
              </span>
            )}

            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border/40">
              {isFrance ? "🇫🇷 France" : isTunisia ? "🇹🇳 Tunisie" : job.country}
            </span>

            {job.offer_type && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  job.offer_type === "JOB"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                }`}
              >
                {job.offer_type === "JOB" ? "Emploi" : "PFE"}
              </span>
            )}

            {job.contract_duration && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/30 text-secondary-foreground border border-border/40">
                {job.contract_duration}
              </span>
            )}

            {job.status === "REVIEWING" && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                En révision
              </span>
            )}
            {job.status === "READY" && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Prêt
              </span>
            )}
            {job.status === "SUBMITTED" && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Soumis
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <AtsScoreBadge match={atsMatch} loading={atsLoading} />
            <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full border border-border/30">
              <Clock className="w-3 h-3 text-muted-foreground/70" />
              <span>{relativeTime}</span>
            </div>
          </div>
        </div>

        {/* Title & Company */}
        <div>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {job.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              {job.company}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              {job.location || job.country}
            </span>
            {job.work_mode && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-primary/80 font-medium">
                  <Laptop className="w-3 h-3" />
                  {job.work_mode}
                </span>
              </>
            )}
            {job.salary_stipend && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Coins className="w-3 h-3" />
                  {job.salary_stipend}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tech Skills Chips */}
        {skillsList.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {skillsList.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted/60 text-foreground/90 border border-border/60 hover:border-primary/40 transition-colors"
              >
                {skill}
              </span>
            ))}
            {skillsList.length > 5 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-muted/30 text-muted-foreground">
                +{skillsList.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Description snippet */}
        <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
          {job.description_raw}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="pt-3.5 mt-3 border-t border-border/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onArchive(job.id)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Archiver cette offre"
          >
            <Archive className="w-4 h-4" />
          </button>

          {(job.apply_url || job.url) && (
            <a
              href={job.apply_url || job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1 text-xs"
              title="Ouvrir l'annonce officielle"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenLetter?.(job)}
            className="px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            title="Rédiger une lettre de motivation sobre"
          >
            <Mail className="w-3.5 h-3.5 text-primary/80" />
            <span>Lettre</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCV?.(job)}
            className="px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            title="Aperçu du CV ciblé ATS"
          >
            <span>CV</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenMirror?.(job)}
            className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Ouvrir la vue miroir de révision et déclencher la soumission assistée"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Postuler</span>
          </button>
        </div>
      </div>
    </div>
  );
}
