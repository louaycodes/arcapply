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
  Loader2,
  Building2,
  MapPin,
  ShieldAlert,
  ChevronDown,
  Lock,
  Layers,
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
  const [activeTab, setActiveTab] = useState<"analysis" | "letter" | "cv">("analysis");
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
  const [showThinkingPlan, setShowThinkingPlan] = useState(true);

  // Analyse Profonde state
  const [reconDossier, setReconDossier] = useState<ReconDossier | null>(null);
  const [reconScanning, setReconScanning] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCvLanguage(appLanguage);
  }, [appLanguage]);

  const isAnalysisReady = Boolean(
    reconDossier &&
      (reconDossier.status === "COMPLETED" ||
        reconDossier.company_mission ||
        (reconDossier.tech_stack_detected && reconDossier.tech_stack_detected.length > 0) ||
        (reconDossier.full_description && reconDossier.full_description.length > 50))
  );

  // Initialisation à l'ouverture pour une offre
  useEffect(() => {
    if (job && isOpen) {
      setStatus(job.status);
      setErrorMsg(null);
      setActiveTab("analysis"); // Analyse Profonde par défaut

      // Charger le dossier d'analyse
      fetchReconDossier(job.id)
        .then((d) => setReconDossier(d))
        .catch(() => setReconDossier(null));
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [job?.id, isOpen]);

  // Déclencheur automatique de génération documents quand l'analyse est prête et que l'utilisateur ouvre les onglets
  const handleLoadCV = async () => {
    if (!job || !isAnalysisReady || cvGenerated || cvLoading) return;
    try {
      setCvLoading(true);
      await generateTargetedCV(job.id, cvLanguage);
      setCvGenerated(true);
    } catch (err: any) {
      console.error("Erreur génération CV:", err);
    } finally {
      setCvLoading(false);
    }
  };

  const handleLoadLetter = async () => {
    if (!job || !isAnalysisReady || letter || letterLoading) return;
    try {
      setLetterLoading(true);
      try {
        const existing = await fetchCoverLetter(job.id, cvLanguage);
        setLetter(existing);
        setLetterContent(existing.content_markdown);
      } catch {
        const created = await generateCoverLetter(job.id, cvLanguage);
        setLetter(created);
        setLetterContent(created.content_markdown);
      }
    } catch (err: any) {
      console.error("Erreur génération lettre:", err);
    } finally {
      setLetterLoading(false);
    }
  };

  // Switch d'onglets avec chargement lazy conditionné par l'analyse
  const handleSelectTab = (tab: "analysis" | "letter" | "cv") => {
    setActiveTab(tab);
    if (isAnalysisReady) {
      if (tab === "cv") handleLoadCV();
      if (tab === "letter") handleLoadLetter();
    }
  };

  const handleTriggerRecon = async () => {
    if (!job) return;
    try {
      setReconScanning(true);
      setErrorMsg(null);
      await triggerReconInvestigation(job.id);

      // Polling de vérification
      let attempts = 0;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const dossier = await fetchReconDossier(job.id);
          if (
            dossier &&
            (dossier.status === "COMPLETED" ||
              dossier.company_mission ||
              (dossier.tech_stack_detected && dossier.tech_stack_detected.length > 0) ||
              attempts >= 15)
          ) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setReconDossier(dossier);
            setReconScanning(false);
          }
        } catch {
          if (attempts >= 15) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setReconScanning(false);
          }
        }
      }, 2000);
    } catch (err: any) {
      setReconScanning(false);
      setErrorMsg(err.message || "Erreur lors du lancement de l'analyse profonde.");
    }
  };

  const handleSaveLetter = async () => {
    if (!job || !letterContent) return;
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

  const isApplied = Boolean(
    job?.is_applied ||
      status === "SUBMITTED" ||
      status === "INTERVIEW" ||
      status === "OFFER"
  );

  const handleMarkSubmitted = async () => {
    if (!job) return;
    try {
      setLoadingAction(true);
      const updated = await markJobAsApplied(job.id);
      setStatus(updated.status);
      onJobUpdated?.(updated);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors du marquage comme candidature envoyée.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUnmarkSubmitted = async () => {
    if (!job) return;
    try {
      setLoadingAction(true);
      const updated = await unmarkJobAsApplied(job.id);
      setStatus(updated.status);
      onJobUpdated?.(updated);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'annulation du marquage.");
    } finally {
      setLoadingAction(false);
    }
  };

  if (!isOpen || !job) return null;

  const pdfUrl = getCVPdfDownloadUrl(job.id, cvLanguage);
  const previewUrl = getCVPreviewUrl(job.id, cvLanguage);

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
                  Analyse Profonde & Préparation
                </span>
                {isApplied ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Candidature envoyée
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-300">
                    À postuler
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground line-clamp-1">
                {job.title} — {job.company}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(job.apply_url || job.url) && (
              <a
                href={job.apply_url || job.url}
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

        {/* Error Banner */}
        {errorMsg && (
          <div className="px-6 py-2.5 bg-destructive/15 border-b border-destructive/30 flex items-center justify-between text-xs text-destructive">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="p-1 hover:bg-destructive/20 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Split Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* LEFT PANEL: Job Summary & ATS Match (4 cols) */}
          <div className="lg:col-span-4 border-r border-border/80 flex flex-col h-full overflow-hidden bg-background/50">
            <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Fiche de l'opportunité
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
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    {job.location || job.country}
                  </span>
                </div>
              </div>

              {/* Status de l'Analyse Profonde */}
              <div className="pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Analyse Profonde :</span>
                  {reconScanning ? (
                    <span className="text-primary font-semibold flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scan en cours...
                    </span>
                  ) : isAnalysisReady ? (
                    <span className="text-emerald-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Prête & exploitée
                    </span>
                  ) : (
                    <span className="text-amber-800 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Non effectuée
                    </span>
                  )}
                </div>
              </div>

              {/* ATS Skills inventory */}
              {atsMatch && (
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Audit des compétences
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
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Raw Job Snippet */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-display">
                Extrait brut d'annonce
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
                {job.description_raw}
              </p>
            </div>
          </div>

          {/* RIGHT PANEL: Analyse Profonde, CV & Lettre (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-full overflow-hidden bg-card/60">
            {/* Tabs Header */}
            <div className="px-5 py-3 border-b border-border/80 flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectTab("analysis")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === "analysis"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-stone-100 text-stone-700 hover:text-stone-900"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyse Profonde</span>
                  {isAnalysisReady && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab("letter")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === "letter"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-stone-100 text-stone-700 hover:text-stone-900"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Lettre de motivation</span>
                  {!isAnalysisReady && (
                    <Lock className="w-3 h-3 text-stone-400 ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab("cv")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === "cv"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-stone-100 text-stone-700 hover:text-stone-900"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>CV Ciblé</span>
                  {!isAnalysisReady && (
                    <Lock className="w-3 h-3 text-stone-400 ml-0.5" />
                  )}
                </button>
              </div>

              {/* Language switcher & Tab Actions */}
              <div className="flex items-center gap-2">
                {activeTab !== "analysis" && isAnalysisReady && (
                  <div className="flex items-center rounded border border-border bg-muted/40 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setCvLanguage("fr");
                        setAppLanguage("fr");
                        if (activeTab === "cv") {
                          setCvLoading(true);
                          generateTargetedCV(job.id, "fr")
                            .then(() => setCvGenerated(true))
                            .finally(() => setCvLoading(false));
                        }
                        if (activeTab === "letter") {
                          setLetterLoading(true);
                          generateCoverLetter(job.id, "fr")
                            .then((l) => {
                              setLetter(l);
                              setLetterContent(l.content_markdown);
                            })
                            .finally(() => setLetterLoading(false));
                        }
                      }}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
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
                        if (activeTab === "cv") {
                          setCvLoading(true);
                          generateTargetedCV(job.id, "en")
                            .then(() => setCvGenerated(true))
                            .finally(() => setCvLoading(false));
                        }
                        if (activeTab === "letter") {
                          setLetterLoading(true);
                          generateCoverLetter(job.id, "en")
                            .then((l) => {
                              setLetter(l);
                              setLetterContent(l.content_markdown);
                            })
                            .finally(() => setLetterLoading(false));
                        }
                      }}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
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

                {activeTab === "cv" && isAnalysisReady && (
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
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                      title="Régénérer le CV"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${cvLoading ? "animate-spin" : ""}`} />
                    </button>
                  </>
                )}

                {activeTab === "letter" && isAnalysisReady && (
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
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
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
                      className="px-3 py-1 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
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

                {activeTab === "analysis" && (
                  <button
                    type="button"
                    onClick={handleTriggerRecon}
                    disabled={reconScanning}
                    className="px-3 py-1 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {reconScanning ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{reconScanning ? "Analyse en cours..." : "Lancer l'Analyse Profonde"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-hidden relative">
              {/* TAB 1: ANALYSE PROFONDE */}
              {activeTab === "analysis" && (
                <div className="w-full h-full p-5 overflow-y-auto space-y-4 bg-background/50">
                  {/* Header Card Analyse Profonde */}
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <h4 className="text-sm font-bold text-foreground">
                            Analyse Profonde de l'Offre & de l'Entreprise
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          L'Agent IA inspecte le portail carrière pour cartographier la culture d'entreprise, la mission stratégique, extraire la stack technique requise et l'annonce intégrale sans troncature.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleTriggerRecon}
                        disabled={reconScanning}
                        className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {reconScanning ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Exploration de l'offre...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isAnalysisReady ? "Actualiser l'analyse" : "Lancer l'analyse"}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {reconDossier?.external_url && (
                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono truncate max-w-md">Portail source : {reconDossier.external_url}</span>
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

                  {reconScanning ? (
                    <div className="p-12 rounded-xl border border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-center space-y-3">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          Analyse approfondie en cours par l'Agent IA...
                        </p>
                        <p className="text-xs text-muted-foreground max-w-md">
                          Extraction de la stack technique, analyse des critères d'ingénierie et de la mission de l'entreprise.
                        </p>
                      </div>
                    </div>
                  ) : isAnalysisReady && reconDossier ? (
                    <div className="space-y-4">
                      {/* Mission & Culture */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-primary" />
                            <span>Mission & Enjeux Clés</span>
                          </span>
                          <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                            {reconDossier.company_mission || "Mission en cours d'analyse..."}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            <span>Culture & Valeurs Techniques</span>
                          </span>
                          <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                            {reconDossier.company_culture || "Culture ingénierie en cours d'analyse..."}
                          </p>
                        </div>
                      </div>

                      {/* Stack Technique Détectée */}
                      {reconDossier.tech_stack_detected && reconDossier.tech_stack_detected.length > 0 && (
                        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Stack & Technologies Requises par l'Offre
                          </span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {reconDossier.tech_stack_detected.map((tech) => (
                              <span
                                key={tech}
                                className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 border border-stone-200 text-xs font-semibold font-mono"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Descriptif Intégral Scrappé */}
                      <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Descriptif Intégral Scrappé ({reconDossier.full_description?.length || job.description_raw?.length || 0} caractères)
                          </span>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/40 font-mono text-xs text-stone-800 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-border/50">
                          {reconDossier.full_description || job.description_raw}
                        </div>
                      </div>

                      {/* Action directe vers la préparation des documents */}
                      <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <h5 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Analyse Profonde Complète : Documents débloqués</span>
                          </h5>
                          <p className="text-[11px] text-emerald-800">
                            La lettre de motivation et le CV ciblé exploitent 100% de cette analyse et de votre profil.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectTab("letter")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Générer la Lettre
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectTab("cv")}
                            className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Générer le CV
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center text-center space-y-3">
                      <Sparkles className="w-10 h-10 text-muted-foreground/50 animate-pulse" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          Aucune Analyse Profonde effectuée pour cette offre
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          Cliquez sur « Lancer l'Analyse Profonde » ci-dessus pour inspecter l'offre, extraire la stack technique et débloquer la génération de la lettre et du CV sur-mesure.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleTriggerRecon}
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-artisan-button cursor-pointer"
                      >
                        Lancer l'Analyse Profonde
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LETTRE DE MOTIVATION */}
              {activeTab === "letter" && (
                <div className="w-full h-full p-4 flex flex-col gap-3 overflow-hidden bg-background/40">
                  {!isAnalysisReady ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 max-w-md">
                        <h4 className="text-sm font-bold text-foreground">
                          Analyse Profonde Requise
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Pour générer une lettre de motivation sur-mesure rigoureusement alignée sur l'entreprise (zéro hallucination), l'analyse approfondie de l'offre doit d'abord être terminée.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("analysis");
                          handleTriggerRecon();
                        }}
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-artisan-button cursor-pointer"
                      >
                        Lancer l'Analyse Profonde
                      </button>
                    </div>
                  ) : letterLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-xs font-medium">Synthèse de la lettre en s'appuyant sur le profil et l'analyse...</p>
                    </div>
                  ) : (
                    <>
                      {/* Plan de raisonnement stratégique */}
                      {letter?.thinking_plan && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 overflow-hidden transition-all shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowThinkingPlan(!showThinkingPlan)}
                            className="w-full flex items-center justify-between text-left text-xs font-semibold text-primary hover:opacity-80 transition-opacity cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Plan d'argumentation sur-mesure (Thinking Process)</span>
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
                        placeholder="Rédigez ou éditez votre lettre de motivation sur-mesure ici..."
                      />
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: CV CIBLÉ */}
              {activeTab === "cv" && (
                <div className="w-full h-full p-2 bg-muted/30 flex items-center justify-center overflow-hidden">
                  {!isAnalysisReady ? (
                    <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 max-w-md">
                        <h4 className="text-sm font-bold text-foreground">
                          Analyse Profonde Requise
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Pour aligner le CV sur la stack technique et les besoins exacts de l'offre sans aucune hallucination, l'analyse approfondie doit d'abord être effectuée.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("analysis");
                          handleTriggerRecon();
                        }}
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-artisan-button cursor-pointer"
                      >
                        Lancer l'Analyse Profonde
                      </button>
                    </div>
                  ) : cvLoading ? (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-xs font-medium">Compilation vectorielle du CV A4 ciblé...</p>
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
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 sm:px-6 py-3.5 border-t border-stone-200/80 bg-white/85 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-600 font-mono">
              Statut :
            </span>
            {isApplied ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Candidature envoyée</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                À postuler
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {(job.apply_url || job.url) && (
              <a
                href={job.apply_url || job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 hover:text-stone-900 transition-colors"
              >
                <span>Postuler sur le site source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {isApplied ? (
              <button
                type="button"
                onClick={handleUnmarkSubmitted}
                disabled={loadingAction}
                className="px-4 py-2 rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                title="Cliquer pour annuler et marquer comme non envoyée"
              >
                {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                <span>Candidature déjà envoyée (Cliquer pour annuler)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMarkSubmitted}
                disabled={loadingAction}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2 transition-all tactile-button shadow-artisan-button cursor-pointer disabled:opacity-50"
              >
                {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Marquer comme candidature envoyée</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
