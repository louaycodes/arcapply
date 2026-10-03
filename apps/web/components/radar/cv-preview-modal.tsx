"use client";

import { useEffect, useState } from "react";
import {
  JobOffer,
  TargetedCV,
  generateTargetedCV,
  getCVPreviewUrl,
  getCVPdfDownloadUrl,
} from "@/lib/api";
import { useAppLanguage } from "@/lib/language-context";
import {
  FileText,
  Download,
  ExternalLink,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Check,
  Zap,
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
  const { language: appLanguage, setLanguage: setAppLanguage } = useAppLanguage();
  const [cv, setCv] = useState<TargetedCV | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "audit">("preview");
  const [language, setLanguage] = useState<"fr" | "en">(appLanguage);

  useEffect(() => {
    setLanguage(appLanguage);
  }, [appLanguage]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl h-[96vh] rounded-2xl border border-stone-200 bg-white shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between gap-4 bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 font-display">
                  CV Adapté à l'offre
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  100% Vérifié
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5 line-clamp-1">
                {job.title} &bull; <span className="font-semibold text-stone-900">{job.company}</span>
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-stone-200 bg-stone-100 p-0.5 text-xs font-semibold mr-1">
              <button
                type="button"
                onClick={() => {
                  setLanguage("fr");
                  setAppLanguage("fr");
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  language === "fr"
                    ? "bg-stone-900 text-white shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                title="Version Française"
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage("en");
                  setAppLanguage("en");
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  language === "en"
                    ? "bg-stone-900 text-white shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                title="English Version"
              >
                EN
              </button>
            </div>

            <a
              href="/cv"
              className="px-3 py-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              title="Ouvrir dans le Studio CV pour modifier le texte directement"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Modifier dans Studio CV</span>
            </a>

            <a
              href={pdfUrl}
              download
              className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-2 tactile-button shadow-artisan-button transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Télécharger PDF ({language.toUpperCase()})</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Sub-toolbar */}
        <div className="px-5 py-2.5 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === "preview"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-white border border-stone-200 text-stone-700 hover:text-stone-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Aperçu PDF Direct</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === "audit"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-white border border-stone-200 text-stone-700 hover:text-stone-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Audit de Pertinence ATS</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadOrGenerateCV}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Régénérer</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden relative bg-[#FAF7F2]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-stone-600">
                Génération déterministe du CV ciblé en cours...
              </p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-3 p-6">
              <p className="text-sm font-semibold text-red-700">{error}</p>
              <button
                type="button"
                onClick={loadOrGenerateCV}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : activeTab === "preview" ? (
            /* Visual PDF Preview via IFrame */
            <div className="w-full h-full p-4 flex justify-center items-center bg-[#EFE8DD]">
              <iframe
                src={previewUrl}
                className="w-full max-w-4xl h-full rounded-xl shadow-[0_12px_36px_rgba(44,28,16,0.12)] border border-stone-300 bg-white"
                title="Aperçu du CV"
              />
            </div>
          ) : (
            /* Structured ATS Mapping Audit View */
            <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto space-y-6 bg-white border border-stone-200 rounded-2xl m-4 shadow-artisan">
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-display">
                  Correspondance des compétences
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Ce CV met en valeur les compétences et expériences de votre profil les plus pertinentes pour ce poste.
                </p>
              </div>

              {/* Matched skills */}
              {cv && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 space-y-2">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      Compétences Clés Mises en Avant ({cv.matched_skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cv.matched_skills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100/80 border border-emerald-300 text-emerald-950 font-semibold font-mono"
                        >
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>{s}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {cv.transferable_skills.length > 0 && (
                    <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/60 space-y-2">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        Compétences Transférables Connexes ({cv.transferable_skills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cv.transferable_skills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100/80 border border-amber-300 text-amber-950 font-semibold font-mono"
                          >
                            <Zap className="w-3 h-3 text-amber-700" />
                            <span>{s}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-stone-200">
                    <h4 className="font-bold text-stone-900">Expériences ordonnées par pertinence :</h4>
                    <ul className="space-y-1.5">
                      {cv.experiences.map((exp, idx) => (
                        <li key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                          <span className="font-bold text-stone-900">{exp.role}</span> chez{" "}
                          <span className="font-semibold text-stone-800">{exp.company}</span> ({exp.start_date} – {exp.end_date})
                          {exp.technologies && (
                            <p className="text-[11px] text-stone-600 mt-0.5 font-mono">
                              Tech : {exp.technologies.join(", ")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-200">
                    <h4 className="font-bold text-stone-900">Projets d'ingénierie sélectionnés :</h4>
                    <ul className="space-y-1.5">
                      {cv.projects.map((proj, idx) => (
                        <li key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                          <span className="font-bold text-stone-900">{proj.title}</span>
                          {proj.technologies && (
                            <p className="text-[11px] text-stone-600 mt-0.5 font-mono">
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
