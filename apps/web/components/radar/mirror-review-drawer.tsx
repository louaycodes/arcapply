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
  downloadTargetedCVPdf,
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
  Layers,
  Briefcase,
  Download,
  Brain,
} from "lucide-react";
import { LetterDownloadMenu } from "./letter-download-menu";

function renderInlineMarkdown(text: string) {
  const tokens = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g);
  return tokens.map((token, i) => {
    if (token.startsWith("***") && token.endsWith("***") && token.length > 6) {
      return (
        <strong key={i} className="font-bold text-primary underline decoration-primary/40">
          {token.slice(3, -3)}
        </strong>
      );
    }
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return (
        <strong key={i} className="font-bold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return (
        <span key={i} className="italic text-foreground/80">
          {token.slice(1, -1)}
        </span>
      );
    }
    const clean = token.replace(/\*{1,3}/g, "");
    return <span key={i}>{clean}</span>;
  });
}

function FormattedThinkingPlan({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let currentBullets: string[] = [];

  const flushBullets = (key: string | number) => {
    if (currentBullets.length === 0) return;
    const items = [...currentBullets];
    currentBullets = [];
    nodes.push(
      <ul key={`ul-${key}`} className="space-y-2 my-2.5 pl-1">
        {items.map((item, bIdx) => (
          <li key={bIdx} className="flex items-start gap-2.5 text-xs text-foreground/90 leading-relaxed font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <div className="flex-1">{renderInlineMarkdown(item)}</div>
          </li>
        ))}
      </ul>
    );
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      flushBullets(idx);
      return;
    }

    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line)) {
      flushBullets(idx);
      nodes.push(<hr key={`hr-${idx}`} className="my-3 border-border/60" />);
      return;
    }

    if (/^#{1,6}\s+/.test(line)) {
      flushBullets(idx);
      const heading = line.replace(/^#{1,6}\s+/, "").replace(/\*{1,3}/g, "").trim();
      const isSub = line.startsWith("####");
      nodes.push(
        <div key={`h-${idx}`} className="pt-3 pb-1 border-b border-border/60 first:pt-0">
          <h4 className={`font-bold text-foreground flex items-center gap-2 ${isSub ? "text-xs text-primary" : "text-xs sm:text-sm"}`}>
            <span className="w-1.5 h-1.5 rounded-xs bg-primary shrink-0" />
            <span>{heading}</span>
          </h4>
        </div>
      );
      return;
    }

    if (/^[\*\-•]\s+/.test(line)) {
      const bullet = line.replace(/^[\*\-•]\s+/, "").trim();
      currentBullets.push(bullet);
      return;
    }

    flushBullets(idx);
    nodes.push(
      <p key={`p-${idx}`} className="text-xs text-muted-foreground leading-relaxed my-1 font-sans">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushBullets("end");

  return <div className="space-y-1">{nodes}</div>;
}

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
  const { language: appLanguage, t } = useAppLanguage();
  const [activeTab, setActiveTab] = useState<"letter" | "cv">("letter");
  const [status, setStatus] = useState<string>("DISCOVERED");
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // CV state
  const [cvLoading, setCvLoading] = useState(false);
  const [cvGenerated, setCvGenerated] = useState(false);
  const [cvLanguage, setCvLanguage] = useState<"fr" | "en">(appLanguage);
  const [isDownloadingCv, setIsDownloadingCv] = useState(false);

  // Letter state
  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterContent, setLetterContent] = useState("");
  const [isLetterSaving, setIsLetterSaving] = useState(false);
  const [letterSaveSuccess, setLetterSaveSuccess] = useState(false);
  const [showThinkingPlan, setShowThinkingPlan] = useState(false);

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
      setActiveTab("letter");
      setShowThinkingPlan(false);

      // Charger le dossier d'analyse
      fetchReconDossier(job.id)
        .then((d) => {
          setReconDossier(d);
          const ready = Boolean(
            d &&
              (d.status === "COMPLETED" ||
                d.company_mission ||
                (d.tech_stack_detected && d.tech_stack_detected.length > 0) ||
                (d.full_description && d.full_description.length > 50))
          );
          if (ready) {
            // Charger la lettre si déjà existante
            fetchCoverLetter(job.id, cvLanguage)
              .then((existing) => {
                setLetter(existing);
                setLetterContent(existing.content_markdown);
              })
              .catch(() => {
                // Pas de lettre préalablement générée
              });
          }
        })
        .catch(() => setReconDossier(null));
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [job?.id, isOpen]);

  // Génération CV
  const handleLoadCV = async () => {
    if (!job || !isAnalysisReady || cvLoading) return;
    try {
      setCvLoading(true);
      setErrorMsg(null);
      await generateTargetedCV(job.id, cvLanguage);
      setCvGenerated(true);
    } catch (err: any) {
      console.error("Erreur génération CV:", err);
      setErrorMsg(
        err?.message ||
          t("Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement.", "The AI model ran into a problem. Please try again later.")
      );
    } finally {
      setCvLoading(false);
    }
  };

  // Génération Lettre
  const handleLoadLetter = async () => {
    if (!job || !isAnalysisReady || letterLoading) return;
    try {
      setLetterLoading(true);
      setErrorMsg(null);
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
      setErrorMsg(
        err?.message ||
          t("Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement.", "The AI model ran into a problem. Please try again later.")
      );
    } finally {
      setLetterLoading(false);
    }
  };

  const handleSelectTab = (tab: "letter" | "cv") => {
    setActiveTab(tab);
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
      setErrorMsg(err.message || t("Erreur lors du lancement de l'analyse profonde.", "Error while starting the deep analysis."));
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
      setErrorMsg(err.message || t("Erreur lors de la sauvegarde de la lettre.", "Error while saving the letter."));
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
      setErrorMsg(err.message || t("Erreur lors du marquage comme candidature envoyée.", "Error while marking as application sent."));
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
      setErrorMsg(err.message || t("Erreur lors de l'annulation du marquage.", "Error while undoing the mark."));
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
      className="fixed inset-0 z-50 !mt-0 flex items-center justify-center p-2 sm:p-4 bg-stone-950/40 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-7xl h-[95dvh] rounded-2xl sm:rounded-3xl border border-white/80 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 backdrop-blur-2xl shadow-2xl ring-1 ring-stone-900/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3 sm:px-6 sm:py-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3 sm:gap-4 bg-white/85 dark:bg-stone-900/85 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-xl bg-orange-100/80 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/60 items-center justify-center text-primary font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-primary">
                  {t("Analyse Profonde & Préparation", "Deep Analysis & Preparation")}
                </span>
                {isApplied ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {t("Candidature envoyée", "Application sent")}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
                    {t("À postuler", "To apply")}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground line-clamp-1">
                {job.title} — {job.company}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(job.apply_url || job.url) && (
              <a
                href={job.apply_url || job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t("Annonce source", "Source listing")}</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title={t("Fermer", "Close")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="px-4 sm:px-6 py-2.5 bg-destructive/15 border-b border-destructive/30 flex items-center justify-between text-xs text-destructive">
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
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
          {/* LEFT PANEL: 100% ANALYSE PROFONDE, STACK & SCRAPED DETAILS (5 cols) */}
          <div className={`${isAnalysisReady ? "lg:col-span-5 border-b lg:border-b-0 lg:border-r border-border/80" : "lg:col-span-12"} flex flex-col lg:h-full lg:overflow-hidden bg-background/50`}>
            <div className={`lg:flex-1 lg:overflow-y-auto p-4 sm:p-5 space-y-4 ${isAnalysisReady ? "" : "w-full max-w-3xl mx-auto"}`}>
              {/* Opportunity Card */}
              <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("Fiche de l'opportunité", "Opportunity sheet")}
                  </span>
                  <AtsScoreBadge match={atsMatch} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {job.company}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      {job.location || job.country}
                    </span>
                    {job.offer_type && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-muted-foreground" />
                          {job.offer_type}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Audit des compétences ATS */}
                {atsMatch && (
                  <div className="pt-2 border-t border-border/40 space-y-2">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("Audit des compétences (ATS)", "Skills audit (ATS)")}
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {atsMatch.matched_skills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                          {s}
                        </span>
                      ))}
                      {atsMatch.transferable_skills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        >
                          ~ {s}
                        </span>
                      ))}
                      {atsMatch.missing_skills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Analyse Profonde Header Card */}
              <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary shrink-0" />
                      <h4 className="text-sm font-bold text-foreground">
                        {t("Analyse Profonde de l'Offre & de l'Entreprise", "Deep Analysis of the Offer & the Company")}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("L'Agent IA inspecte le portail carrière pour cartographier la culture d'entreprise, la mission stratégique, extraire la stack technique requise et l'annonce intégrale sans troncature.", "The AI Agent inspects the career portal to map the company culture and strategic mission, and to extract the required tech stack and the full, untruncated listing.")}
                    </p>
                  </div>

                  {!isAnalysisReady && (
                    <button
                      type="button"
                      onClick={handleTriggerRecon}
                      disabled={reconScanning}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {reconScanning ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t("Analyse...", "Analyzing...")}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{t("Lancer l'analyse", "Start analysis")}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* État de chargement du scan */}
              {reconScanning && (
                <div className="p-8 rounded-xl border border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-xs font-semibold text-foreground">
                    {t("Analyse approfondie en cours par l'Agent IA...", "Deep analysis in progress by the AI Agent...")}
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-sm">
                    {t("Extraction de la stack technique, analyse des critères d'ingénierie et de la mission de l'entreprise.", "Extracting the tech stack and analyzing the engineering criteria and the company's mission.")}
                  </p>
                </div>
              )}

              {/* Contenu de l'Analyse Profonde en 2 parties seulement */}
              {isAnalysisReady && reconDossier ? (
                <>
                  {/* Partie 1 : Stack & Technologies Requises par l'Offre (section séparée) */}
                  {reconDossier.tech_stack_detected && reconDossier.tech_stack_detected.length > 0 && (
                    <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>{t("Stack & Technologies Requises par l'Offre", "Stack & Technologies Required by the Offer")}</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {reconDossier.tech_stack_detected.map((tech) => (
                          <span
                            key={tech}
                            className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-xs font-semibold font-mono"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Partie 2 : Détails & Analyse fusionnés ensemble pour une meilleure lisibilité */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-4 text-xs text-foreground/90 leading-relaxed font-sans">
                    {/* Portail source */}
                    {(reconDossier?.external_url || job.apply_url || job.url) && (
                      <div className="pb-3 border-b border-border/80 flex items-center justify-between gap-2">
                        <div className="min-w-0 pr-2">
                          <strong className="font-bold text-foreground">{t("Portail source :", "Source portal:")} </strong>
                          <span className="font-mono text-muted-foreground text-[11px] truncate inline-block max-w-[260px] align-bottom">
                            {reconDossier?.external_url || job.apply_url || job.url}
                          </span>
                        </div>
                        <a
                          href={reconDossier?.external_url || job.apply_url || job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-semibold shrink-0"
                        >
                          <span>{t("Visiter le portail", "Visit the portal")}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Mission & Enjeux Clés */}
                    {reconDossier.company_mission && (
                      <div className="space-y-1">
                        <strong className="block font-bold text-foreground">{t("Mission & Enjeux Clés", "Mission & Key Stakes")}</strong>
                        <p className="text-muted-foreground leading-relaxed">
                          {reconDossier.company_mission}
                        </p>
                      </div>
                    )}

                    {/* Culture & Valeurs Techniques */}
                    {reconDossier.company_culture && (
                      <div className="space-y-1">
                        <strong className="block font-bold text-foreground">{t("Culture & Valeurs Techniques", "Culture & Technical Values")}</strong>
                        <p className="text-muted-foreground leading-relaxed">
                          {reconDossier.company_culture}
                        </p>
                      </div>
                    )}

                    {/* Descriptif Intégral Scrappé */}
                    <div className="space-y-1.5 pt-2 border-t border-border/80">
                      <strong className="block font-bold text-foreground">
                        {t(
                          `Descriptif Intégral Scrappé (${reconDossier.full_description?.length || job.description_raw?.length || 0} caractères)`,
                          `Full Scraped Description (${reconDossier.full_description?.length || job.description_raw?.length || 0} characters)`
                        )}
                      </strong>
                      <div className="p-3.5 rounded-lg bg-muted/40 font-mono text-[11px] text-stone-800 dark:text-stone-300 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-border/50">
                        {reconDossier.full_description || job.description_raw}
                      </div>
                    </div>
                  </div>
                </>
              ) : !reconScanning && (
                <div className="p-6 rounded-xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-muted-foreground/50 animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                      {t("Aucune Analyse Profonde effectuée pour cette offre", "No Deep Analysis run for this offer yet")}
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-xs">
                      {t("Cliquez sur « Lancer l'analyse » pour inspecter l'offre, extraire la stack technique et débloquer les documents personnalisés.", "Click \u201cStart analysis\u201d to inspect the offer, extract the tech stack and unlock the tailored documents.")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL : lettre & CV, affiché uniquement une fois l'Analyse Profonde terminée */}
          {isAnalysisReady && (
          <div className="lg:col-span-7 flex flex-col lg:h-full lg:overflow-hidden bg-card/60">
            {/* Tabs Header */}
            <div className="px-3 sm:px-5 py-3 border-b border-border/80 flex flex-wrap items-center justify-between gap-2 bg-muted/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectTab("letter")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === "letter"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{t("Lettre de motivation", "Cover letter")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab("cv")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === "cv"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t("CV Ciblé", "Tailored CV")}</span>
                </button>
              </div>

              {/* Language switcher & Tab Actions */}
              <div className="flex items-center gap-2">
                {isAnalysisReady && (
                  <div className="flex items-center rounded border border-border bg-muted/40 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setCvLanguage("fr");
                        if (activeTab === "cv") {
                          setCvLoading(true);
                          generateTargetedCV(job.id, "fr")
                            .then(() => setCvGenerated(true))
                            .catch((err) =>
                              setErrorMsg(
                                err?.message ||
                                  t("Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement.", "The AI model ran into a problem. Please try again later.")
                              )
                            )
                            .finally(() => setCvLoading(false));
                        }
                        if (activeTab === "letter") {
                          setLetterLoading(true);
                          generateCoverLetter(job.id, "fr")
                            .then((l) => {
                              setLetter(l);
                              setLetterContent(l.content_markdown);
                            })
                            .catch((err) =>
                              setErrorMsg(
                                err?.message ||
                                  t("Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement.", "The AI model ran into a problem. Please try again later.")
                              )
                            )
                            .finally(() => setLetterLoading(false));
                        }
                      }}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        cvLanguage === "fr"
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={t("Version Française", "French version")}
                    >
                      FR
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCvLanguage("en");
                        if (activeTab === "cv") {
                          setCvLoading(true);
                          generateTargetedCV(job.id, "en")
                            .then(() => setCvGenerated(true))
                            .catch((err) =>
                              setErrorMsg(
                                err?.message ||
                                  t("Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement.", "The AI model ran into a problem. Please try again later.")
                              )
                            )
                            .finally(() => setCvLoading(false));
                        }
                        if (activeTab === "letter") {
                          setLetterLoading(true);
                          generateCoverLetter(job.id, "en")
                            .then((l) => {
                              setLetter(l);
                              setLetterContent(l.content_markdown);
                            })
                            .catch((err) =>
                              setErrorMsg(
                                err?.message ||
                                  t("Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement.", "The AI model ran into a problem. Please try again later.")
                              )
                            )
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
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setIsDownloadingCv(true);
                          await downloadTargetedCVPdf({
                            jobId: job.id,
                            companyName: job.company,
                            lang: cvLanguage,
                          });
                        } catch (err: any) {
                          setErrorMsg(err?.message || t("Erreur lors du téléchargement du CV.", "Error while downloading the CV."));
                        } finally {
                          setIsDownloadingCv(false);
                        }
                      }}
                      disabled={isDownloadingCv}
                      className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                      title={t(`Télécharger le CV pour ${job.company}`, `Download the CV for ${job.company}`)}
                    >
                      {isDownloadingCv ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>PDF A4</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCvLoading(true);
                        setErrorMsg(null);
                        generateTargetedCV(job.id, cvLanguage)
                          .then(() => setCvGenerated(true))
                          .catch((err) =>
                            setErrorMsg(
                              err?.message ||
                                t("Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement.", "The AI model ran into a problem. Please try again later.")
                            )
                          )
                          .finally(() => setCvLoading(false));
                      }}
                      disabled={cvLoading}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                      title={t("Régénérer le CV", "Regenerate the CV")}
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
                        setErrorMsg(null);
                        generateCoverLetter(job.id, cvLanguage)
                          .then((l) => {
                            setLetter(l);
                            setLetterContent(l.content_markdown);
                          })
                          .catch((err) =>
                            setErrorMsg(
                              err?.message ||
                                t("Le modèle IA rencontre un problème. Veuillez réessayer ultérieurement.", "The AI model ran into a problem. Please try again later.")
                            )
                          )
                          .finally(() => setLetterLoading(false));
                      }}
                      disabled={letterLoading}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                      title={t("Régénérer la lettre", "Regenerate the letter")}
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
                      placement="bottom"
                    />
                    <button
                      type="button"
                      onClick={handleSaveLetter}
                      disabled={isLetterSaving}
                      className="px-3 py-1 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isLetterSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : letterSaveSuccess ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{letterSaveSuccess ? t("Sauvegardé", "Saved") : t("Enregistrer", "Save")}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Document Content Area */}
            <div className="flex-1 overflow-hidden relative min-h-[75dvh] lg:min-h-0">
              {/* Message d'erreur spécifique du modèle si applicable */}
              {errorMsg && (
                <div className="p-4 m-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{errorMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === "letter") handleLoadLetter();
                      if (activeTab === "cv") handleLoadCV();
                    }}
                    className="px-3 py-1 rounded-md bg-destructive text-white hover:bg-destructive/90 text-xs font-semibold cursor-pointer shrink-0"
                  >
                    {t("Réessayer", "Retry")}
                  </button>
                </div>
              )}

              {/* Si Analyse non effectuée */}
              {activeTab === "letter" ? (
                /* SECTION LETTRE DE MOTIVATION */
                <div className="w-full h-full p-4 flex flex-col gap-3 overflow-hidden bg-background/40">
                  {letterLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-xs font-medium">{t("Rédaction de la lettre sur-mesure par l'Agent IA...", "The AI Agent is writing your tailored letter...")}</p>
                    </div>
                  ) : !letter && !errorMsg ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                      <Mail className="w-10 h-10 text-muted-foreground/50" />
                      <p className="text-xs">{t("Aucune lettre générée pour cette offre.", "No letter generated for this offer yet.")}</p>
                      <button
                        type="button"
                        onClick={handleLoadLetter}
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold cursor-pointer"
                      >
                        {t("Générer la lettre", "Generate the letter")}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{t("Édition en direct :", "Live editing:")}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {t(
                              `${letterContent.trim().split(/\s+/).filter(Boolean).length} mots`,
                              `${letterContent.trim().split(/\s+/).filter(Boolean).length} words`
                            )}
                          </span>
                          {letter?.thinking_plan && (
                            <button
                              type="button"
                              onClick={() => setShowThinkingPlan(!showThinkingPlan)}
                              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                                showThinkingPlan
                                  ? "border-primary bg-primary text-white scale-105"
                                  : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105"
                              }`}
                              title={t("Plan d'argumentation sur-mesure (Thinking Process)", "Tailored argument plan (Thinking Process)")}
                              aria-label={t("Plan d'argumentation sur-mesure (Thinking Process)", "Tailored argument plan (Thinking Process)")}
                            >
                              <Brain className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] font-mono">
                          {t(`${letterContent.length} caractères`, `${letterContent.length} characters`)}
                        </span>
                      </div>

                      {/* Affichage formaté du Thinking Process uniquement au clic sur l'icône */}
                      {showThinkingPlan && letter?.thinking_plan && (
                        <div className="rounded-xl border border-primary/30 bg-card p-4 shadow-md space-y-3 shrink-0 transition-all animate-in fade-in zoom-in-95">
                          <div className="flex items-center justify-between pb-2 border-b border-border/80">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Brain className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-foreground">
                                  {t("Plan d'argumentation sur-mesure (Thinking Process)", "Tailored argument plan (Thinking Process)")}
                                </h5>
                                <p className="text-[10px] text-muted-foreground">
                                  {t(
                                    `Raisonnement stratégique de l'Agent IA pour ${job.company}`,
                                    `AI Agent strategic reasoning for ${job.company}`
                                  )}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowThinkingPlan(false)}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title={t("Fermer", "Close")}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 font-sans text-xs text-foreground/90 leading-relaxed">
                            <FormattedThinkingPlan content={letter.thinking_plan} />
                          </div>
                        </div>
                      )}

                      <textarea
                        value={letterContent}
                        onChange={(e) => setLetterContent(e.target.value)}
                        className="flex-1 w-full p-4 rounded-xl border border-border bg-card font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                        placeholder={t("Rédigez ou éditez votre lettre de motivation sur-mesure ici...", "Write or edit your tailored cover letter here...")}
                      />
                    </>
                  )}
                </div>
              ) : (
                /* SECTION CV CIBLÉ */
                <div className="w-full h-full p-2 bg-muted/30 flex items-center justify-center overflow-hidden">
                  {cvLoading ? (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-xs font-medium">{t("Compilation vectorielle du CV A4 ciblé...", "Compiling the tailored A4 vector CV...")}</p>
                    </div>
                  ) : !cvGenerated && !errorMsg ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                      <FileText className="w-10 h-10 text-muted-foreground/50" />
                      <p className="text-xs">{t("Le CV ciblé n'a pas encore été généré.", "The tailored CV has not been generated yet.")}</p>
                      <button
                        type="button"
                        onClick={handleLoadCV}
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold cursor-pointer"
                      >
                        {t("Générer le CV ciblé", "Generate the tailored CV")}
                      </button>
                    </div>
                  ) : (
                    <iframe
                      src={previewUrl}
                      title={t("Prévisualisation CV", "CV preview")}
                      className="w-full h-full rounded-lg border border-border/80 bg-white shadow-inner"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-3 sm:px-6 sm:py-3.5 border-t border-stone-200/80 dark:border-stone-800 bg-white/85 dark:bg-stone-900/85 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 font-mono">
              {t("Statut :", "Status:")}
            </span>
            {isApplied ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>{t("Candidature envoyée", "Application sent")}</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                {t("À postuler", "To apply")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {(job.apply_url || job.url) && (
              <a
                href={job.apply_url || job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                <span>{t("Postuler sur le site source", "Apply on the source site")}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {isApplied ? (
              <button
                type="button"
                onClick={handleUnmarkSubmitted}
                disabled={loadingAction}
                className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                title={t("Cliquer pour annuler et marquer comme non envoyée", "Click to cancel and mark as not sent")}
              >
                {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                <span>{t("Candidature déjà envoyée (Cliquer pour annuler)", "Application already sent (Click to cancel)")}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMarkSubmitted}
                disabled={loadingAction}
                className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2 transition-all tactile-button shadow-artisan-button cursor-pointer disabled:opacity-50"
              >
                {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{t("Marquer comme candidature envoyée", "Mark as application sent")}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
