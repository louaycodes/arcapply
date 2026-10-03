"use client";

import { useEffect, useState, useMemo } from "react";
import {
  fetchJobs,
  fetchPipelineMetrics,
  transitionJobStatus,
  fetchBatchATSScores,
  createRadarEventSource,
  JobOffer,
  PipelineMetrics,
  ATSMatchResult,
} from "@/lib/api";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { MirrorReviewDrawer } from "@/components/radar/mirror-review-drawer";
import { EmailInboxModal } from "@/components/kanban/email-inbox-modal";
import {
  KanbanSquare,
  Trophy,
  AlertTriangle,
  RefreshCw,
  Search,
  Send,
  X,
  XCircle,
  Radio,
  Mail,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

export default function KanbanPage() {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [atsScores, setAtsScores] = useState<Record<string, ATSMatchResult>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transitioningJobId, setTransitioningJobId] = useState<string | null>(null);
  const [selectedJobForMirror, setSelectedJobForMirror] = useState<JobOffer | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [emailToast, setEmailToast] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      const [jobsData, metricsData] = await Promise.all([
        fetchJobs({ include_archived: false }),
        fetchPipelineMetrics(),
      ]);
      setJobs(jobsData);
      setMetrics(metricsData);

      // Chargement non-bloquant des scores ATS
      fetchBatchATSScores()
        .then((scores) => setAtsScores(scores))
        .catch((err) => console.error("Erreur batch ATS scores:", err));
    } catch (err: any) {
      setErrorNotification(err.message || "Erreur lors du chargement du pipeline.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Écoute SSE pour réactivité en temps réel
  useEffect(() => {
    const cleanup = createRadarEventSource(
      (newJob) => {
        setJobs((prev) => {
          if (prev.some((j) => j.id === newJob.id)) return prev;
          return [newJob, ...prev];
        });
        fetchPipelineMetrics().then(setMetrics).catch(() => {});
      },
      undefined,
      undefined,
      (statusPayload) => {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === statusPayload.job_id
              ? { ...j, status: statusPayload.new_status }
              : j
          )
        );
        fetchPipelineMetrics().then(setMetrics).catch(() => {});
      },
      (emailPayload) => {
        setEmailToast(
          `Email recruteur reçu [${emailPayload.category}] : ${emailPayload.company || "Candidature"} — ${emailPayload.subject}`
        );
        loadData();
        setTimeout(() => setEmailToast(null), 8000);
      }
    );
    return cleanup;
  }, []);

  const handleTransition = async (jobId: string, newStatus: string) => {
    try {
      setTransitioningJobId(jobId);
      setErrorNotification(null);
      const updated = await transitionJobStatus(jobId, newStatus);
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      fetchPipelineMetrics().then(setMetrics).catch(() => {});
    } catch (err: any) {
      setErrorNotification(err.message || "Erreur lors du changement d'étape.");
    } finally {
      setTransitioningJobId(null);
    }
  };

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    const query = searchQuery.toLowerCase();
    return jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        (job.location && job.location.toLowerCase().includes(query))
    );
  }, [jobs, searchQuery]);

  // Définition stricte des 4 colonnes Kanban : Offres, Candidatures envoyées, Retenue, Non retenue
  const COLUMNS = [
    {
      id: "DISCOVERED",
      title: "Offres",
      icon: Radio,
      colorClass: "text-blue-800 dark:text-blue-300",
      badgeBg: "bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60",
    },
    {
      id: "SUBMITTED",
      title: "Candidatures envoyées",
      icon: Send,
      colorClass: "text-orange-950 dark:text-orange-300",
      badgeBg: "bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60",
    },
    {
      id: "OFFER",
      title: "Retenue",
      icon: Trophy,
      colorClass: "text-emerald-800 dark:text-emerald-300",
      badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60",
    },
    {
      id: "REJECTED",
      title: "Non retenue",
      icon: XCircle,
      colorClass: "text-stone-700 dark:text-stone-300",
      badgeBg: "bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700",
    },
  ];

  // Regroupement des offres par colonne
  const getJobsForColumn = (colId: string) => {
    return filteredJobs.filter((j) => {
      if (colId === "DISCOVERED") {
        return (
          !j.is_applied &&
          (j.status === "DISCOVERED" ||
            j.status === "REVIEWING" ||
            j.status === "READY")
        );
      }
      if (colId === "SUBMITTED") {
        return (
          j.is_applied ||
          j.status === "SUBMITTED" ||
          j.status === "INTERVIEW"
        );
      }
      if (colId === "OFFER") {
        return j.status === "OFFER";
      }
      if (colId === "REJECTED") {
        return j.status === "REJECTED";
      }
      return false;
    });
  };

  // Métriques KPI calculées sur les 4 catégories
  const kpiData = useMemo(() => {
    const totalOffres = jobs.filter(
      (j) =>
        !j.is_applied &&
        (j.status === "DISCOVERED" ||
          j.status === "REVIEWING" ||
          j.status === "READY")
    ).length;

    const totalSubmitted = jobs.filter(
      (j) =>
        j.is_applied ||
        j.status === "SUBMITTED" ||
        j.status === "INTERVIEW"
    ).length;

    const totalOffer = jobs.filter((j) => j.status === "OFFER").length;
    const totalRejected = jobs.filter((j) => j.status === "REJECTED").length;

    return {
      totalOffres,
      totalSubmitted,
      totalOffer,
      totalRejected,
    };
  }, [jobs]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1800px] mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold">
              <KanbanSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
                  Suivi des Candidatures
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                  Temps réel
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pipeline épuré en 4 étapes clés : Offres, Candidatures envoyées, Retenue et Non retenue.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer poste, entreprise..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-48 sm:w-60"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Consulter les emails et réponses des recruteurs"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Emails Recruteurs</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
            title="Rafraîchir le Kanban"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Recruiter Email Toast Live Alert */}
      {emailToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-950 dark:text-emerald-300 font-semibold shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span>{emailToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setEmailToast(null)}
            className="p-1 hover:bg-emerald-100 rounded text-emerald-800 dark:text-emerald-300 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error alert banner */}
      {errorNotification && (
        <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 flex items-center justify-between text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorNotification(null)}
            className="p-1 hover:bg-destructive/20 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Analytics KPI Widgets Grid : 4 cartes reflétant les 4 colonnes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Offres */}
        <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-artisan flex items-center justify-between gap-2 min-w-0">
          <div>
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider font-mono">
              Offres identifiées
            </span>
            <div className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100 mt-1">
              {kpiData.totalOffres}
            </div>
            <span className="text-[10px] text-stone-500 dark:text-stone-400">
              En prospection active
            </span>
          </div>
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 items-center justify-center shrink-0 text-blue-700 dark:text-blue-300 shadow-xs">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Candidatures envoyées */}
        <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-artisan flex items-center justify-between gap-2 min-w-0">
          <div>
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider font-mono">
              Candidatures envoyées
            </span>
            <div className="text-2xl font-bold font-mono text-primary mt-1">
              {kpiData.totalSubmitted}
            </div>
            <span className="text-[10px] text-stone-500 dark:text-stone-400">
              Dossiers transmis
            </span>
          </div>
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 items-center justify-center shrink-0 text-primary shadow-xs">
            <Send className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Retenue */}
        <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-artisan flex items-center justify-between gap-2 min-w-0">
          <div>
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider font-mono">
              Retenue
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
              {kpiData.totalOffer}
            </div>
            <span className="text-[10px] text-stone-500 dark:text-stone-400">
              Offres confirmées
            </span>
          </div>
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-300 shadow-xs">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Non retenue */}
        <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-artisan flex items-center justify-between gap-2 min-w-0">
          <div>
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider font-mono">
              Non retenue
            </span>
            <div className="text-2xl font-bold font-mono text-stone-700 dark:text-stone-300 mt-1">
              {kpiData.totalRejected}
            </div>
            <span className="text-[10px] text-stone-500 dark:text-stone-400">
              Candidatures classées
            </span>
          </div>
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 items-center justify-center shrink-0 text-stone-500 dark:text-stone-400 shadow-xs">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Kanban Board: EXACTEMENT 4 COLONNES */}
      <div className="overflow-x-auto md:overflow-visible pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none scroll-px-4">
        <div className="flex md:grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const columnJobs = getJobsForColumn(col.id);
            return (
              <div key={col.id} className="w-[85vw] max-w-[340px] shrink-0 snap-start md:w-auto md:max-w-none md:min-w-0">
                <KanbanColumn
                  id={col.id}
                  title={col.title}
                  icon={col.icon}
                  colorClass={col.colorClass}
                  badgeBg={col.badgeBg}
                  jobs={columnJobs}
                  atsScores={atsScores}
                  onOpenMirror={(job) => setSelectedJobForMirror(job)}
                  onTransition={handleTransition}
                  transitioningJobId={transitioningJobId}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mirror Review Drawer */}
      <MirrorReviewDrawer
        job={selectedJobForMirror}
        atsMatch={selectedJobForMirror ? atsScores[selectedJobForMirror.id] : undefined}
        isOpen={!!selectedJobForMirror}
        onClose={() => setSelectedJobForMirror(null)}
        onJobUpdated={(updated) => {
          setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
          setSelectedJobForMirror(updated);
          fetchPipelineMetrics().then(setMetrics).catch(() => {});
        }}
      />

      {/* Recruiter Email Inbox & Simulator Modal */}
      <EmailInboxModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        jobs={jobs}
        onEmailProcessed={loadData}
      />
    </div>
  );
}
