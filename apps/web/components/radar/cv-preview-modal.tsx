"use client";

import { useEffect, useState } from "react";
import {
  JobOffer,
  TargetedCV,
  generateTargetedCV,
  getCVPreviewUrl,
  getCVPdfDownloadUrl,
} from "@/lib/api";
import {
  FileText,
  Download,
  ExternalLink,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Layers,
  Sparkles,
} from "lucide-react";

interface CVPreviewModalProps {
  job: JobOffer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CVPreviewModal({ job, isOpen, onClose }: CVPreviewModalProps) {
  const [cv, setCv] = useState<TargetedCV | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "audit">("preview");
  const [language, setLanguage] = useState<"fr" | "en">("fr");

  const loadOrGenerateCV = async () => {
    if (!job) return;
    try {
      setLoading(true);
      setError(null);
      const generated = await generateTargetedCV(job.id, language);
      setCv(generated);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la génération du CV ciblé.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && job) {
      loadOrGenerateCV();
    } else {
      setCv(null);
      setError(null);
    }
  }, [isOpen, job?.id, language]);

  if (!isOpen || !job) return null;

  const pdfUrl = getCVPdfDownloadUrl(job.id, language);
  const previewUrl = getCVPreviewUrl(job.id, language);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[92vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between gap-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  CV Ciblé ATS — 1 Page A4
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Zéro-Hallucination
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {job.title} &bull; <span className="font-semibold text-foreground">{job.company}</span>
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-semibold mr-1">
              <button
                type="button"
                onClick={() => setLanguage("fr")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  language === "fr"
                    ? "bg-primary text-primary-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Version Française"
              >
                🇫🇷 FR
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  language === "en"
                    ? "bg-primary text-primary-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="English Version"
              >
                🇬🇧 EN
              </button>
            </div>

            <a
              href={pdfUrl}
              download
              className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Télécharger PDF ({language.toUpperCase()})</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Sub-toolbar */}
        <div className="px-5 py-2.5 border-b border-border/50 bg-card flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === "preview"
                  ? "bg-secondary text-secondary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Aperçu Document (A4)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === "audit"
                  ? "bg-secondary text-secondary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Audit & Compétences Ciblées</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadOrGenerateCV}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Régénérer</span>
            </button>

            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-muted/40 p-4 sm:p-6 overflow-y-auto flex justify-center items-start">
          {loading ? (
            <div className="m-auto text-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-muted-foreground">
                Génération du CV ciblé & ordonnancement des réalisations...
              </p>
            </div>
          ) : error ? (
            <div className="m-auto max-w-md p-6 rounded-xl border border-destructive/30 bg-destructive/10 text-center space-y-3">
              <p className="text-sm font-semibold text-destructive">{error}</p>
              <button
                type="button"
                onClick={loadOrGenerateCV}
                className="px-4 py-2 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : activeTab === "preview" ? (
            <div className="w-full max-w-[800px] bg-white rounded-lg shadow-2xl border border-border/80 overflow-hidden flex flex-col h-[74vh]">
              <iframe
                src={previewUrl}
                title="Aperçu CV A4"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          ) : (
            <div className="w-full max-w-2xl bg-card rounded-xl border border-border p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Synthèse d'ordonnancement du CV
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Seules les réalisations et compétences issues de votre Master Profile sont projetées.
                </p>
              </div>

              {/* Matched skills */}
              {cv && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Compétences Clés Mises en Avant ({cv.matched_skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cv.matched_skills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono"
                        >
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {cv.transferable_skills.length > 0 && (
                    <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2">
                      <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Compétences Transférables Connexes ({cv.transferable_skills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cv.transferable_skills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono"
                          >
                            ⚡ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-border">
                    <h4 className="font-semibold text-foreground">Expériences ordonnées par pertinence :</h4>
                    <ul className="space-y-1.5">
                      {cv.experiences.map((exp, idx) => (
                        <li key={idx} className="p-2.5 rounded-md bg-muted/50 border border-border/50">
                          <span className="font-bold text-foreground">{exp.role}</span> chez{" "}
                          <span className="font-semibold">{exp.company}</span> ({exp.start_date} – {exp.end_date})
                          {exp.technologies && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                              Tech : {exp.technologies.join(", ")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <h4 className="font-semibold text-foreground">Projets d'ingénierie sélectionnés :</h4>
                    <ul className="space-y-1.5">
                      {cv.projects.map((proj, idx) => (
                        <li key={idx} className="p-2.5 rounded-md bg-muted/50 border border-border/50">
                          <span className="font-bold text-foreground">{proj.title}</span>
                          {proj.technologies && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                              Stack : {proj.technologies.join(", ")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
