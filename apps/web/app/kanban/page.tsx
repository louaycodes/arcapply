"use client";

import { useEffect, useState } from "react";
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
import {
  KanbanSquare,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Trophy,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Send,
  CalendarCheck,
  XCircle,
  Radio,
} from "lucide-react";

export default function KanbanPage() {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [atsScores, setAtsScores] = useState<Record<string, ATSMatchResult>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transitioningJobId, setTransitioningJobId] = useState<string | null>(null);
  const [selectedJobForMirror, setSelectedJobForMirror] = useState<JobOffer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

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
      // Actualisation des métriques
      fetchPipelineMetrics().then(setMetrics).catch(() => {});
    } catch (err: any) {
      setErrorNotification(err.message || "Erreur lors du changement d'étape.");
    } finally {
      setTransitioningJobId(null);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      (job.location && job.location.toLowerCase().includes(query))
    );
  });

  // Définition des 7 colonnes Kanban selon AD-6
  const COLUMNS = [
    {
      id: "DISCOVERED",
      title: "Découvertes",
      icon: Radio,
      colorClass: "text-blue-400",
      badgeBg: "bg-blue-500/15 border border-blue-500/30",
    },
    {
      id: "REVIEWING",
      title: "En révision",
      icon: Eye,
      colorClass: "text-amber-400",
      badgeBg: "bg-amber-500/15 border border-amber-500/30",
    },
    {
      id: "READY",
      title: "Prêt pour envoi",
      icon: Sparkles,
      colorClass: "text-emerald-400",
      badgeBg: "bg-emerald-500/15 border border-emerald-500/30",
    },
    {
      id: "SUBMITTED",
      title: "Postulé / Transmis",
      icon: Send,
      colorClass: "text-purple-400",
      badgeBg: "bg-purple-500/15 border border-purple-500/30",
    },
    {
      id: "INTERVIEW",
      title: "Entretiens",
      icon: CalendarCheck,
      colorClass: "text-sky-400",
      badgeBg: "bg-sky-500/15 border border-sky-500/30",
    },
    {
      id: "OFFER",
      title: "Offres obtenues",
      icon: Trophy,
      colorClass: "text-green-400",
      badgeBg: "bg-green-500/20 border border-green-500/40",
    },
    {
      id: "REJECTED",
      title: "Classé / Refus",
      icon: XCircle,
      colorClass: "text-rose-400",
      badgeBg: "bg-rose-500/15 border border-rose-500/30",
    },
  ];

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
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Suivi Kanban du Pipeline
                </h1>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                  7 Étapes FSM
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilotage souverain et métriques de conversion des candidatures PFE.
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
            onClick={loadData}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Rafraîchir le Kanban"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

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
            className="p-1 hover:bg-destructive/20 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Analytics KPI Widgets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Candidatures Actives */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              En cours actif
            </span>
            <div className="text-2xl font-bold font-mono text-foreground mt-1">
              {metrics ? metrics.active_count : "--"}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {metrics ? `${metrics.submitted_total} soumises au total` : "Calcul..."}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Send className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Taux de conversion en entretien */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Taux d'entretien
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Cible &gt; 15%
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {metrics ? `${metrics.interview_rate_percent}%` : "--%"}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {metrics ? `${metrics.interview_count} entretiens décrochés` : "Calcul..."}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Offres de stage reçues */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Offres reçues
            </span>
            <div className="text-2xl font-bold font-mono text-green-400 mt-1">
              {metrics ? metrics.offer_count : "--"}
            </div>
            <span className="text-[10px] text-muted-foreground">
              Objectif stage PFE janvier 2027
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-300">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Alertes de relance */}
        <div
          className={`p-4 rounded-xl border shadow-sm flex items-center justify-between ${
            metrics && metrics.stale_relance_count > 0
              ? "border-amber-500/40 bg-amber-500/10"
              : "border-border/80 bg-card/80"
          }`}
        >
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Relances à faire
            </span>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${
                metrics && metrics.stale_relance_count > 0
                  ? "text-amber-400"
                  : "text-foreground"
              }`}
            >
              {metrics ? metrics.stale_relance_count : "--"}
            </div>
            <span className="text-[10px] text-muted-foreground">
              Sans retour après 7 jours
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              metrics && metrics.stale_relance_count > 0
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                : "bg-muted border border-border text-muted-foreground"
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Kanban Board: 7 Horizontal Scrollable Columns */}
      <div className="overflow-x-auto pb-6">
        <div className="flex items-start gap-4 min-w-max">
          {COLUMNS.map((col) => {
            const columnJobs = filteredJobs.filter((j) => j.status === col.id);
            return (
              <KanbanColumn
                key={col.id}
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
    </div>
  );
}
