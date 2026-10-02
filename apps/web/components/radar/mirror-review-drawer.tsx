"use client";

import { useEffect, useState, useRef } from "react";
import {
  JobOffer,
  ATSMatchResult,
  CoverLetter,
  generateTargetedCV,
  generateCoverLetter,
  fetchCoverLetter,
  updateCoverLetter,
  transitionJobStatus,
  markJobAsApplied,
  unmarkJobAsApplied,
  getCVPreviewUrl,
  getCVPdfDownloadUrl,
  ReconDossier,
  fetchReconDossier,
  triggerReconInvestigation,
} from "@/lib/api";
import { useAppLanguage } from "@/lib/language-context";
import { AtsScoreBadge } from "./ats-score-badge";
import {
  X,
  FileText,
  Mail,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  Save,
  Check,
  RotateCcw,
  Loader2,
  Building2,
  MapPin,
  ChevronRight,
  ShieldAlert,
  Compass,
  ChevronDown,
} from "lucide-react";
import { LetterDownloadMenu } from "./letter-download-menu";

interface MirrorReviewDrawerProps {
  job: JobOffer | null;
  atsMatch?: ATSMatchResult;
  isOpen: boolean;
  onClose: () => void;
  onJobUpdated?: (updatedJob: JobOffer) => void;
}

export function MirrorReviewDrawer({
  job,
  atsMatch,
  isOpen,
  onClose,
  onJobUpdated,
}: MirrorReviewDrawerProps) {
  const { language: appLanguage, setLanguage: setAppLanguage } = useAppLanguage();
  const [activeTab, setActiveTab] = useState<"cv" | "letter" | "recon">("cv");
  const [status, setStatus] = useState<string>("DISCOVERED");
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // CV state
  const [cvLoading, setCvLoading] = useState(false);
  const [cvGenerated, setCvGenerated] = useState(false);
  const [cvLanguage, setCvLanguage] = useState<"fr" | "en">(appLanguage);

  // Letter state
  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterContent, setLetterContent] = useState("");
  const [isLetterSaving, setIsLetterSaving] = useState(false);
  const [letterSaveSuccess, setLetterSaveSuccess] = useState(false);

  // Deep Recon state
  const [reconDossier, setReconDossier] = useState<ReconDossier | null>(null);
  const [reconScanning, setReconScanning] = useState(false);
  const [showThinkingPlan, setShowThinkingPlan] = useState(true);

  // 5-second countdown state
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCvLanguage(appLanguage);
  }, [appLanguage]);

  // Synchronisation avec le job courant et la langue
  useEffect(() => {
    if (job && isOpen) {
      setStatus(job.status);
      setErrorMsg(null);
      setIsCountingDown(false);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      // Initialiser Deep Recon Dossier
      fetchReconDossier(job.id)
        .then((d) => setReconDossier(d))
        .catch(() => setReconDossier(null));

      // Initialiser CV
      setCvLoading(true);
      generateTargetedCV(job.id, cvLanguage)
        .then(() => setCvGenerated(true))
        .catch((err) => console.error("Erreur auto-generation CV:", err))
        .finally(() => setCvLoading(false));

      // Initialiser Lettre
      setLetterLoading(true);
      fetchCoverLetter(job.id, cvLanguage)
        .then((l) => {
          setLetter(l);
          setLetterContent(l.content_markdown);
        })
        .catch(() => {
          // Si pas encore générée, la générer
          generateCoverLetter(job.id, cvLanguage)
            .then((l) => {
              setLetter(l);
              setLetterContent(l.content_markdown);
            })
            .catch((err) => console.error("Erreur génération lettre:", err));
        })
        .finally(() => setLetterLoading(false));
    }
  }, [job?.id, isOpen, cvLanguage]);

  // Nettoyage countdown lors du démontage ou fermeture
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  if (!isOpen || !job) return null;

  const pdfUrl = getCVPdfDownloadUrl(job.id, cvLanguage);
  const previewUrl = getCVPreviewUrl(job.id, cvLanguage);

  // Actions FSM
  const handleTransition = async (newStatus: string) => {
    try {
      setLoadingAction(true);
      setErrorMsg(null);
      const updated = await transitionJobStatus(job.id, newStatus);
      setStatus(updated.status);
      onJobUpdated?.(updated);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors du changement de statut.");
    } finally {
      setLoadingAction(false);
    }
  };

  // Déclencheur 5s avec annulation possible
  const startSubmissionCountdown = () => {
    setIsCountingDown(true);
    setCountdownSeconds(5);

    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setIsCountingDown(false);
          // Exécution de la soumission irréversible
          handleTransition("SUBMITTED");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSubmissionCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsCountingDown(false);
    setCountdownSeconds(5);
  };

  const handleSaveLetter = async () => {
    if (!letterContent) return;
    try {
      setIsLetterSaving(true);
      const updated = await updateCoverLetter(job.id, letterContent);
      setLetter(updated);
      setLetterSaveSuccess(true);
      setTimeout(() => setLetterSaveSuccess(false), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la sauvegarde de la lettre.");
    } finally {
      setIsLetterSaving(false);
    }
  };

  const handleTriggerRecon = async () => {
    if (!job) return;
    try {
      setReconScanning(true);
      await triggerReconInvestigation(job.id);
      const updated = await fetchReconDossier(job.id);
      setReconDossier(updated);
    } catch (err: any) {
      console.error("Erreur Deep Recon:", err);
      setErrorMsg(err.message || "Erreur lors de l'investigation Deep Recon.");
    } finally {
      setReconScanning(false);
    }
  };

  const isApplied = Boolean(
    job?.is_applied ||
      status === "SUBMITTED" ||
      status === "INTERVIEW" ||
      status === "OFFER"
  );

  const handleToggleApplied = async () => {
    if (!job) return;
    try {
      setLoadingAction(true);
      let updated: JobOffer;
      if (isApplied) {
        updated = await unmarkJobAsApplied(job.id);
      } else {
        updated = await markJobAsApplied(job.id);
      }
      setStatus(updated.status);
      onJobUpdated?.(updated);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la modification du statut postulé.");
    } finally {
      setLoadingAction(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "DISCOVERED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-300">Découvert</span>;
      case "REVIEWING":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">En révision</span>;
      case "READY":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300">Prêt pour envoi</span>;
      case "SUBMITTED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-950 border border-orange-200">Candidature transmise</span>;
      case "INTERVIEW":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-900 border border-sky-300">Entretien planifié</span>;
      case "OFFER":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300">Offre reçue 🎉</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">Non retenu</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">{st}</span>;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/40 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-7xl h-[95vh] rounded-3xl border border-white/80 bg-white/95 backdrop-blur-2xl shadow-2xl ring-1 ring-stone-900/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:px-6 py-4 border-b border-stone-200/80 flex items-center justify-between gap-4 bg-white/85 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100/80 border border-orange-200/80 flex items-center justify-center text-primary font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
                  Vue Miroir de Révision
                </span>
                {getStatusBadge(status)}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground line-clamp-1">
                {job.title} — {job.company}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleApplied}
              disabled={loadingAction}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                isApplied
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300"
                  : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
              }`}
              title={
                isApplied
                  ? "Cliquer pour réintégrer l'offre en prospection"
                  : "Marquer comme déjà postulé (protège contre tout re-scraping)"
              }
            >
              {isApplied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Déjà postulé</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-stone-500" />
                  <span>J'ai déjà postulé</span>
                </>
              )}
            </button>

            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Annonce source</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Notification Banner if any */}
        {errorMsg && (
          <div className="px-6 py-2.5 bg-destructive/15 border-b border-destructive/30 flex items-center justify-between text-xs text-destructive">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="p-1 hover:bg-destructive/20 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Split Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* LEFT PANEL: Job & ATS Details (5 cols) */}
          <div className="lg:col-span-5 border-r border-border/80 flex flex-col h-full overflow-hidden bg-background/50">
            <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Détails de l'opportunité
                </span>
                <AtsScoreBadge match={atsMatch} />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">{job.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    {job.company}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    {job.location || job.country}
                  </span>
                </div>
              </div>

              {/* ATS Skills inventory */}
              {atsMatch && (
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Audit des compétences déterministe
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {atsMatch.matched_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-700" />
                        {s}
                      </span>
                    ))}
                    {atsMatch.transferable_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-300"
                      >
                        ~ {s}
                      </span>
                    ))}
                    {atsMatch.missing_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-900 border border-rose-300"
                      >
                        ✕ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Deep Recon Brief Card if available */}
            {reconDossier && (
              <div className="p-3 mx-4 mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <Compass className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Deep Recon Détecté</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("recon")}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-0.5"
                  >
                    <span>Voir dossier</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                {reconDossier.company_mission && (
                  <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                    {reconDossier.company_mission}
                  </p>
                )}
                {reconDossier.tech_stack_detected && reconDossier.tech_stack_detected.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {reconDossier.tech_stack_detected.slice(0, 4).map((tech) => (
                      <span key={tech} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-emerald-200 text-stone-700">
                        {tech}
                      </span>
                    ))}
                    {reconDossier.tech_stack_detected.length > 4 && (
                      <span className="text-[10px] text-muted-foreground self-center">
                        +{reconDossier.tech_stack_detected.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Scrollable Job Description */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-display">
                Description du poste
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
                {job.description_raw}
              </p>
            </div>
          </div>

          {/* RIGHT PANEL: CV, Cover Letter & Deep Recon Tabs (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-card/60">
            {/* Sub-tabs header */}
            <div className="px-5 py-3 border-b border-border/80 flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("cv")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                    activeTab === "cv"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-stone-100 text-stone-700 hover:text-stone-900"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>CV Adapté</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("letter")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                    activeTab === "letter"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-stone-100 text-stone-700 hover:text-stone-900"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Lettre de motivation</span>
                  {letter && letter.cliche_score > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("recon")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                    activeTab === "recon"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-stone-100 text-stone-700 hover:text-stone-900"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Deep Recon</span>
                  {reconDossier && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>
              </div>

              {/* Language switcher & actions */}
              <div className="flex items-center gap-2">
                {activeTab !== "recon" && (
                  <div className="flex items-center rounded border border-border bg-muted/40 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setCvLanguage("fr");
                        setAppLanguage("fr");
                      }}
                      className={`px-2 py-0.5 rounded transition-all ${
                        cvLanguage === "fr"
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Version Française"
                    >
                      FR
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCvLanguage("en");
                        setAppLanguage("en");
                      }}
                      className={`px-2 py-0.5 rounded transition-all ${
                        cvLanguage === "en"
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="English Version"
                    >
                      EN
                    </button>
                  </div>
                )}

                {activeTab === "cv" && (
                  <>
                    <a
                      href={pdfUrl}
                      download={`CV_${job.company.replace(/\s+/g, "_")}_${cvLanguage.toUpperCase()}.pdf`}
                      className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                    >
                      <span>PDF A4</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setCvLoading(true);
                        generateTargetedCV(job.id, cvLanguage)
                          .then(() => setCvGenerated(true))
                          .finally(() => setCvLoading(false));
                      }}
                      disabled={cvLoading}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                      title="Régénérer le CV"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${cvLoading ? "animate-spin" : ""}`} />
                    </button>
                  </>
                )}

                {activeTab === "letter" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setLetterLoading(true);
                        generateCoverLetter(job.id, cvLanguage)
                          .then((l) => {
                            setLetter(l);
                            setLetterContent(l.content_markdown);
                          })
                          .catch((err) => console.error("Erreur régénération lettre:", err))
                          .finally(() => setLetterLoading(false));
                      }}
                      disabled={letterLoading}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                      title="Régénérer la lettre"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${letterLoading ? "animate-spin" : ""}`} />
                    </button>
                    <LetterDownloadMenu
                      jobId={job.id}
                      jobTitle={job.title}
                      companyName={job.company}
                      content={letterContent}
                      lang={cvLanguage}
                      variant="outline"
                    />
                    <button
                      type="button"
                      onClick={handleSaveLetter}
                      disabled={isLetterSaving}
                      className="px-3 py-1 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {isLetterSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : letterSaveSuccess ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{letterSaveSuccess ? "Sauvegardé" : "Enregistrer"}</span>
                    </button>
                  </>
                )}

                {activeTab === "recon" && (
                  <button
                    type="button"
                    onClick={handleTriggerRecon}
                    disabled={reconScanning}
                    className="px-3 py-1 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {reconScanning ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{reconScanning ? "Scan en cours..." : "Scanner Deep Recon"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sub-tab content */}
            <div className="flex-1 overflow-hidden relative">
              {activeTab === "cv" && (
                <div className="w-full h-full p-2 bg-muted/30 flex items-center justify-center overflow-hidden">
                  {cvLoading ? (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-xs font-medium">Compilation vectorielle du CV A4...</p>
                    </div>
                  ) : (
                    <iframe
                      src={previewUrl}
                      title="Prévisualisation CV"
                      className="w-full h-full rounded-lg border border-border/80 bg-white shadow-inner"
                    />
                  )}
                </div>
              )}

              {activeTab === "letter" && (
                <div className="w-full h-full p-4 flex flex-col gap-3 overflow-hidden bg-background/40">
                  {letterLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-xs font-medium">Synthèse autonome de l'agent rédacteur...</p>
                    </div>
                  ) : (
                    <>
                      {/* Thinking Plan Collapsible Accordion */}
                      {letter?.thinking_plan && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 overflow-hidden transition-all shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowThinkingPlan(!showThinkingPlan)}
                            className="w-full flex items-center justify-between text-left text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
                          >
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>🧠 Plan d'attaque stratégique de l'Agent (Thinking Process)</span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showThinkingPlan ? "rotate-180" : ""}`} />
                          </button>
                          {showThinkingPlan && (
                            <div className="mt-2.5 pt-2 border-t border-primary/15 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans max-h-36 overflow-y-auto">
                              {letter.thinking_plan}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">Édition en direct :</span>
                          <span className="text-[11px]">
                            {letter?.cliche_score === 0 ? (
                              <span className="text-emerald-800 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 0 cliché détecté
                              </span>
                            ) : (
                              <span className="text-amber-900 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> {letter?.cliche_score} cliché(s)
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono">
                          {letterContent.length} caractères
                        </span>
                      </div>

                      <textarea
                        value={letterContent}
                        onChange={(e) => setLetterContent(e.target.value)}
                        className="flex-1 w-full p-4 rounded-xl border border-border bg-card font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                        placeholder="Rédigez ou éditez votre lettre de motivation sobre ici..."
                      />
                    </>
                  )}
                </div>
              )}

              {activeTab === "recon" && (
                <div className="w-full h-full p-5 overflow-y-auto space-y-4 bg-background/50">
                  {/* Recon Header Card */}
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-primary" />
                          <h4 className="text-sm font-bold text-foreground">
                            Dossier Deep Recon (Agent Éclaireur Autonome)
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          L'agent inspecte le portail carrière externe pour cartographier la culture d'entreprise, la mission et extraire l'annonce intégrale sans troncature.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleTriggerRecon}
                        disabled={reconScanning}
                        className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors disabled:opacity-50"
                      >
                        {reconScanning ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Exploration Playwright...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Lancer l'enquête</span>
                          </>
                        )}
                      </button>
                    </div>

                    {reconDossier?.external_url && (
                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono truncate max-w-md">Portail cible : {reconDossier.external_url}</span>
                        <a
                          href={reconDossier.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Visiter le portail</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {reconDossier ? (
                    <div className="space-y-4">
                      {/* Mission & Culture */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <span>🎯 Mission & Enjeux</span>
                          </span>
                          <p className="text-xs text-foreground/90 leading-relaxed">
                            {reconDossier.company_mission || "Mission en cours d'analyse..."}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <span>🌱 Culture & Valeurs Techniques</span>
                          </span>
                          <p className="text-xs text-foreground/90 leading-relaxed">
                            {reconDossier.company_culture || "Culture ingénierie en cours d'analyse..."}
                          </p>
                        </div>
                      </div>

                      {/* Stack détectée */}
                      {reconDossier.tech_stack_detected && reconDossier.tech_stack_detected.length > 0 && (
                        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            💻 Stack & Technologies Détectées
                          </span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {reconDossier.tech_stack_detected.map((tech) => (
                              <span
                                key={tech}
                                className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 border border-stone-200 text-xs font-medium font-mono"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Annonce complète un-truncated */}
                      <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          📄 Texte Intégral sans troncature ({reconDossier.full_description?.length || 0} caractères)
                        </span>
                        <div className="p-3.5 rounded-lg bg-muted/40 font-mono text-xs text-muted-foreground max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-border/50">
                          {reconDossier.full_description || job.description_raw}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center text-center space-y-3">
                      <Compass className="w-10 h-10 text-muted-foreground/50 animate-pulse" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">Aucun dossier Deep Recon pour cette offre</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          Cliquez sur « Lancer l'enquête » pour envoyer l'agent éclaireur Playwright explorer la page carrière de l'entreprise.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR (FSM Workflow & 5-Second Grace Guard) */}
        <div className="p-4 sm:px-6 py-3.5 border-t border-stone-200/80 bg-white/85 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-600 hidden sm:inline font-mono">
              Workflow :
            </span>
            <div className="flex items-center gap-1.5 text-xs font-mono text-stone-500">
              <span className={status === "DISCOVERED" ? "text-primary font-bold" : ""}>Découvert</span>
              <ChevronRight className="w-3 h-3" />
              <span className={status === "REVIEWING" ? "text-amber-800 font-bold" : ""}>Révision</span>
              <ChevronRight className="w-3 h-3" />
              <span className={status === "READY" ? "text-emerald-800 font-bold" : ""}>Prêt</span>
              <ChevronRight className="w-3 h-3" />
              <span className={status === "SUBMITTED" ? "text-orange-950 font-bold" : ""}>Soumis</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* If DISCOVERED */}
            {status === "DISCOVERED" && (
              <button
                type="button"
                onClick={() => handleTransition("REVIEWING")}
                disabled={loadingAction}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2 transition-all tactile-button shadow-artisan-button cursor-pointer disabled:opacity-50"
              >
                {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                <span>Préparer ma candidature</span>
              </button>
            )}

            {/* If REVIEWING */}
            {status === "REVIEWING" && (
              <>
                <button
                  type="button"
                  onClick={() => handleTransition("DISCOVERED")}
                  disabled={loadingAction}
                  className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Retour</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTransition("READY")}
                  disabled={loadingAction}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Valider mon dossier</span>
                </button>
              </>
            )}

            {/* If READY: The Human-in-the-Loop 5-second countdown guard */}
            {status === "READY" && !isCountingDown && (
              <>
                <button
                  type="button"
                  onClick={() => handleTransition("REVIEWING")}
                  disabled={loadingAction}
                  className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Modifier</span>
                </button>

                <button
                  type="button"
                  onClick={startSubmissionCountdown}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2 transition-all tactile-button shadow-artisan-button cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Soumettre la candidature</span>
                </button>
              </>
            )}

            {/* 5-second active countdown modal banner inside bar */}
            {status === "READY" && isCountingDown && (
              <div className="flex items-center gap-3 animate-in fade-in">
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold text-red-800">
                    Envoi dans {countdownSeconds}s...
                  </span>
                </div>

                <button
                  type="button"
                  onClick={cancelSubmissionCountdown}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Annuler immédiatement</span>
                </button>
              </div>
            )}

            {/* If SUBMITTED */}
            {status === "SUBMITTED" && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Candidature transmise</span>
                </div>
                {job.url && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 transition-all tactile-button shadow-artisan-button"
                  >
                    <span>Finaliser sur le site</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
