"use client";

import { useEffect, useState } from "react";
import {
  JobOffer,
  TargetedCV,
  generateTargetedCV,
  updateTargetedCV,
  getCVPreviewUrl,
  getCVPdfDownloadUrl,
  downloadTargetedCVPdf,
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
  Edit3,
  Save,
  Plus,
  Undo2,
} from "lucide-react";

interface CVPreviewModalProps {
  job: JobOffer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CVPreviewModal({ job, isOpen, onClose }: CVPreviewModalProps) {
  const { language: appLanguage, t } = useAppLanguage();
  const [cv, setCv] = useState<TargetedCV | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "edit" | "audit">("preview");
  const [language, setLanguage] = useState<"fr" | "en">(appLanguage);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());

  // État d'édition en direct sur place
  const [editHeadline, setEditHeadline] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [newSkillText, setNewSkillText] = useState("");
  const [editExperiences, setEditExperiences] = useState<any[]>([]);
  const [editProjects, setEditProjects] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setLanguage(appLanguage);
  }, [appLanguage]);

  useEffect(() => {
    if (cv) {
      setEditHeadline(cv.headline || "");
      setEditSummary(cv.summary || "");
      setEditSkills(cv.matched_skills ? [...cv.matched_skills] : []);
      setEditExperiences(cv.experiences ? JSON.parse(JSON.stringify(cv.experiences)) : []);
      setEditProjects(cv.projects ? JSON.parse(JSON.stringify(cv.projects)) : []);
    }
  }, [cv]);

  const loadOrGenerateCV = async () => {
    if (!job) return;
    try {
      setLoading(true);
      setError(null);
      const generated = await generateTargetedCV(job.id, language);
      setCv(generated);
      setCacheBuster(Date.now());
    } catch (err: any) {
      setError(err.message || t("Erreur lors de la génération du CV ciblé.", "Error while generating the tailored CV."));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInPlace = async () => {
    if (!job || !cv) return;
    try {
      setIsSaving(true);
      setError(null);
      const updated = await updateTargetedCV(
        job.id,
        {
          headline: editHeadline,
          summary: editSummary,
          matched_skills: editSkills,
          experiences: editExperiences,
          projects: editProjects,
        },
        language
      );
      setCv(updated);
      setCacheBuster(Date.now());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setActiveTab("preview");
    } catch (err: any) {
      setError(err?.message || t("Erreur lors de la sauvegarde du CV.", "Error saving tailored CV."));
    } finally {
      setIsSaving(false);
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
  const previewUrl = `${getCVPreviewUrl(job.id, language)}&v=${cacheBuster}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 !mt-0 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl h-[96vh] rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4 bg-stone-50/70 dark:bg-stone-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 font-display">
                  {t("CV Adapté à l'offre", "CV Tailored to the Offer")}
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  {t("100% Vérifié", "100% Verified")}
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-1">
                {job.title} &bull; <span className="font-semibold text-stone-900 dark:text-stone-200">{job.company}</span>
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 p-0.5 text-xs font-semibold mr-1">
              <button
                type="button"
                onClick={() => {
                  setLanguage("fr");
                }}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  language === "fr"
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs font-bold"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                }`}
                title={t("Version Française", "French version")}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage("en");
                }}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs font-bold"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                }`}
                title="English Version"
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  setIsDownloading(true);
                  await downloadTargetedCVPdf({
                    jobId: job.id,
                    companyName: job.company,
                    lang: language,
                  });
                } catch (err: any) {
                  setError(err?.message || t("Erreur lors du téléchargement du CV.", "Error while downloading the CV."));
                } finally {
                  setIsDownloading(false);
                }
              }}
              disabled={isDownloading}
              className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-2 tactile-button shadow-artisan-button transition-all disabled:opacity-50 cursor-pointer"
            >
              {isDownloading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{t(`Télécharger PDF (${language.toUpperCase()})`, `Download PDF (${language.toUpperCase()})`)}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title={t("Fermer", "Close")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Sub-toolbar */}
        <div className="px-5 py-2.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "preview"
                  ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs"
                  : "bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t("Aperçu PDF Direct", "Live PDF Preview")}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "edit"
                  ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs"
                  : "bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t("Modifier sur place", "Edit in Place")}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "audit"
                  ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs"
                  : "bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t("Audit de Pertinence ATS", "ATS Relevance Audit")}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadOrGenerateCV}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{t("Régénérer", "Regenerate")}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden relative bg-[#FAF7F2] dark:bg-[#12100E]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-stone-600 dark:text-stone-400">
                {t("Génération déterministe du CV ciblé en cours...", "Deterministic generation of the tailored CV in progress...")}
              </p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-3 p-6">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>
              <button
                type="button"
                onClick={loadOrGenerateCV}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
              >
                {t("Réessayer", "Retry")}
              </button>
            </div>
          ) : activeTab === "preview" ? (
            /* Visual PDF Preview via IFrame */
            <div className="w-full h-full p-4 flex justify-center items-center bg-[#EFE8DD] dark:bg-[#181513]">
              <iframe
                src={previewUrl}
                className="w-full max-w-4xl h-full rounded-xl shadow-[0_12px_36px_rgba(44,28,16,0.12)] border border-stone-300 dark:border-stone-800 bg-white"
                title={t("Aperçu du CV", "CV preview")}
              />
            </div>
          ) : activeTab === "edit" ? (
            /* Direct In-Place Editor */
            <div className="h-full overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
              {/* Top Banner with Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">
                      {t("Édition directe sur place", "Live In-Place CV Editor")}
                    </h3>
                    {saveSuccess && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {t("Enregistré avec succès !", "Saved successfully!")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                    {t("Modifiez le titre, l'accroche, les compétences et vos expériences. Le PDF se recalcule instantanément.", "Edit the headline, summary, skills and experience. The PDF recalculates instantly.")}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (cv) {
                        setEditHeadline(cv.headline || "");
                        setEditSummary(cv.summary || "");
                        setEditSkills(cv.matched_skills ? [...cv.matched_skills] : []);
                        setEditExperiences(cv.experiences ? JSON.parse(JSON.stringify(cv.experiences)) : []);
                        setEditProjects(cv.projects ? JSON.parse(JSON.stringify(cv.projects)) : []);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>{t("Réinitialiser", "Reset")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInPlace}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 tactile-button shadow-artisan-button transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaving ? t("Enregistrement...", "Saving...") : t("Enregistrer & Voir", "Save & View")}</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Titre du profil (Headline) */}
              <div className="p-4 sm:p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200">
                    {t("Titre de profil affiché sur le CV (Headline)", "Candidate Headline on CV")}
                  </label>
                  <span className="text-[11px] text-stone-600 dark:text-stone-400 font-mono">
                    {t("En-tête principal", "Main header")}
                  </span>
                </div>
                <input
                  type="text"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  placeholder="ex: Développeur de chaîne CI/CD, Ingénieur Cloud & DevOps..."
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-hidden"
                />
                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                  {t("Intitulé d'ingénieur positionné directement sous votre nom pour capter immédiatement l'attention du recruteur.", "Engineering title displayed right below your name to catch the recruiter's eye.")}
                </p>
              </div>

              {/* Section 2: Accroche / Bio du profil (Summary) */}
              <div className="p-4 sm:p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200">
                    {t("Accroche professionnelle (Profile Summary)", "Professional Summary")}
                  </label>
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                    {t("Zéro nom d'entreprise", "Zero company name")}
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  placeholder={t("2 à 3 phrases percutantes décrivant vos compétences techniques et votre valeur ajoutée...", "2-3 impactful sentences summarizing your key technical skills and engineering value...")}
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-normal focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-hidden resize-y leading-relaxed"
                />
                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                  {t("Présentation percutante de vos compétences. Note : le nom de l'entreprise cible est strictement exclu du CV.", "Strong summary of your qualifications. Note: the target company name is strictly excluded from the CV.")}
                </p>
              </div>

              {/* Section 3: Compétences Clés (Matched Skills) */}
              <div className="p-4 sm:p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200">
                    {t("Compétences Clés Mises en Avant", "Highlighted Key Skills")}
                  </label>
                  <span className="text-[11px] text-stone-600 dark:text-stone-400 font-mono">
                    {editSkills.length} {t("compétences", "skills")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {editSkills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs font-mono font-medium"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => setEditSkills(editSkills.filter((_, i) => i !== sIdx))}
                        className="text-stone-600 hover:text-red-700 dark:text-stone-400 dark:hover:text-red-400 transition-colors cursor-pointer"
                        title={t("Supprimer", "Remove")}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSkillText}
                    onChange={(e) => setNewSkillText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSkillText.trim()) {
                        e.preventDefault();
                        if (!editSkills.includes(newSkillText.trim())) {
                          setEditSkills([...editSkills, newSkillText.trim()]);
                        }
                        setNewSkillText("");
                      }
                    }}
                    placeholder={t("Ajouter une compétence et appuyer sur Entrée...", "Add a skill and press Enter...")}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSkillText.trim() && !editSkills.includes(newSkillText.trim())) {
                        setEditSkills([...editSkills, newSkillText.trim()]);
                        setNewSkillText("");
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t("Ajouter", "Add")}</span>
                  </button>
                </div>
              </div>

              {/* Section 4: Expériences Professionnelles */}
              <div className="p-4 sm:p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200">
                    {t("Expériences Professionnelles (Descriptions ciblées)", "Work Experience (Targeted Descriptions)")}
                  </label>
                  <span className="text-[11px] text-stone-600 dark:text-stone-400 font-mono">
                    {editExperiences.length} {t("expériences", "experiences")}
                  </span>
                </div>
                <div className="space-y-3">
                  {editExperiences.map((exp, expIdx) => (
                    <div
                      key={expIdx}
                      className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-700/80 bg-stone-50/60 dark:bg-stone-800/40 space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm">
                            {exp.company}
                          </span>
                          <span className="text-[11px] text-stone-600 dark:text-stone-400">
                            ({exp.start_date} – {exp.end_date})
                          </span>
                        </div>
                        <input
                          type="text"
                          value={exp.role || ""}
                          onChange={(e) => {
                            const next = [...editExperiences];
                            next[expIdx] = { ...next[expIdx], role: e.target.value };
                            setEditExperiences(next);
                          }}
                          placeholder="Rôle (ex: Stagiaire DevOps)"
                          className="px-2.5 py-1 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-primary outline-hidden"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={exp.description || ""}
                        onChange={(e) => {
                          const next = [...editExperiences];
                          next[expIdx] = { ...next[expIdx], description: e.target.value };
                          setEditExperiences(next);
                        }}
                        placeholder={t("Description percutante de cette expérience orientée vers le poste cible...", "Impactful description of this experience tailored to the role...")}
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-200 focus:ring-1 focus:ring-primary outline-hidden resize-y leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Projets d'ingénierie */}
              <div className="p-4 sm:p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200">
                    {t("Projets d'Ingénierie Sélectionnés", "Selected Engineering Projects")}
                  </label>
                  <span className="text-[11px] text-stone-600 dark:text-stone-400 font-mono">
                    {editProjects.length} {t("projets", "projects")}
                  </span>
                </div>
                <div className="space-y-3">
                  {editProjects.map((proj, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-700/80 bg-stone-50/60 dark:bg-stone-800/40 space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm">
                          {proj.title}
                        </span>
                        <input
                          type="text"
                          value={proj.role || ""}
                          onChange={(e) => {
                            const next = [...editProjects];
                            next[pIdx] = { ...next[pIdx], role: e.target.value };
                            setEditProjects(next);
                          }}
                          placeholder="Rôle (ex: Lead Dev)"
                          className="px-2.5 py-1 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-primary outline-hidden"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={proj.description || ""}
                        onChange={(e) => {
                          const next = [...editProjects];
                          next[pIdx] = { ...next[pIdx], description: e.target.value };
                          setEditProjects(next);
                        }}
                        placeholder={t("Description percutante du projet orientée vers le poste cible...", "Impactful project description tailored to the role...")}
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-200 focus:ring-1 focus:ring-primary outline-hidden resize-y leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Save Bar */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between gap-3 shadow-xs sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                >
                  {t("Voir l'Aperçu sans enregistrer", "View Preview without saving")}
                </button>
                <button
                  type="button"
                  onClick={handleSaveInPlace}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-2 tactile-button shadow-artisan-button transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? t("Enregistrement...", "Saving...") : t("Enregistrer & Mettre à jour l'Aperçu", "Save & Update Preview")}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Structured ATS Mapping Audit View */
            <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto space-y-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl m-4 shadow-artisan">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">
                  {t("Correspondance des compétences", "Skills match")}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  {t("Ce CV met en valeur les compétences et expériences de votre profil les plus pertinentes pour ce poste.", "This CV highlights the skills and experience from your profile that are most relevant to this position.")}
                </p>
              </div>

              {/* Matched skills */}
              {cv && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-2">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      {t(`Compétences Clés Mises en Avant (${cv.matched_skills.length})`, `Key Skills Highlighted (${cv.matched_skills.length})`)}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cv.matched_skills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-semibold font-mono"
                        >
                          <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                          <span>{s}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {cv.transferable_skills.length > 0 && (
                    <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/20 space-y-2">
                      <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                        {t(`Compétences Transférables Connexes (${cv.transferable_skills.length})`, `Related Transferable Skills (${cv.transferable_skills.length})`)}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cv.transferable_skills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 font-semibold font-mono"
                          >
                            <Zap className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            <span>{s}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                    <h4 className="font-bold text-stone-900 dark:text-stone-100">{t("Expériences ordonnées par pertinence :", "Experience ordered by relevance:")}</h4>
                    <ul className="space-y-1.5">
                      {cv.experiences.map((exp, idx) => (
                        <li key={idx} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                          <span className="font-bold text-stone-900 dark:text-stone-100">{exp.role}</span> {t("chez", "at")}{" "}
                          <span className="font-semibold text-stone-800 dark:text-stone-200">{exp.company}</span> ({exp.start_date} – {exp.end_date})
                          {exp.technologies && (
                            <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 font-mono">
                              {t("Tech :", "Tech:")} {exp.technologies.join(", ")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                    <h4 className="font-bold text-stone-900 dark:text-stone-100">{t("Projets d'ingénierie sélectionnés :", "Selected engineering projects:")}</h4>
                    <ul className="space-y-1.5">
                      {cv.projects.map((proj, idx) => (
                        <li key={idx} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                          <span className="font-bold text-stone-900 dark:text-stone-100">{proj.title}</span>
                          {proj.technologies && (
                            <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 font-mono">
                              {t("Stack :", "Stack:")} {proj.technologies.join(", ")}
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
