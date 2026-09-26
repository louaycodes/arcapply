"use client";

import { useEffect, useState, useTransition } from "react";
import {
  fetchJobs,
  collectJobs,
  archiveJob,
  createRadarEventSource,
  fetchBatchATSScores,
  fetchJobATSScore,
  JobOffer,
  JobCollectSummary,
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
  Plus,
  Play,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

export default function RadarPage() {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [atsScores, setAtsScores] = useState<Record<string, ATSMatchResult>>({});
  const [isAtsLoading, setIsAtsLoading] = useState(false);
  const [selectedJobForCV, setSelectedJobForCV] = useState<JobOffer | null>(null);
  const [selectedJobForLetter, setSelectedJobForLetter] = useState<JobOffer | null>(null);
  const [selectedJobForMirror, setSelectedJobForMirror] = useState<JobOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newJobIds, setNewJobIds] = useState<Set<string>>(new Set());
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isCollecting, setIsCollecting] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Formulaire de collecte personnalisée
  const [keywordsInput, setKeywordsInput] = useState<string>("PFE, Ingénieur, Systèmes Distribués, Cloud");
  const [includeLinkedIn, setIncludeLinkedIn] = useState(true);
  const [includeJobteaser, setIncludeJobteaser] = useState(true);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const data = await fetchJobs({
        country: selectedCountry,
        platform: selectedPlatform,
        search: searchQuery,
      });
      setJobs(data);

      // Calcul des scores ATS en tâche de fond non bloquante
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
  }, [selectedCountry, selectedPlatform]);

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
      // Optimistic UI update
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
      setScrapeMessage("Lancement de la collecte Playwright en cours...");

      const platforms: string[] = [];
      if (includeLinkedIn) platforms.push("linkedin");
      if (includeJobteaser) platforms.push("jobteaser");

      const keywords = keywordsInput
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const summary = await collectJobs({
        keywords,
        locations: ["France", "Tunisie"],
        platforms: platforms.length > 0 ? platforms : ["linkedin", "jobteaser"],
        limit_per_platform: 5,
      });

      setNotification({
        type: "success",
        message: summary.message,
      });
      loadJobs();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Erreur pendant la collecte.",
      });
    } finally {
      setIsCollecting(false);
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (selectedCountry !== "all" && job.country.toLowerCase() !== selectedCountry.toLowerCase()) {
      return false;
    }
    if (selectedPlatform !== "all" && job.platform.toLowerCase() !== selectedPlatform.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Radar className="w-6 h-6 text-primary" />
              <span>Radar d'Offres PFE</span>
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Flux Live SSE
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Détection automatique d'opportunités de stage d'excellence (France & Tunisie) sans doublon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadJobs}
            disabled={isLoading}
            className="p-2 rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Rafraîchir manuellement"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowCollectModal(true)}
            disabled={isCollecting}
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isCollecting ? "animate-spin" : ""}`} />
            <span>{isCollecting ? "Collecte en cours..." : "Lancer le scan Radar"}</span>
          </button>
        </div>
      </div>

      {/* Scrape Progress Banner (SSE) */}
      {scrapeMessage && (
        <div className="p-3.5 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs font-mono flex items-center gap-2.5 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
          <span>{scrapeMessage}</span>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center gap-2.5 transition-all ${
            notification.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        {/* Pills Country */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1 font-medium">
            <MapPin className="w-3 h-3" />
            Pays :
          </span>
          {[
            { id: "all", label: "Tous" },
            { id: "France", label: "🇫🇷 France" },
            { id: "Tunisie", label: "🇹🇳 Tunisie" },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCountry(c.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedCountry === c.id
                  ? "bg-primary text-white font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}

          <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

          {/* Pills Platform */}
          <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1 font-medium">
            <Layers className="w-3 h-3" />
            Source :
          </span>
          {[
            { id: "all", label: "Toutes" },
            { id: "linkedin", label: "LinkedIn" },
            { id: "jobteaser", label: "Jobteaser" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPlatform(p.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedPlatform === p.id
                  ? "bg-primary text-white font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrer titre, entreprise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-muted/60 border border-border focus:outline-none focus:border-primary text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors"
          />
        </form>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-muted-foreground">Scan du flux d'offres en cours...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-16 rounded-xl border border-dashed border-border bg-card/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto">
            <Radar className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">Aucune offre ne correspond à vos filtres</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Lancez un scan Radar pour interroger LinkedIn et Jobteaser avec vos critères de recherche d'ingénieur.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setShowCollectModal(true)}
                className="px-4 py-2 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
              >
                Lancer une première collecte
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Radar className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Paramètres du scan Radar</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCollectModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Mots-clés de recherche PFE
                </label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-muted/60 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  placeholder="ex: PFE, Ingénieur, Cloud, Python"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Séparés par des virgules.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  Plateformes cibles
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/40 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={includeLinkedIn}
                      onChange={(e) => setIncludeLinkedIn(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span className="font-semibold text-foreground">LinkedIn</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/40 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={includeJobteaser}
                      onChange={(e) => setIncludeJobteaser(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span className="font-semibold text-foreground">Jobteaser</span>
                  </label>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-primary">Protection anti-bot :</span> Jitter aléatoire et plafonnement automatique appliqués pour chaque requête.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setShowCollectModal(false)}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleLaunchCollect}
                className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-primary/20 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Démarrer le scan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de prévisualisation et téléchargement du CV ciblé */}
      <CVPreviewModal
        job={selectedJobForCV}
        isOpen={!!selectedJobForCV}
        onClose={() => setSelectedJobForCV(null)}
      />

      {/* Modal de rédaction et révision de la lettre de motivation sobre */}
      <LetterPreviewModal
        job={selectedJobForLetter}
        isOpen={!!selectedJobForLetter}
        onClose={() => setSelectedJobForLetter(null)}
      />

      {/* Vue miroir de révision et déclencheur de soumission assistée */}
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
