"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchJobs,
  fetchProfile,
  crawlAllSources,
  archiveJob,
  clearAllJobs,
  createRadarEventSource,
  fetchBatchATSScores,
  fetchJobATSScore,
  JobOffer,
  ATSMatchResult,
} from "@/lib/api";
import { JobCard } from "@/components/radar/job-card";
import { CVPreviewModal } from "@/components/radar/cv-preview-modal";
import { LetterPreviewModal } from "@/components/radar/letter-preview-modal";
import { MirrorReviewDrawer } from "@/components/radar/mirror-review-drawer";
import {
  Radar,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Play,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  GraduationCap,
  Briefcase,
  Flame,
  Calendar,
  Clock,
  Building2,
  LayoutGrid,
  ListFilter,
  Laptop,
} from "lucide-react";

const AVAILABLE_PLATFORMS = [
  { id: "top100_enterprises", label: "🏢 Top 100 Firmes IT (Portails Carrières Dédiés)", country: "Global" },
  { id: "linkedin", label: "LinkedIn", country: "Global" },
  { id: "stackoverflow_jobs", label: "StackOverflow Jobs", country: "Global" },
  { id: "keejob", label: "Keejob", country: "Tunisie" },
  { id: "tunisietravail", label: "TunisieTravail", country: "Tunisie" },
  { id: "tanitjobs", label: "Tanitjobs", country: "Tunisie" },
  { id: "emploitunisie", label: "EmploiTunisie", country: "Tunisie" },
  { id: "stagetunisie", label: "StageTunisie", country: "Tunisie" },
  { id: "optioncarriere", label: "OptionCarriere", country: "Tunisie" },
  { id: "aneti", label: "ANETI", country: "Tunisie" },
  { id: "offre_emploi_tn", label: "Offre-Emploi.tn", country: "Tunisie" },
  { id: "wttj", label: "Welcome to the Jungle", country: "France" },
  { id: "1jeune1solution", label: "1jeune1solution", country: "France" },
  { id: "jobteaser", label: "Jobteaser", country: "France" },
  { id: "hellowork", label: "HelloWork", country: "France" },
  { id: "indeed", label: "Indeed", country: "France" },
  { id: "apec", label: "Apec", country: "France" },
  { id: "moovijob", label: "Moovijob", country: "France" },
  { id: "monster", label: "Monster", country: "France" },
  { id: "stagiaires_fr", label: "Stagiaires.fr", country: "France" },
  { id: "cadremploi", label: "Cadremploi", country: "France" },
  { id: "meteojob", label: "Meteojob", country: "France" },
  { id: "letudiant", label: "L'Etudiant", country: "France" },
  { id: "chooseyourboss", label: "ChooseYourBoss", country: "France" },
  { id: "esn_direct", label: "Portails ESN (Capgemini, Sopra...)", country: "France" },
  { id: "numeum", label: "Numeum ESN", country: "France" },
  { id: "capdigital", label: "Cap Digital Tech", country: "France" },
];

export default function RadarPage() {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [atsScores, setAtsScores] = useState<Record<string, ATSMatchResult>>({});
  const [isAtsLoading, setIsAtsLoading] = useState(false);
  const [selectedJobForCV, setSelectedJobForCV] = useState<JobOffer | null>(null);
  const [selectedJobForLetter, setSelectedJobForLetter] = useState<JobOffer | null>(null);
  const [selectedJobForMirror, setSelectedJobForMirror] = useState<JobOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newJobIds, setNewJobIds] = useState<Set<string>>(new Set());

  // Filtres
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "today" | "week" | "month">("all");
  const [directOnly, setDirectOnly] = useState<boolean>(false);
  const [workModeFilter, setWorkModeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");

  const [isCollecting, setIsCollecting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [searchMode, setSearchMode] = useState<"PFE" | "JOB">("PFE");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Formulaire de collecte multi-sources
  const [keywordsInput, setKeywordsInput] = useState<string>("PFE, Ingénieur, Développeur, Cloud, IA");
  const [selectedPlatformsToCrawl, setSelectedPlatformsToCrawl] = useState<string[]>([
    "top100_enterprises",
    "linkedin",
    "keejob",
    "wttj",
    "jobteaser",
    "hellowork",
    "indeed",
  ]);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const data = await fetchJobs({
        country: selectedCountry,
        platform: selectedPlatform,
        period: selectedPeriod,
        direct_only: directOnly,
        search: searchQuery,
      });
      setJobs(data);

      setIsAtsLoading(true);
      fetchBatchATSScores()
        .then((scores) => setAtsScores(scores))
        .catch((err) => console.error("Erreur calcul ATS batch:", err))
        .finally(() => setIsAtsLoading(false));
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Erreur lors de la récupération des offres Radar.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [selectedCountry, selectedPlatform, selectedPeriod, directOnly]);

  useEffect(() => {
    fetchProfile()
      .then((p) => {
        if (p?.search_mode) {
          setSearchMode(p.search_mode);
        }
      })
      .catch((err) => console.error("Erreur chargement mode recherche profil:", err));
  }, []);

  // Écoute SSE en direct
  useEffect(() => {
    const cleanup = createRadarEventSource(
      (newJob) => {
        setJobs((prev) => {
          if (prev.some((j) => j.id === newJob.id)) return prev;
          return [newJob, ...prev];
        });
        setNewJobIds((prev) => new Set(prev).add(newJob.id));
        fetchJobATSScore(newJob.id)
          .then((score) => {
            setAtsScores((prev) => ({ ...prev, [newJob.id]: score }));
          })
          .catch((err) => console.error("Erreur calcul ATS SSE:", err));
        setTimeout(() => {
          setNewJobIds((prev) => {
            const next = new Set(prev);
            next.delete(newJob.id);
            return next;
          });
        }, 8000);
      },
      (progress) => {
        setScrapeMessage(`${progress.platform.toUpperCase()} : ${progress.message}`);
        if (progress.status === "completed") {
          setTimeout(() => setScrapeMessage(null), 4000);
        }
      },
      undefined,
      (statusPayload) => {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === statusPayload.job_id
              ? { ...j, status: statusPayload.new_status }
              : j
          )
        );
        setSelectedJobForMirror((prev) =>
          prev && prev.id === statusPayload.job_id
            ? { ...prev, status: statusPayload.new_status }
            : prev
        );
      },
      undefined,
      () => {
        setJobs([]);
        setAtsScores({});
        setNotification({
          type: "success",
          message: "La base de données des offres a été vidée.",
        });
        setTimeout(() => setNotification(null), 3500);
      }
    );

    return cleanup;
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs();
  };

  const handleArchive = async (id: string) => {
    try {
      setJobs((prev) => prev.filter((j) => j.id !== id));
      await archiveJob(id);
      setNotification({
        type: "success",
        message: "Offre archivée avec succès.",
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Impossible d'archiver l'offre.",
      });
    }
  };

  const handleLaunchCollect = async () => {
    try {
      setIsCollecting(true);
      setShowCollectModal(false);
      setScrapeMessage("Lancement de l'exploration multi-sources & plateformes Top 100 IT...");

      const keywords = keywordsInput
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const summary = await crawlAllSources({
        keywords,
        locations: ["France", "Tunisie"],
        platforms: selectedPlatformsToCrawl.length > 0 ? selectedPlatformsToCrawl : undefined,
      });

      setNotification({
        type: "success",
        message: summary.message || "Collecte multi-sources achevée avec succès.",
      });
      loadJobs();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Erreur pendant la collecte multi-sources.",
      });
    } finally {
      setIsCollecting(false);
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const handleClearAllJobs = async () => {
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir vider toutes les offres de la base de données locale ? Les CVs et lettres générés associés seront également réinitialisés."
    );
    if (!confirmed) return;

    try {
      setIsClearing(true);
      const res = await clearAllJobs();
      setJobs([]);
      setAtsScores({});
      setNotification({
        type: "success",
        message: res.message || "Toutes les offres ont été supprimées avec succès.",
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Erreur lors de la suppression des offres.",
      });
    } finally {
      setIsClearing(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Filtrage local en mémoire (pour recherche instantanée et mode de travail)
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (selectedCountry !== "all" && job.country.toLowerCase() !== selectedCountry.toLowerCase()) {
        return false;
      }
      if (selectedPlatform !== "all" && job.platform.toLowerCase() !== selectedPlatform.toLowerCase()) {
        return false;
      }
      if (directOnly && !job.is_direct_career_site) {
        return false;
      }
      if (workModeFilter !== "all") {
        const mode = (job.work_mode || "").toLowerCase();
        if (workModeFilter === "remote" && !mode.includes("télétravail total") && !mode.includes("remote")) {
          return false;
        }
        if (workModeFilter === "hybrid" && !mode.includes("hybride")) {
          return false;
        }
        if (workModeFilter === "onsite" && !mode.includes("site") && !mode.includes("présentiel")) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = job.title.toLowerCase().includes(q);
        const inCompany = job.company.toLowerCase().includes(q);
        const inLocation = job.location.toLowerCase().includes(q);
        const inSkills = (job.skills_required || "").toLowerCase().includes(q);
        const inDept = (job.department || "").toLowerCase().includes(q);
        return inTitle || inCompany || inLocation || inSkills || inDept;
      }
      return true;
    });
  }, [jobs, selectedCountry, selectedPlatform, directOnly, workModeFilter, searchQuery]);

  // Répartition temporelle pour calcul des métriques et affichage chronologique
  const { todayJobs, weekJobs, olderJobs, countToday, countWeek, countMonth, countDirect } = useMemo(() => {
    const now = new Date().getTime();
    const isWithinHours = (dateStr: string | null | undefined, hours: number) => {
      if (!dateStr) return false;
      const t = new Date(dateStr).getTime();
      return now - t <= hours * 60 * 60 * 1000;
    };

    const today: JobOffer[] = [];
    const week: JobOffer[] = [];
    const older: JobOffer[] = [];

    let cToday = 0;
    let cWeek = 0;
    let cMonth = 0;
    let cDirect = 0;

    for (const j of jobs) {
      const d = j.published_at || j.collected_at;
      if (isWithinHours(d, 24)) cToday++;
      if (isWithinHours(d, 24 * 7)) cWeek++;
      if (isWithinHours(d, 24 * 30)) cMonth++;
      if (j.is_direct_career_site) cDirect++;
    }

    for (const j of filteredJobs) {
      const d = j.published_at || j.collected_at;
      if (isWithinHours(d, 24)) {
        today.push(j);
      } else if (isWithinHours(d, 24 * 7)) {
        week.push(j);
      } else {
        older.push(j);
      }
    }

    return {
      todayJobs: today,
      weekJobs: week,
      olderJobs: older,
      countToday: cToday,
      countWeek: cWeek,
      countMonth: cMonth,
      countDirect: cDirect,
    };
  }, [jobs, filteredJobs]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Radar className="w-6 h-6 text-primary" />
              <span>{searchMode === "JOB" ? "Offres d'Emploi" : "Offres de Stage PFE"}</span>
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-200 flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>En direct</span>
            </span>

            <Link
              href="/profile"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all shadow-xs ${
                searchMode === "JOB"
                  ? "bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100"
                  : "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
              }`}
              title="Changer d'objectif dans votre profil"
            >
              {searchMode === "JOB" ? (
                <>
                  <Briefcase className="w-3.5 h-3.5 text-blue-700" />
                  <span>Mode Emploi (CDI / CDD)</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Mode PFE (Stage Fin d'Études)</span>
                </>
              )}
            </Link>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Détection en temps réel sur les portails dédiés des 100 meilleures firmes IT mondiales (France & Tunisie) et plateformes vérifiées.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearAllJobs}
            disabled={isLoading || isClearing || jobs.length === 0}
            className="px-3 py-2 rounded-lg border border-destructive/20 bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-40 cursor-pointer"
            title="Effacer la liste des offres"
          >
            <Trash2 className={`w-3.5 h-3.5 text-destructive ${isClearing ? "animate-spin" : ""}`} />
            <span className="text-destructive hidden sm:inline">{isClearing ? "Suppression..." : "Vider"}</span>
          </button>

          <button
            type="button"
            onClick={loadJobs}
            disabled={isLoading}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Rafraîchir les offres"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowCollectModal(true)}
            disabled={isCollecting}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs md:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isCollecting ? "animate-spin" : ""}`} />
            <span>{isCollecting ? "Recherche en cours..." : "Rechercher des offres"}</span>
          </button>
        </div>
      </div>

      {/* Scrape Progress Banner (SSE) */}
      {scrapeMessage && (
        <div className="p-3 rounded-xl border border-orange-200 bg-orange-50 text-orange-950 text-xs font-mono flex items-center gap-2.5 shadow-xs">
          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-orange-700" />
          <span>{scrapeMessage}</span>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all shadow-xs font-medium ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-rose-50 border-rose-300 text-rose-950"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 1. Barre Temporelle Intelligente & Métriques de Vélocité */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-muted/40 rounded-xl border border-border/60">
        {/* Onglets temporels */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedPeriod("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPeriod === "all"
                ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Toutes les offres</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
              {jobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod("today")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPeriod === "today"
                ? "bg-orange-100 text-orange-950 font-semibold border border-orange-300 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-700" />
            <span>Aujourd'hui</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-orange-200 text-orange-900 font-bold">
              {countToday}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod("week")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPeriod === "week"
                ? "bg-blue-100 text-blue-950 font-semibold border border-blue-300 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-700" />
            <span>Cette semaine</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-200 text-blue-900 font-bold">
              {countWeek}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPeriod === "month"
                ? "bg-orange-100 text-orange-950 font-semibold border border-orange-300 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Ce mois-ci</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-orange-200 text-orange-900 font-bold">
              {countMonth}
            </span>
          </button>
        </div>

        {/* Bascule de vue (Chronologique vs Grille) */}
        <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-border/60 pt-2 sm:pt-0 sm:pl-3">
          <span className="text-[11px] text-muted-foreground hidden lg:inline">Affichage :</span>
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === "timeline"
                ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Vue groupée par période temporelle"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span className="text-xs">Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === "grid"
                ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Vue Grille fluide"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="text-xs">Grille</span>
          </button>
        </div>
      </div>

      {/* 2. Barre de Filtres Secondaires & Recherche Avancée */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtre Pays */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/40">
            {[
              { id: "all", label: "Tous" },
              { id: "France", label: "🇫🇷 France" },
              { id: "Tunisie", label: "🇹🇳 Tunisie" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCountry(c.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedCountry === c.id
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Filtre Sites Officiels Directs Uniquement */}
          <button
            type="button"
            onClick={() => setDirectOnly((prev) => !prev)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
              directOnly
                ? "bg-amber-100 text-amber-950 border-amber-300 font-semibold shadow-xs"
                : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200/70 hover:text-stone-900"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-700" />
            <span>Portails Officiels Uniquement</span>
            {countDirect > 0 && (
              <span className="text-[10px] font-mono px-1 rounded bg-amber-200 text-amber-900 font-bold">
                {countDirect}
              </span>
            )}
          </button>

          {/* Filtre Modalité de travail */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/40">
            <span className="text-[10px] font-medium text-muted-foreground px-2 flex items-center gap-1">
              <Laptop className="w-3 h-3" />
              Mode :
            </span>
            {[
              { id: "all", label: "Tous" },
              { id: "remote", label: "Remote" },
              { id: "hybrid", label: "Hybride" },
              { id: "onsite", label: "Site" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setWorkModeFilter(m.id)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  workModeFilter === m.id
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Champ de Recherche Live */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Stack, entreprise, pôle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-muted/60 border border-border focus:outline-none focus:border-primary text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors"
          />
        </form>
      </div>

      {/* 3. Zone d'Affichage des Offres */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-muted-foreground">Recherche des opportunités en cours...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-16 rounded-xl border border-dashed border-border bg-card/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto">
            <Radar className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">Aucune offre ne correspond aux critères actifs</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Modifiez vos critères de recherche ou lancez une exploration automatique sur les sites des meilleures entreprises IT.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setShowCollectModal(true)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Lancer une nouvelle collecte
              </button>
            </div>
          </div>
        </div>
      ) : viewMode === "timeline" && selectedPeriod === "all" ? (
        /* Affichage Structuré par Sections Temporelles */
        <div className="space-y-8">
          {/* Section Aujourd'hui */}
          {todayJobs.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-700" />
                  <h2 className="text-sm font-bold text-stone-900 font-display">Aujourd'hui</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 font-semibold border border-orange-200">
                    {todayJobs.length} opportunité(s)
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">Détectées il y a moins de 24 heures</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    atsMatch={atsScores[job.id]}
                    atsLoading={isAtsLoading && !atsScores[job.id]}
                    onArchive={handleArchive}
                    onOpenCV={(j) => setSelectedJobForCV(j)}
                    onOpenLetter={(j) => setSelectedJobForLetter(j)}
                    onOpenMirror={(j) => setSelectedJobForMirror(j)}
                    isNew={newJobIds.has(job.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section Cette Semaine */}
          {weekJobs.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-700" />
                  <h2 className="text-sm font-bold text-stone-900 font-display">Cette Semaine</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-semibold border border-blue-200">
                    {weekJobs.length} opportunité(s)
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">Publiées au cours des 7 derniers jours</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weekJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    atsMatch={atsScores[job.id]}
                    atsLoading={isAtsLoading && !atsScores[job.id]}
                    onArchive={handleArchive}
                    onOpenCV={(j) => setSelectedJobForCV(j)}
                    onOpenLetter={(j) => setSelectedJobForLetter(j)}
                    onOpenMirror={(j) => setSelectedJobForMirror(j)}
                    isNew={newJobIds.has(job.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section Plus Anciennes */}
          {olderJobs.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-bold text-foreground">Plus Anciennes</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold border border-border/50">
                    {olderJobs.length} offre(s)
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">Publiées il y a plus d'une semaine</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {olderJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    atsMatch={atsScores[job.id]}
                    atsLoading={isAtsLoading && !atsScores[job.id]}
                    onArchive={handleArchive}
                    onOpenCV={(j) => setSelectedJobForCV(j)}
                    onOpenLetter={(j) => setSelectedJobForLetter(j)}
                    onOpenMirror={(j) => setSelectedJobForMirror(j)}
                    isNew={newJobIds.has(job.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Affichage Grille Standard (ou période ciblée) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              atsMatch={atsScores[job.id]}
              atsLoading={isAtsLoading && !atsScores[job.id]}
              onArchive={handleArchive}
              onOpenCV={(j) => setSelectedJobForCV(j)}
              onOpenLetter={(j) => setSelectedJobForLetter(j)}
              onOpenMirror={(j) => setSelectedJobForMirror(j)}
              isNew={newJobIds.has(job.id)}
            />
          ))}
        </div>
      )}

      {/* Collect Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Radar className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-stone-900 font-display">Recherche d'opportunités</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCollectModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer p-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Métiers et compétences recherchés
                </label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted/60 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  placeholder="ex: PFE, Ingénieur, Cloud, Python, DevOps"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Séparés par des virgules.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Sources prioritaires ({selectedPlatformsToCrawl.length}/{AVAILABLE_PLATFORMS.length} actives)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPlatformsToCrawl.length === AVAILABLE_PLATFORMS.length) {
                        setSelectedPlatformsToCrawl([]);
                      } else {
                        setSelectedPlatformsToCrawl(AVAILABLE_PLATFORMS.map((p) => p.id));
                      }
                    }}
                    className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    {selectedPlatformsToCrawl.length === AVAILABLE_PLATFORMS.length
                      ? "Tout désélectionner"
                      : "Tout sélectionner"}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {AVAILABLE_PLATFORMS.map((plat) => {
                    const isChecked = selectedPlatformsToCrawl.includes(plat.id);
                    const isTop100 = plat.id === "top100_enterprises";
                    return (
                      <label
                        key={plat.id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isTop100
                            ? isChecked
                              ? "border-amber-300 bg-amber-50 text-amber-950 font-semibold shadow-xs"
                              : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                            : isChecked
                            ? "border-orange-300 bg-orange-50 text-orange-950 font-semibold shadow-xs"
                            : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlatformsToCrawl((prev) => [...prev, plat.id]);
                              } else {
                                setSelectedPlatformsToCrawl((prev) => prev.filter((id) => id !== plat.id));
                              }
                            }}
                            className="rounded accent-primary"
                          />
                          <span>{plat.label}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground">
                          {plat.country}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-primary">Recherche directe :</span> Les sites carrières des meilleures entreprises sont consultés directement pour trouver les offres les plus récentes.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setShowCollectModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleLaunchCollect}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Lancer la recherche</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CV Ciblé */}
      <CVPreviewModal
        job={selectedJobForCV}
        isOpen={!!selectedJobForCV}
        onClose={() => setSelectedJobForCV(null)}
      />

      {/* Modal Lettre de Motivation */}
      <LetterPreviewModal
        job={selectedJobForLetter}
        isOpen={!!selectedJobForLetter}
        onClose={() => setSelectedJobForLetter(null)}
      />

      {/* Vue Miroir de Révision */}
      <MirrorReviewDrawer
        job={selectedJobForMirror}
        atsMatch={selectedJobForMirror ? atsScores[selectedJobForMirror.id] : undefined}
        isOpen={!!selectedJobForMirror}
        onClose={() => setSelectedJobForMirror(null)}
        onJobUpdated={(updated) => {
          setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
          setSelectedJobForMirror(updated);
        }}
      />
    </div>
  );
}
