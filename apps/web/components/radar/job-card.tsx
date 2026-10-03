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
  CheckCircle2,
  Coins,
  Send,
} from "lucide-react";

interface JobCardProps {
  job: JobOffer;
  atsMatch?: ATSMatchResult;
  atsLoading?: boolean;
  onArchive: (id: string) => void;
  onOpenMirror?: (job: JobOffer) => void;
  onToggleMarkApplied?: (jobId: string, isApplied: boolean) => void;
  isAppliedSection?: boolean;
  isNew?: boolean;
}

const PLATFORM_CONFIG: Record<string, { label: string; className: string }> = {
  top100_enterprises: {
    label: "Portail Officiel",
    className: "bg-amber-50 text-amber-900 border-amber-300 font-semibold",
  },
  linkedin: {
    label: "LinkedIn",
    className: "bg-blue-50 text-blue-800 border-blue-200 font-semibold",
  },
  keejob: {
    label: "Keejob",
    className: "bg-indigo-50 text-indigo-800 border-indigo-200 font-semibold",
  },
  tunisietravail: {
    label: "TunisieTravail",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold",
  },
  tanitjobs: {
    label: "Tanitjobs",
    className: "bg-amber-50 text-amber-800 border-amber-200 font-semibold",
  },
  wttj: {
    label: "Welcome Jungle",
    className: "bg-yellow-50 text-yellow-900 border-yellow-300 font-semibold",
  },
  "1jeune1solution": {
    label: "1j1s",
    className: "bg-cyan-50 text-cyan-800 border-cyan-200 font-semibold",
  },
  jobteaser: {
    label: "Jobteaser",
    className: "bg-teal-50 text-teal-800 border-teal-200 font-semibold",
  },
  emploitunisie: {
    label: "EmploiTunisie",
    className: "bg-blue-50 text-blue-800 border-blue-200 font-semibold",
  },
  stagetunisie: {
    label: "StageTunisie",
    className: "bg-rose-50 text-rose-800 border-rose-200 font-semibold",
  },
  optioncarriere: {
    label: "OptionCarriere",
    className: "bg-orange-50 text-orange-800 border-orange-200 font-semibold",
  },
  aneti: {
    label: "ANETI",
    className: "bg-red-50 text-red-800 border-red-200 font-semibold",
  },
  hellowork: {
    label: "HelloWork",
    className: "bg-violet-50 text-violet-800 border-violet-200 font-semibold",
  },
  indeed: {
    label: "Indeed",
    className: "bg-sky-50 text-sky-800 border-sky-200 font-semibold",
  },
  apec: {
    label: "Apec",
    className: "bg-indigo-50 text-indigo-900 border-indigo-200 font-semibold",
  },
  moovijob: {
    label: "Moovijob",
    className: "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200 font-semibold",
  },
  esn_direct: {
    label: "Portails ESN",
    className: "bg-amber-50 text-amber-900 border-amber-300 font-semibold",
  },
  monster: {
    label: "Monster",
    className: "bg-purple-50 text-purple-900 border-purple-200 font-semibold",
  },
  stagiaires_fr: {
    label: "Stagiaires.fr",
    className: "bg-pink-50 text-pink-900 border-pink-200 font-semibold",
  },
  cadremploi: {
    label: "Cadremploi",
    className: "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold",
  },
  meteojob: {
    label: "Meteojob",
    className: "bg-sky-50 text-sky-900 border-sky-200 font-semibold",
  },
  letudiant: {
    label: "L'Etudiant",
    className: "bg-rose-50 text-rose-900 border-rose-200 font-semibold",
  },
  chooseyourboss: {
    label: "ChooseYourBoss",
    className: "bg-lime-50 text-lime-900 border-lime-300 font-semibold",
  },
  stackoverflow_jobs: {
    label: "StackOverflow",
    className: "bg-orange-50 text-orange-900 border-orange-300 font-semibold",
  },
  numeum: {
    label: "Numeum",
    className: "bg-indigo-50 text-indigo-900 border-indigo-200 font-semibold",
  },
  capdigital: {
    label: "Cap Digital",
    className: "bg-teal-50 text-teal-900 border-teal-200 font-semibold",
  },
  offre_emploi_tn: {
    label: "Offre-Emploi.tn",
    className: "bg-amber-50 text-amber-900 border-amber-300 font-semibold",
  },
};

export function JobCard({
  job,
  atsMatch,
  atsLoading = false,
  onArchive,
  onOpenMirror,
  onToggleMarkApplied,
  isAppliedSection = false,
  isNew = false,
}: JobCardProps) {
  const platKey = (job.platform || "").toLowerCase();
  const platformInfo = PLATFORM_CONFIG[platKey] || {
    label: job.platform || "Source Externe",
    className: "bg-muted text-muted-foreground border-border/50",
  };

  const isFrance = (job.country || "").toLowerCase() === "france";
  const isTunisia = (job.country || "").toLowerCase() === "tunisie";
  const countryLabel = isFrance ? "France" : isTunisia ? "Tunisie" : job.country || "France";

  const isJob =
    job.offer_type === "JOB" ||
    (!job.offer_type && /\b(cdi|cdd|job|emploi)\b/i.test(job.title || ""));
  const contractLabel = isJob ? "Job" : "Stage";

  const isApplied = Boolean(
    job.is_applied ||
      job.status === "SUBMITTED" ||
      job.status === "INTERVIEW" ||
      job.status === "OFFER"
  );

  // Nettoyage localisation pour ne pas répéter le pays
  const cleanLocation = useMemo(() => {
    if (!job.location) return "";
    let loc = job.location.trim();
    const cName = isFrance ? "france" : isTunisia ? "tunisie" : (job.country || "").toLowerCase();
    if (cName && loc.toLowerCase() === cName) return "";
    if (cName) {
      loc = loc.replace(new RegExp(`[,\\s-]+${cName}$`, "i"), "").trim();
    }
    return loc;
  }, [job.location, job.country, isFrance, isTunisia]);

  // Calcul de la date de publication
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

  // Parsing des compétences
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
      className={`group relative p-5 rounded-2xl border transition-all duration-200 hover:shadow-artisan-card flex flex-col justify-between ${
        isApplied
          ? "bg-emerald-50/20 border-emerald-300/80 shadow-xs"
          : isNew
          ? "bg-white border-primary shadow-artisan-button ring-1 ring-primary/40"
          : "bg-white border-stone-200 hover:border-stone-300 shadow-artisan"
      }`}
    >
      <div className="space-y-3.5">
        {/* Top Badges Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 1. Source d'où on l'a scrappé */}
            {job.is_direct_career_site ? (
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1 shadow-xs">
                <Building2 className="w-3 h-3" />
                <span>Site Officiel</span>
              </span>
            ) : (
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${platformInfo.className}`}
              >
                {platformInfo.label}
              </span>
            )}

            {/* 2. Pays : France / Tunisie une seule fois */}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              {countryLabel}
            </span>

            {/* 3. Stage ou Job une seule fois */}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                contractLabel === "Job"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {contractLabel}
            </span>

            {job.contract_duration && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/30 text-secondary-foreground border border-border/40">
                {job.contract_duration}
              </span>
            )}

            {isApplied && (
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>Postulé</span>
              </span>
            )}
          </div>

          {/* ATS Badge & Date de publication */}
          <div className="flex items-center gap-2">
            <AtsScoreBadge match={atsMatch} loading={atsLoading} />
            <div
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full border border-border/30"
              title={
                job.published_at
                  ? `Publié le ${new Date(job.published_at).toLocaleDateString("fr-FR")}`
                  : "Date de collecte"
              }
            >
              <Clock className="w-3 h-3 text-muted-foreground/70" />
              <span>{relativeTime}</span>
            </div>
          </div>
        </div>

        {/* Titre de l'offre */}
        <div>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {job.title}
          </h3>

          {/* Entreprise & Localisation une seule fois */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              {job.company}
            </span>
            {cleanLocation && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  {cleanLocation}
                </span>
              </>
            )}
            {job.salary_stipend && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <Coins className="w-3 h-3 text-emerald-600" />
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
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200 hover:border-orange-300 transition-colors"
              >
                {skill}
              </span>
            ))}
            {skillsList.length > 5 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-stone-100/60 text-stone-500">
                +{skillsList.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Description snippet */}
        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
          {job.description_raw}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="pt-3.5 mt-3 border-t border-stone-100 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onArchive(job.id)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Archiver cette offre"
            >
              <Archive className="w-4 h-4" />
            </button>

            {(job.apply_url || job.url) && (
              <a
                href={job.apply_url || job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors inline-flex items-center gap-1 text-xs"
                title="Ouvrir l'annonce officielle"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {onToggleMarkApplied && (
            <button
              type="button"
              onClick={() => onToggleMarkApplied(job.id, !isApplied)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isApplied
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300"
                  : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
              }`}
              title={
                isApplied
                  ? "Cliquer pour réintégrer l'offre"
                  : "Marquer comme déjà postulé"
              }
            >
              {isApplied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Déjà postulé</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span>J'ai postulé</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Bouton Préparer les documents de l'offre (Principal) */}
        <button
          type="button"
          onClick={() => onOpenMirror?.(job)}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all tactile-button shadow-artisan-button cursor-pointer ${
            isApplied
              ? "bg-stone-800 hover:bg-stone-900 text-white"
              : "bg-primary hover:bg-primary-hover text-white"
          }`}
          title="Ouvrir l'analyse profonde et préparer les documents de l'offre"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Préparer les documents de l'offre</span>
        </button>
      </div>
    </div>
  );
}
