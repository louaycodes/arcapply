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
  markJobAsApplied,
  unmarkJobAsApplied,
  JobOffer,
  ATSMatchResult,
} from "@/lib/api";
import { JobCard } from "@/components/radar/job-card";
import { useAppLanguage } from "@/lib/language-context";
import { localizeServerMessage } from "@/lib/i18n";
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
  Briefcase,
  Flame,
  Calendar,
  Clock,
  LayoutGrid,
  ListFilter,
  Laptop,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowRight,
} from "lucide-react";

const AVAILABLE_PLATFORMS: { id: string; label: string; labelEn?: string; country: string }[] = [
  { id: "top100_enterprises", label: "Top 100 Firmes IT (Portails Carrières Dédiés)", labelEn: "Top 100 IT Firms (Dedicated Career Portals)", country: "Global" },
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
  { id: "esn_direct", label: "Portails ESN (Capgemini, Sopra...)", labelEn: "IT Services Portals (Capgemini, Sopra...)", country: "France" },
  { id: "numeum", label: "Numeum ESN", country: "France" },
  { id: "capdigital", label: "Cap Digital Tech", country: "France" },
];

export default function RadarPage() {
  const { t, language } = useAppLanguage();
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");

  const [isCollecting, setIsCollecting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showAppliedSection, setShowAppliedSection] = useState(true);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [isCrawlModalOpen, setIsCrawlModalOpen] = useState(false);
  const [currentScrapingSource, setCurrentScrapingSource] = useState<string | null>(null);
  const [crawlPlatformStats, setCrawlPlatformStats] = useState<
    Record<string, { status: "pending" | "running" | "completed" | "error"; count: number; message?: string }>
  >({});
  const [totalPfeDiscoveredInCrawl, setTotalPfeDiscoveredInCrawl] = useState<number>(0);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Formulaire de collecte multi-sources (exclusif PFE)
  const [keywordsInput, setKeywordsInput] = useState<string>("DevOps, Cloud, Software, Data");
  const [selectedPlatformsToCrawl, setSelectedPlatformsToCrawl] = useState<string[]>([
    "top100_enterprises",
    "linkedin",
    "keejob",
    "wttj",
    "jobteaser",
    "hellowork",
    "indeed",
  ]);

  // Blocage strict de la touche Echap pendant l'exploration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCrawlModalOpen && isCollecting && e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCrawlModalOpen, isCollecting]);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const data = await fetchJobs({
        country: selectedCountry,
        platform: selectedPlatform,
        period: selectedPeriod,
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
        message: err.message || t("Erreur lors de la récupération des offres Radar.", "Error while fetching Radar offers."),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [selectedCountry, selectedPlatform, selectedPeriod]);

  // Écoute SSE en direct
  useEffect(() => {
    const cleanup = createRadarEventSource(
      (newJob) => {
        setJobs((prev) => {
          if (prev.some((j) => j.id === newJob.id)) return prev;
          return [newJob, ...prev];
        });
        setNewJobIds((prev) => new Set(prev).add(newJob.id));
        setTotalPfeDiscoveredInCrawl((prev) => prev + 1);

        if (newJob.platform) {
          const platKey = newJob.platform.toLowerCase();
          setCrawlPlatformStats((prev) => {
            const current = prev[platKey] || { status: "running", count: 0 };
            return {
              ...prev,
              [platKey]: {
                ...current,
                status: "running",
                count: current.count + 1,
              },
            };
          });
        }

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
        if (progress.platform) {
          const platKey = progress.platform.toLowerCase();
          if (progress.status === "running") {
            setCurrentScrapingSource(platKey);
          }
          setCrawlPlatformStats((prev) => {
            const current = prev[platKey] || { status: "pending", count: 0 };
            return {
              ...prev,
              [platKey]: {
                status: (progress.status as any) || "running",
                count: progress.count !== undefined ? progress.count : current.count,
                message: progress.message,
              },
            };
          });
        }

        setScrapeMessage(
          t(
            `${progress.platform.toUpperCase()} : ${progress.message}`,
            `${progress.platform.toUpperCase()}: ${localizeServerMessage(progress.message)}`
          )
        );
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
          message: t("La base de données des offres a été vidée.", "The offers database has been cleared."),
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
        message: t("Offre archivée avec succès.", "Offer archived successfully."),
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || t("Impossible d'archiver l'offre.", "Unable to archive the offer."),
      });
    }
  };

  const handleLaunchCollect = async () => {
    try {
      setShowCollectModal(false);
      setIsCollecting(true);
      setIsCrawlModalOpen(true);
      setTotalPfeDiscoveredInCrawl(0);

      const targetPlatforms =
        selectedPlatformsToCrawl.length > 0
          ? selectedPlatformsToCrawl
          : AVAILABLE_PLATFORMS.map((p) => p.id);

      const initialStats: Record<
        string,
        { status: "pending" | "running" | "completed" | "error"; count: number; message?: string }
      > = {};
      targetPlatforms.forEach((p) => {
        initialStats[p.toLowerCase()] = { status: "pending", count: 0 };
      });
      setCrawlPlatformStats(initialStats);
      setCurrentScrapingSource(targetPlatforms[0]?.toLowerCase() || null);

      setScrapeMessage(
        t(
          "Lancement de l'exploration multi-sources 100% PFE...",
          "Starting 100% PFE multi-source exploration..."
        )
      );

      const keywords = keywordsInput
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const summary = await crawlAllSources({
        keywords,
        locations: ["France", "Tunisie"],
        platforms: targetPlatforms,
        limit_per_platform: 20,
      });

      const byPlatform = summary.by_platform;
      if (byPlatform) {
        setCrawlPlatformStats((prev) => {
          const updated = { ...prev };
          Object.entries(byPlatform).forEach(([plat, cnt]) => {
            const key = plat.toLowerCase();
            const num = typeof cnt === "number" ? cnt : Number(cnt) || 0;
            updated[key] = {
              status: "completed",
              count: num,
              message: `${num} offre(s) PFE validée(s)`,
            };
          });
          return updated;
        });
      }
      setTotalPfeDiscoveredInCrawl(summary.new_count ?? 0);
      setNotification({
        type: "success",
        message: summary.message || t("Collecte multi-sources achevée avec succès.", "Multi-source collection completed successfully."),
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || t("Erreur pendant la collecte multi-sources.", "Error during multi-source collection."),
      });
    } finally {
      setIsCollecting(false);
    }
  };

  const handleFinishCrawl = () => {
    setIsCrawlModalOpen(false);
    loadJobs();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleClearAllJobs = async () => {
    const confirmed = window.confirm(
      t("Êtes-vous sûr de vouloir vider toutes les offres de la base de données locale ? Les CVs et lettres générés associés seront également réinitialisés.", "Are you sure you want to clear all offers from the local database? The associated generated CVs and letters will also be reset.")
    );
    if (!confirmed) return;

    try {
      setIsClearing(true);
      const res = await clearAllJobs();
      setJobs([]);
      setAtsScores({});
      setNotification({
        type: "success",
        message: localizeServerMessage(res.message) || t("Toutes les offres ont été supprimées avec succès.", "All offers were deleted successfully."),
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || t("Erreur lors de la suppression des offres.", "Error while deleting the offers."),
      });
    } finally {
      setIsClearing(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleToggleMarkApplied = async (jobId: string, markApplied: boolean) => {
    try {
      // Optimistic update
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            is_applied: markApplied,
            applied_at: markApplied ? new Date().toISOString() : null,
            status:
              markApplied && j.status === "DISCOVERED"
                ? "SUBMITTED"
                : !markApplied && j.status === "SUBMITTED"
                ? "DISCOVERED"
                : j.status,
          };
        })
      );

      if (markApplied) {
        await markJobAsApplied(jobId);
        setNotification({
          type: "success",
          message: t("Offre marquée comme déjà postulée. Elle est protégée contre tout re-scraping !", "Offer marked as already applied. It is protected against any re-scraping!"),
        });
      } else {
        await unmarkJobAsApplied(jobId);
        setNotification({
          type: "success",
          message: t("Offre démarquée et réintégrée dans le radar de prospection.", "Offer unmarked and restored to the prospecting radar."),
        });
      }
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      loadJobs();
      setNotification({
        type: "error",
        message: err.message || t("Erreur lors de la mise à jour du statut postulé.", "Error while updating the applied status."),
      });
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
  }, [jobs, selectedCountry, selectedPlatform, searchQuery]);

  // Séparation stricte : Offres à postuler vs Offres déjà postulées
  const { unappliedJobs, appliedJobs } = useMemo(() => {
    const unapplied: JobOffer[] = [];
    const applied: JobOffer[] = [];
    for (const j of filteredJobs) {
      const isApplied = Boolean(
        j.is_applied ||
          j.status === "SUBMITTED" ||
          j.status === "INTERVIEW" ||
          j.status === "OFFER"
      );
      if (isApplied) {
        applied.push(j);
      } else {
        unapplied.push(j);
      }
    }
    return { unappliedJobs: unapplied, appliedJobs: applied };
  }, [filteredJobs]);

  // Répartition temporelle pour calcul des métriques et affichage chronologique (sur les offres non postulées)
  const { todayJobs, weekJobs, olderJobs, countToday, countWeek, countMonth } = useMemo(() => {
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

    for (const j of jobs) {
      const isApplied = Boolean(
        j.is_applied ||
          j.status === "SUBMITTED" ||
          j.status === "INTERVIEW" ||
          j.status === "OFFER"
      );
      if (isApplied) continue;

      const d = j.published_at || j.collected_at;
      if (isWithinHours(d, 24)) cToday++;
      if (isWithinHours(d, 24 * 7)) cWeek++;
      if (isWithinHours(d, 24 * 30)) cMonth++;
    }

    for (const j of unappliedJobs) {
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
    };
  }, [jobs, unappliedJobs]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Radar className="w-6 h-6 text-primary" />
              <span>{t("Offres de Stage PFE", "Internship Offers")}</span>
            </h1>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {t("Détection en temps réel sur les portails dédiés des 100 meilleures firmes IT mondiales (France & Tunisie) et plateformes vérifiées.", "Real-time detection on the dedicated portals of the world's top 100 IT firms (France & Tunisia) and verified platforms.")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearAllJobs}
            disabled={isLoading || isClearing || jobs.length === 0}
            className="px-3 py-2 rounded-lg border border-destructive/20 bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-40 cursor-pointer"
            title={t("Effacer la liste des offres", "Clear the offer list")}
          >
            <Trash2 className={`w-3.5 h-3.5 text-destructive ${isClearing ? "animate-spin" : ""}`} />
            <span className="text-destructive hidden sm:inline">{isClearing ? t("Suppression...", "Deleting...") : t("Vider", "Clear")}</span>
          </button>

          <button
            type="button"
            onClick={loadJobs}
            disabled={isLoading}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={t("Rafraîchir les offres", "Refresh offers")}
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
            <span>{isCollecting ? t("Recherche en cours...", "Searching...") : t("Rechercher des offres", "Search for offers")}</span>
          </button>
        </div>
      </div>

      {/* Scrape Progress Banner (SSE) */}
      {scrapeMessage && (
        <div className="p-3 rounded-xl border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 text-orange-950 dark:text-orange-300 text-xs font-mono flex items-center gap-2.5 shadow-xs">
          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-orange-700 dark:text-orange-400" />
          <span>{scrapeMessage}</span>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all shadow-xs font-medium ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/60 text-rose-950 dark:text-rose-300"
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 bg-white/70 dark:bg-stone-900/80 backdrop-blur-xl rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
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
            <span>{t("Toutes les offres", "All offers")}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
              {jobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod("today")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPeriod === "today"
                ? "bg-orange-100 dark:bg-orange-950/60 text-orange-950 dark:text-orange-200 font-semibold border border-orange-300 dark:border-orange-800 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-700 dark:text-orange-400" />
            <span>{t("Aujourd'hui", "Today")}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200 font-bold">
              {countToday}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod("week")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPeriod === "week"
                ? "bg-blue-100 dark:bg-blue-950/60 text-blue-950 dark:text-blue-200 font-semibold border border-blue-300 dark:border-blue-800 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            <span>{t("Cette semaine", "This week")}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-200 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 font-bold">
              {countWeek}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPeriod === "month"
                ? "bg-orange-100 dark:bg-orange-950/60 text-orange-950 dark:text-orange-200 font-semibold border border-orange-300 dark:border-orange-800 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{t("Ce mois-ci", "This month")}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200 font-bold">
              {countMonth}
            </span>
          </button>
        </div>

        {/* Bascule de vue (Chronologique vs Grille) */}
        <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-border/60 pt-2 sm:pt-0 sm:pl-3">
          <span className="text-[11px] text-muted-foreground hidden lg:inline">{t("Affichage :", "View:")}</span>
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === "timeline"
                ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={t("Vue groupée par période temporelle", "View grouped by time period")}
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
            title={t("Vue Grille fluide", "Fluid grid view")}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="text-xs">{t("Grille", "Grid")}</span>
          </button>
        </div>
      </div>

      {/* 2. Barre de Filtres Secondaires & Recherche Avancée */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtre Pays */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/40">
            {[
              { id: "all", label: t("Tous", "All") },
              { id: "France", label: "France" },
              { id: "Tunisie", label: t("Tunisie", "Tunisia") },
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
        </div>

        {/* Champ de Recherche Live */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-auto sm:min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("Stack, entreprise, pôle...", "Stack, company, team...")}
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
          <p className="text-xs font-mono text-muted-foreground">{t("Recherche des opportunités en cours...", "Searching for opportunities...")}</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-16 rounded-xl border border-dashed border-border bg-card/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto">
            <Radar className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">{t("Aucune offre ne correspond aux critères actifs", "No offers match the active criteria")}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("Modifiez vos critères de recherche ou lancez une exploration automatique sur les sites des meilleures entreprises IT.", "Change your search criteria or start an automatic exploration of the top IT companies' sites.")}
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setShowCollectModal(true)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {t("Lancer une nouvelle collecte", "Start a new collection")}
              </button>
            </div>
          </div>
        </div>
      ) : unappliedJobs.length === 0 ? (
        <div className="p-8 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/40 text-center space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300 mx-auto shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-300">{t("Toutes les opportunités filtrées ont été postulées !", "You applied to all filtered opportunities!")}</h3>
          <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto leading-relaxed">
            {t("Vous avez déjà postulé à toutes les offres correspondant à vos filtres actuels. Retrouvez le détail de vos candidatures dans la section dédiée en bas de page.", "You have already applied to every offer matching your current filters. Find your application details in the dedicated section at the bottom of the page.")}
          </p>
        </div>
      ) : viewMode === "timeline" && selectedPeriod === "all" ? (
        /* Affichage Structuré par Sections Temporelles */
        <div className="space-y-8">
          {/* Section Aujourd'hui */}
          {todayJobs.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-700 dark:text-orange-400" />
                  <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">{t("Aujourd'hui", "Today")}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-900 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800/60">
                    {t(`${todayJobs.length} opportunité(s)`, `${todayJobs.length} opportunit${todayJobs.length === 1 ? "y" : "ies"}`)}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">{t("Détectées il y a moins de 24 heures", "Detected less than 24 hours ago")}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    atsMatch={atsScores[job.id]}
                    atsLoading={isAtsLoading && !atsScores[job.id]}
                    onArchive={handleArchive}
                    onOpenMirror={(j) => setSelectedJobForMirror(j)}
                    onToggleMarkApplied={handleToggleMarkApplied}
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
                  <Calendar className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">{t("Cette Semaine", "This Week")}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800/60">
                    {t(`${weekJobs.length} opportunité(s)`, `${weekJobs.length} opportunit${weekJobs.length === 1 ? "y" : "ies"}`)}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">{t("Publiées au cours des 7 derniers jours", "Published in the last 7 days")}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weekJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    atsMatch={atsScores[job.id]}
                    atsLoading={isAtsLoading && !atsScores[job.id]}
                    onArchive={handleArchive}
                    onOpenMirror={(j) => setSelectedJobForMirror(j)}
                    onToggleMarkApplied={handleToggleMarkApplied}
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
                  <h2 className="text-sm font-bold text-foreground">{t("Plus Anciennes", "Older")}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold border border-border/50">
                    {t(`${olderJobs.length} offre(s)`, `${olderJobs.length} offer${olderJobs.length === 1 ? "" : "s"}`)}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">{t("Publiées il y a plus d'une semaine", "Published more than a week ago")}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {olderJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    atsMatch={atsScores[job.id]}
                    atsLoading={isAtsLoading && !atsScores[job.id]}
                    onArchive={handleArchive}
                    onOpenMirror={(j) => setSelectedJobForMirror(j)}
                    onToggleMarkApplied={handleToggleMarkApplied}
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
          {unappliedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              atsMatch={atsScores[job.id]}
              atsLoading={isAtsLoading && !atsScores[job.id]}
              onArchive={handleArchive}
              onOpenMirror={(j) => setSelectedJobForMirror(j)}
              onToggleMarkApplied={handleToggleMarkApplied}
              isNew={newJobIds.has(job.id)}
            />
          ))}
        </div>
      )}

      {/* 4. Section Séparée : Offres Déjà Postulées (Protégées contre le re-scraping) */}
      {appliedJobs.length > 0 && (
        <div className="pt-8 border-t-2 border-stone-200/80 dark:border-stone-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-white to-stone-50 dark:from-emerald-950/30 dark:via-stone-900 dark:to-stone-950 border border-emerald-200/80 dark:border-emerald-800/50 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-800 dark:text-emerald-300 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
                    {t("Offres Déjà Postulées", "Offers Already Applied To")}
                  </h2>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-800">
                    {appliedJobs.length}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {t("Ces postes sont verrouillés : ils ne seront", "These positions are locked: they will")}{" "}
                    <strong>{t("jamais re-scrappés", "never be re-scraped")}</strong>{" "}
                    {t("ni réinsérés.", "or reinserted.")}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAppliedSection((prev) => !prev)}
              className="px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer self-end sm:self-center"
            >
              <span>{showAppliedSection ? t("Masquer la section", "Hide section") : t("Afficher les offres", "Show offers")}</span>
              {showAppliedSection ? (
                <ChevronUp className="w-4 h-4 text-stone-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-500" />
              )}
            </button>
          </div>

          {showAppliedSection && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
              {appliedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  atsMatch={atsScores[job.id]}
                  atsLoading={isAtsLoading && !atsScores[job.id]}
                  onArchive={handleArchive}
                  onOpenMirror={(j) => setSelectedJobForMirror(j)}
                  onToggleMarkApplied={handleToggleMarkApplied}
                  isAppliedSection={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collect Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 z-50 !mt-0 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Radar className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">{t("Recherche d'opportunités", "Opportunity Search")}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCollectModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  {t("Spécialités, métiers ou technologies ciblés", "Target roles, specialties or technologies")}
                </label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted/60 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  placeholder={t("ex: DevOps, Cloud, Software, Data, IA, Fullstack", "e.g. DevOps, Cloud, Software, Data, AI, Fullstack")}
                />
                <div className="mt-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-[11px] text-foreground leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    {t(
                      "ArcApply est dédié à 100% aux stages PFE. Entrez simplement votre domaine technique : l'application génère automatiquement les requêtes de stage ciblées et écarte strictement les offres non-PFE.",
                      "ArcApply is 100% dedicated to PFE internships. Simply enter your technical domain: the app automatically generates targeted internship queries and strictly rejects non-PFE listings."
                    )}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-muted-foreground">
                    {t(
                      `Sources prioritaires (${selectedPlatformsToCrawl.length}/${AVAILABLE_PLATFORMS.length} actives)`,
                      `Priority sources (${selectedPlatformsToCrawl.length}/${AVAILABLE_PLATFORMS.length} active)`
                    )}
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
                      ? t("Tout désélectionner", "Deselect all")
                      : t("Tout sélectionner", "Select all")}
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
                              ? "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-semibold shadow-xs"
                              : "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                            : isChecked
                            ? "border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 text-orange-950 dark:text-orange-200 font-semibold shadow-xs"
                            : "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
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
                          <span>{language === "en" && plat.labelEn ? plat.labelEn : plat.label}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground">
                          {plat.country === "Tunisie" ? t("Tunisie", "Tunisia") : plat.country}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-primary">{t("Recherche directe :", "Direct search:")}</span>{" "}
                {t("Les sites carrières des meilleures entreprises sont consultés directement pour trouver les offres les plus récentes.", "The career sites of top companies are queried directly to find the most recent offers.")}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setShowCollectModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                {t("Annuler", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleLaunchCollect}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t("Lancer l'exploration PFE", "Start PFE exploration")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Fenêtre Modale de Scraping Bloquante Multi-Sources */}
      {isCrawlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-xl rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  {isCollecting ? (
                    <Radar className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
                    {isCollecting
                      ? t("Exploration PFE multi-sources en cours", "Multi-source PFE exploration in progress")
                      : t("Exploration PFE multi-sources terminée", "Multi-source PFE exploration completed")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t(
                      "Extraction et validation déterministe 100% PFE (France & Tunisie).",
                      "Deterministic 100% PFE extraction and validation (France & Tunisia)."
                    )}
                  </p>
                </div>
              </div>
              <div>
                {isCollecting ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t("Scan en cours", "Scanning")}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t("Prêt", "Ready")}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Active Source Banner */}
            {isCollecting && currentScrapingSource && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      {t("Scraping en cours sur :", "Scraping in progress on:")}
                    </span>
                    <p className="text-sm font-bold text-foreground font-display">
                      {AVAILABLE_PLATFORMS.find((p) => p.id === currentScrapingSource)?.label ||
                        currentScrapingSource.toUpperCase()}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-primary font-medium animate-pulse">
                  {t("Collecte active...", "Active crawl...")}
                </span>
              </div>
            )}

            {/* Live Stats KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("Sources explorées", "Explored sources")}
                </p>
                <p className="text-xl font-bold text-foreground mt-1 font-display">
                  {
                    Object.values(crawlPlatformStats).filter(
                      (s) => s.status === "completed" || s.status === "error"
                    ).length
                  }{" "}
                  / {Object.keys(crawlPlatformStats).length || selectedPlatformsToCrawl.length}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20">
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                  {t("Offres PFE réellement trouvées", "PFE offers actually found")}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xl font-bold text-emerald-900 dark:text-emerald-200 font-display">
                    {totalPfeDiscoveredInCrawl}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Platform-by-Platform List */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("Détail par source :", "Breakdown by source:")}
              </p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {(selectedPlatformsToCrawl.length > 0
                  ? selectedPlatformsToCrawl
                  : AVAILABLE_PLATFORMS.map((p) => p.id)
                ).map((platformId) => {
                  const platMeta = AVAILABLE_PLATFORMS.find((p) => p.id === platformId);
                  const platStat = crawlPlatformStats[platformId.toLowerCase()] || {
                    status: "pending",
                    count: 0,
                  };
                  const isCur = currentScrapingSource === platformId.toLowerCase() && isCollecting;

                  return (
                    <div
                      key={platformId}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                        isCur
                          ? "border-primary/40 bg-primary/10 shadow-xs"
                          : platStat.status === "completed"
                          ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/10"
                          : platStat.status === "error"
                          ? "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40"
                          : "border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 dark:text-stone-100">
                          {language === "en" && platMeta?.labelEn ? platMeta.labelEn : platMeta?.label || platformId}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground">
                          {platMeta?.country === "Tunisie" ? "TN" : platMeta?.country === "France" ? "FR" : "GLOBAL"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {platStat.status === "running" || isCur ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-primary animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{t("Scraping en cours...", "Scraping...")}</span>
                          </span>
                        ) : platStat.status === "completed" ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {platStat.count}{" "}
                              {platStat.count > 1
                                ? t("offres PFE trouvées", "PFE offers found")
                                : t("offre PFE trouvée", "PFE offer found")}
                            </span>
                          </span>
                        ) : platStat.status === "error" ? (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                            <span>{t("0 offre trouvée", "0 offers found")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            <span>{t("En attente", "Pending")}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions (Non dismissible during crawl) */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
              {isCollecting ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 font-semibold text-xs flex items-center justify-center gap-2.5 cursor-not-allowed border border-stone-200 dark:border-stone-700/50"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>
                      {t(
                        "Scraping en cours... Fermeture bloquée jusqu'à l'achèvement de toutes les sources",
                        "Scraping in progress... Closing blocked until all sources complete"
                      )}
                    </span>
                  </button>
                  <p className="text-[11px] text-center text-muted-foreground">
                    {t(
                      "Veuillez patienter, aucune action parallèle n'est autorisée pour garantir l'intégrité de la collecte.",
                      "Please wait, no parallel actions allowed to guarantee collection integrity."
                    )}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishCrawl}
                  className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {t(
                      `Consulter les offres PFE découvertes (${totalPfeDiscoveredInCrawl})`,
                      `View discovered PFE offers (${totalPfeDiscoveredInCrawl})`
                    )}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
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
