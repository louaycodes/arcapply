"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import {
  CustomCVData,
  ParsedEducation,
  ParsedExperience,
  ParsedProject,
  ParsedSkillCategory,
  ParsedExtracurricular,
  uploadCVFile,
  renderCustomCV,
  compileCustomCVPdf,
  fetchCVFromProfile,
  saveCVDraft,
  fetchCVDraft,
  updateProfile,
  fetchProfile,
} from "@/lib/api";
import {
  FileText,
  Upload,
  Download,
  Printer,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Code2,
  User,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Eye,
  FileCheck,
  Globe,
  Award,
  ChevronRight,
} from "lucide-react";

export default function StudioCVPage() {
  const [cvData, setCvData] = useState<CustomCVData | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    "personal" | "summary" | "education" | "experience" | "projects" | "skills" | "extra" | "styling"
  >("personal");
  const [zoomScale, setZoomScale] = useState<number>(0.9);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Initial Load: Check for draft or load from Master Profile
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const draftRes = await fetchCVDraft();
      if (draftRes.has_draft && draftRes.data) {
        setCvData(draftRes.data);
        setHtmlContent(draftRes.html_content);
        showNotification("info", "Brouillon de CV restauré avec succès.");
      } else {
        const profRes = await fetchCVFromProfile("fr");
        setCvData(profRes.data);
        setHtmlContent(profRes.html_content);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Erreur de chargement du CV.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const showNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // 2. Real-time HTML re-rendering whenever cvData changes
  const updateCvAndRender = async (newData: CustomCVData) => {
    setCvData(newData);
    try {
      const renderedHtml = await renderCustomCV(newData);
      setHtmlContent(renderedHtml);
    } catch (err: any) {
      console.error("Render error:", err);
    }
  };

  // 3. Upload CV (PDF, Text, JSON)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      showNotification("info", `Analyse en cours de ${file.name}...`);
      const result = await uploadCVFile(file, false);
      setCvData(result.data);
      setHtmlContent(result.html_content);
      showNotification("success", `CV extrait avec succès (${result.data.full_name || "Candidat"}). Prêt pour modification.`);
    } catch (err: any) {
      showNotification("error", err.message || "Échec de l'analyse du fichier.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 4. Download PDF (100% Identical Visual Fidelity via Chromium Engine)
  const handleDownloadPdf = async () => {
    if (!htmlContent) return;
    try {
      setIsCompiling(true);
      const cleanName = (cvData?.full_name || "CV")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      const filename = `CV_${cleanName}_A4_Vectoriel.pdf`;

      const blob = await compileCustomCVPdf(htmlContent, filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showNotification("success", `PDF vectoriel haute fidélité téléchargé (${filename}) !`);
    } catch (err: any) {
      showNotification("error", err.message || "Erreur de compilation du PDF.");
    } finally {
      setIsCompiling(false);
    }
  };

  // 5. Native Print
  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  // 6. Save Draft
  const handleSaveDraft = async () => {
    if (!cvData) return;
    try {
      setIsSaving(true);
      await saveCVDraft(cvData);
      showNotification("success", "Brouillon sauvegardé en base locale SQLite souveraine.");
    } catch (err: any) {
      showNotification("error", err.message || "Échec de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  // 7. Load from Master Profile
  const handleLoadFromProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetchCVFromProfile(cvData?.language || "fr");
      setCvData(res.data);
      setHtmlContent(res.html_content);
      showNotification("success", "Données du Master Profile chargées avec succès.");
    } catch (err: any) {
      showNotification("error", err.message || "Échec du chargement du profil.");
    } finally {
      setIsLoading(false);
    }
  };

  // 8. Toggle Language FR / EN
  const handleLanguageChange = async (lang: "fr" | "en") => {
    if (!cvData) return;
    const updated: CustomCVData = {
      ...cvData,
      language: lang,
    };
    updateCvAndRender(updated);
  };

  if (isLoading || !cvData) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-mono text-muted-foreground">
            Initialisation du Studio CV & moteur de rendu vectoriel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] min-w-0 overflow-hidden bg-background">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.json,.md"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Cockpit Header & Action Toolbar */}
      <header className="px-5 py-3 border-b border-border/70 bg-card/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground tracking-tight">
                Studio CV — Éditeur & Rendu Identique
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Chromium Pixel-Perfect
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Modifiez votre CV et téléchargez une version vectorielle 100% conforme à l'aperçu visuel.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <Upload className={`w-3.5 h-3.5 ${isUploading ? "animate-bounce" : ""}`} />
            <span>{isUploading ? "Analyse..." : "Uploader un CV (PDF/TXT)"}</span>
          </button>

          {/* Import from Master Profile */}
          <button
            type="button"
            onClick={handleLoadFromProfile}
            className="px-3 py-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-all shadow-sm"
            title="Réinitialiser avec les données certifiées du Master Profile"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Charger Master Profile</span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleLanguageChange("fr")}
              className={`px-2 py-1 rounded-md transition-all ${
                cvData.language === "fr"
                  ? "bg-primary text-primary-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇫🇷 FR
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange("en")}
              className={`px-2 py-1 rounded-md transition-all ${
                cvData.language === "en"
                  ? "bg-primary text-primary-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇬🇧 EN
            </button>
          </div>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
            <span>Sauvegarder</span>
          </button>

          {/* Native Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-foreground transition-all"
            title="Imprimer directement"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Download PDF button (Hero Action) */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isCompiling}
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isCompiling ? "animate-spin" : ""}`} />
            <span>{isCompiling ? "Génération PDF..." : "Télécharger PDF (Identique)"}</span>
          </button>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div
          className={`mx-5 mt-2 p-2.5 rounded-lg border text-xs flex items-center justify-between animate-in slide-in-from-top-2 duration-150 ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : notification.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-blue-500/10 border-blue-500/30 text-blue-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : notification.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden p-3 gap-3">
        {/* Left Column: Form & Controls Editor */}
        <div className="w-full lg:w-[48%] flex flex-col bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden min-h-0">
          {/* Navigation Section Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-border/60 bg-muted/30 overflow-x-auto text-xs shrink-0 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                activeTab === "personal"
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Contact</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                activeTab === "summary"
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Accroche</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("education")}
              className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                activeTab === "education"
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Formations ({cvData.educations.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("experience")}
              className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                activeTab === "experience"
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Stages ({cvData.experiences.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("projects")}
              className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                activeTab === "projects"
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Projets ({cvData.projects.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("skills")}
              className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                activeTab === "skills"
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Compétences</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("extra")}
              className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                activeTab === "extra"
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Activités & Langues</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("styling")}
              className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                activeTab === "styling"
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Calibrage A4</span>
            </button>
          </div>

          {/* Form Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 1. Contact Info */}
            {activeTab === "personal" && (
              <div className="space-y-4 text-xs animate-in fade-in duration-100">
                <div className="border-b border-border/50 pb-2">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <User className="w-4 h-4 text-primary" />
                    Identité & Coordonnées
                  </h3>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Modifiez vos informations de contact et liens web (portfolio direct, GitHub, LinkedIn).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-foreground">Nom complet</label>
                    <input
                      type="text"
                      value={cvData.full_name}
                      onChange={(e) => updateCvAndRender({ ...cvData, full_name: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-foreground">Titre / Headline</label>
                    <input
                      type="text"
                      value={cvData.headline}
                      onChange={(e) => updateCvAndRender({ ...cvData, headline: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-foreground">Email</label>
                    <input
                      type="email"
                      value={cvData.email}
                      onChange={(e) => updateCvAndRender({ ...cvData, email: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-foreground">Téléphone</label>
                    <input
                      type="text"
                      value={cvData.phone}
                      onChange={(e) => updateCvAndRender({ ...cvData, phone: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-foreground">Localisation</label>
                    <input
                      type="text"
                      value={cvData.location}
                      onChange={(e) => updateCvAndRender({ ...cvData, location: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-foreground">Portfolio / Site Web</label>
                    <input
                      type="text"
                      value={cvData.portfolio_url}
                      onChange={(e) => updateCvAndRender({ ...cvData, portfolio_url: e.target.value })}
                      placeholder="https://www.louaycodes.tn"
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-foreground">Profil LinkedIn</label>
                    <input
                      type="text"
                      value={cvData.linkedin_url}
                      onChange={(e) => updateCvAndRender({ ...cvData, linkedin_url: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-foreground">Profil GitHub</label>
                    <input
                      type="text"
                      value={cvData.github_url}
                      onChange={(e) => updateCvAndRender({ ...cvData, github_url: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Summary */}
            {activeTab === "summary" && (
              <div className="space-y-4 text-xs animate-in fade-in duration-100">
                <div className="border-b border-border/50 pb-2">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-primary" />
                    Profil Professionnel & Accroche
                  </h3>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Synthèse sobre de votre profil d'ingénieur. Modifiable en direct.
                  </p>
                </div>

                <div>
                  <textarea
                    rows={6}
                    value={cvData.summary}
                    onChange={(e) => updateCvAndRender({ ...cvData, summary: e.target.value })}
                    className="w-full p-3 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary outline-none leading-relaxed"
                    placeholder="Écrivez votre profil professionnel sobre et sans cliché..."
                  />
                </div>
              </div>
            )}

            {/* 3. Education */}
            {activeTab === "education" && (
              <div className="space-y-4 text-xs animate-in fade-in duration-100">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div>
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      Formations & Diplômes
                    </h3>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Cursus universitaire et école d'ingénieurs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newEdu: ParsedEducation = {
                        school: "ESPRIT",
                        degree: "Diplôme National d'Ingénieur",
                        field_of_study: "Architectures Cloud & Systèmes Distribués",
                        start_date: "2022",
                        end_date: "2027",
                        description: "",
                      };
                      updateCvAndRender({ ...cvData, educations: [...cvData.educations, newEdu] });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter formation
                  </button>
                </div>

                <div className="space-y-3">
                  {cvData.educations.map((edu, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-border/70 bg-card/60 space-y-3 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const updated = cvData.educations.filter((_, i) => i !== idx);
                          updateCvAndRender({ ...cvData, educations: updated });
                        }}
                        className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Supprimer la formation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold">Diplôme</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => {
                              const updated = [...cvData.educations];
                              updated[idx] = { ...updated[idx], degree: e.target.value };
                              updateCvAndRender({ ...cvData, educations: updated });
                            }}
                            className="mt-1 w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold">École / Université</label>
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => {
                              const updated = [...cvData.educations];
                              updated[idx] = { ...updated[idx], school: e.target.value };
                              updateCvAndRender({ ...cvData, educations: updated });
                            }}
                            className="mt-1 w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold">Période (Début – Fin)</label>
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="text"
                              value={edu.start_date}
                              onChange={(e) => {
                                const updated = [...cvData.educations];
                                updated[idx] = { ...updated[idx], start_date: e.target.value };
                                updateCvAndRender({ ...cvData, educations: updated });
                              }}
                              placeholder="2022"
                              className="w-1/2 px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs"
                            />
                            <span className="text-muted-foreground">–</span>
                            <input
                              type="text"
                              value={edu.end_date}
                              onChange={(e) => {
                                const updated = [...cvData.educations];
                                updated[idx] = { ...updated[idx], end_date: e.target.value };
                                updateCvAndRender({ ...cvData, educations: updated });
                              }}
                              placeholder="2027"
                              className="w-1/2 px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold">Spécialité / Domaine</label>
                          <input
                            type="text"
                            value={edu.field_of_study}
                            onChange={(e) => {
                              const updated = [...cvData.educations];
                              updated[idx] = { ...updated[idx], field_of_study: e.target.value };
                              updateCvAndRender({ ...cvData, educations: updated });
                            }}
                            className="mt-1 w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Experience */}
            {activeTab === "experience" && (
              <div className="space-y-4 text-xs animate-in fade-in duration-100">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div>
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-primary" />
                      Expériences Professionnelles (Stages)
                    </h3>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Stages et réalisations industrielles avec stack technique.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newExp: ParsedExperience = {
                        company: "Entreprise",
                        role: "Stagiaire Ingénieur",
                        location: "Tunis",
                        start_date: "06/2026",
                        end_date: "08/2026",
                        description: "Description concrète des réalisations et responsabilités.",
                        technologies: ["Python", "Docker"],
                      };
                      updateCvAndRender({ ...cvData, experiences: [...cvData.experiences, newExp] });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter stage
                  </button>
                </div>

                <div className="space-y-3">
                  {cvData.experiences.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-border/70 bg-card/60 space-y-2.5 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const updated = cvData.experiences.filter((_, i) => i !== idx);
                          updateCvAndRender({ ...cvData, experiences: updated });
                        }}
                        className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Supprimer l'expérience"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold">Poste / Rôle</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => {
                              const updated = [...cvData.experiences];
                              updated[idx] = { ...updated[idx], role: e.target.value };
                              updateCvAndRender({ ...cvData, experiences: updated });
                            }}
                            className="mt-1 w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold">Entreprise</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const updated = [...cvData.experiences];
                              updated[idx] = { ...updated[idx], company: e.target.value };
                              updateCvAndRender({ ...cvData, experiences: updated });
                            }}
                            className="mt-1 w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold">Dates (Début – Fin)</label>
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="text"
                              value={exp.start_date}
                              onChange={(e) => {
                                const updated = [...cvData.experiences];
                                updated[idx] = { ...updated[idx], start_date: e.target.value };
                                updateCvAndRender({ ...cvData, experiences: updated });
                              }}
                              placeholder="06/2026"
                              className="w-1/2 px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs"
                            />
                            <span className="text-muted-foreground">–</span>
                            <input
                              type="text"
                              value={exp.end_date}
                              onChange={(e) => {
                                const updated = [...cvData.experiences];
                                updated[idx] = { ...updated[idx], end_date: e.target.value };
                                updateCvAndRender({ ...cvData, experiences: updated });
                              }}
                              placeholder="08/2026"
                              className="w-1/2 px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold">Stack Technologies (séparées par virgule)</label>
                          <input
                            type="text"
                            value={exp.technologies.join(", ")}
                            onChange={(e) => {
                              const updated = [...cvData.experiences];
                              updated[idx] = {
                                ...updated[idx],
                                technologies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                              };
                              updateCvAndRender({ ...cvData, experiences: updated });
                            }}
                            className="mt-1 w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-muted-foreground font-semibold">Description</label>
                        <textarea
                          rows={2}
                          value={exp.description}
                          onChange={(e) => {
                            const updated = [...cvData.experiences];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            updateCvAndRender({ ...cvData, experiences: updated });
                          }}
                          className="mt-1 w-full p-2 rounded-md bg-background border border-border text-foreground text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Projects */}
            {activeTab === "projects" && (
              <div className="space-y-4 text-xs animate-in fade-in duration-100">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div>
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <FolderGit2 className="w-4 h-4 text-primary" />
                      Projets d'Ingénierie Sélectionnés
                    </h3>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Projets personnels, architectures cloud et plateformes SaaS.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newProj: ParsedProject = {
                        title: "Nouveau Projet",
                        role: "Lead Développeur",
                        url: "https://www.louaycodes.tn",
                        description: "Description de l'architecture et de la valeur délivrée.",
                        technologies: ["Next.js", "Docker"],
                      };
                      updateCvAndRender({ ...cvData, projects: [...cvData.projects, newProj] });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter projet
                  </button>
                </div>

                <div className="space-y-3">
                  {cvData.projects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-border/70 bg-card/60 space-y-2.5 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const updated = cvData.projects.filter((_, i) => i !== idx);
                          updateCvAndRender({ ...cvData, projects: updated });
                        }}
                        className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Supprimer le projet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold">Titre du Projet</label>
                          <input
                            type="text"
                            value={proj.title}
                            onChange={(e) => {
                              const updated = [...cvData.projects];
                              updated[idx] = { ...updated[idx], title: e.target.value };
                              updateCvAndRender({ ...cvData, projects: updated });
                            }}
                            className="mt-1 w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold">Rôle</label>
                          <input
                            type="text"
                            value={proj.role}
                            onChange={(e) => {
                              const updated = [...cvData.projects];
                              updated[idx] = { ...updated[idx], role: e.target.value };
                              updateCvAndRender({ ...cvData, projects: updated });
                            }}
                            className="mt-1 w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-muted-foreground font-semibold">Technologies / Stack</label>
                        <input
                          type="text"
                          value={proj.technologies.join(", ")}
                          onChange={(e) => {
                            const updated = [...cvData.projects];
                            updated[idx] = {
                              ...updated[idx],
                              technologies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                            };
                            updateCvAndRender({ ...cvData, projects: updated });
                          }}
                          className="mt-1 w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-muted-foreground font-semibold">Description</label>
                        <textarea
                          rows={2}
                          value={proj.description}
                          onChange={(e) => {
                            const updated = [...cvData.projects];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            updateCvAndRender({ ...cvData, projects: updated });
                          }}
                          className="mt-1 w-full p-2 rounded-md bg-background border border-border text-foreground text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Skills */}
            {activeTab === "skills" && (
              <div className="space-y-4 text-xs animate-in fade-in duration-100">
                <div className="border-b border-border/50 pb-2">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-primary" />
                    Compétences Techniques par Catégories
                  </h3>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Organisées sobrement sans badges colorés conformément aux standards ATS épurés.
                  </p>
                </div>

                <div className="space-y-3">
                  {cvData.skills_categories.map((cat, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-border/70 bg-card/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={cat.title}
                          onChange={(e) => {
                            const updated = [...cvData.skills_categories];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            updateCvAndRender({ ...cvData, skills_categories: updated });
                          }}
                          className="font-bold text-foreground text-xs bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none px-1"
                        />
                      </div>
                      <input
                        type="text"
                        value={cat.skills.join(", ")}
                        onChange={(e) => {
                          const updated = [...cvData.skills_categories];
                          updated[idx] = {
                            ...updated[idx],
                            skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          };
                          updateCvAndRender({ ...cvData, skills_categories: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs font-mono"
                        placeholder="Compétences séparées par virgules..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Extra & Languages */}
            {activeTab === "extra" && (
              <div className="space-y-4 text-xs animate-in fade-in duration-100">
                <div className="border-b border-border/50 pb-2">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-primary" />
                    Activités Associatives & Langues
                  </h3>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Engagement communautaire (Enactus, clubs) et maîtrise linguistique.
                  </p>
                </div>

                {/* Extracurricular items */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Activités Extra-Professionnelles :</h4>
                  {cvData.extracurricular.map((extra, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-border/70 bg-card/60 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold">Organisation / Club</label>
                          <input
                            type="text"
                            value={extra.organization}
                            onChange={(e) => {
                              const updated = [...cvData.extracurricular];
                              updated[idx] = { ...updated[idx], organization: e.target.value };
                              updateCvAndRender({ ...cvData, extracurricular: updated });
                            }}
                            className="mt-1 w-full px-2 py-1 rounded bg-background border border-border text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold">Rôle</label>
                          <input
                            type="text"
                            value={extra.role}
                            onChange={(e) => {
                              const updated = [...cvData.extracurricular];
                              updated[idx] = { ...updated[idx], role: e.target.value };
                              updateCvAndRender({ ...cvData, extracurricular: updated });
                            }}
                            className="mt-1 w-full px-2 py-1 rounded bg-background border border-border text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold">Période</label>
                          <input
                            type="text"
                            value={extra.date}
                            onChange={(e) => {
                              const updated = [...cvData.extracurricular];
                              updated[idx] = { ...updated[idx], date: e.target.value };
                              updateCvAndRender({ ...cvData, extracurricular: updated });
                            }}
                            className="mt-1 w-full px-2 py-1 rounded bg-background border border-border text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground font-semibold">Description</label>
                        <textarea
                          rows={2}
                          value={extra.description}
                          onChange={(e) => {
                            const updated = [...cvData.extracurricular];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            updateCvAndRender({ ...cvData, extracurricular: updated });
                          }}
                          className="mt-1 w-full p-2 rounded bg-background border border-border text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Languages */}
                <div className="pt-2 border-t border-border/50 space-y-2">
                  <h4 className="font-semibold text-foreground">Langues :</h4>
                  <input
                    type="text"
                    value={cvData.languages.join(" • ")}
                    onChange={(e) => {
                      updateCvAndRender({
                        ...cvData,
                        languages: e.target.value.split("•").map((s) => s.trim()).filter(Boolean),
                      });
                    }}
                    placeholder="Arabe : Langue maternelle • Français : Courant • Anglais : Technique"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Séparez les langues par le caractère •</p>
                </div>
              </div>
            )}

            {/* 8. Calibration & Styling */}
            {activeTab === "styling" && (
              <div className="space-y-4 text-xs animate-in fade-in duration-100">
                <div className="border-b border-border/50 pb-2">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-primary" />
                    Calibrage Typographique & Marges A4
                  </h3>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Ajustez précisément la taille de police et les marges pour équilibrer parfaitement votre CV sans sauts de page indésirables.
                  </p>
                </div>

                <div className="space-y-4 p-3 rounded-xl border border-border/70 bg-card/60">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Taille de Police Principale</span>
                      <span className="font-mono text-primary">{cvData.font_size_pt} pt</span>
                    </div>
                    <input
                      type="range"
                      min={8.0}
                      max={10.5}
                      step={0.1}
                      value={cvData.font_size_pt}
                      onChange={(e) =>
                        updateCvAndRender({ ...cvData, font_size_pt: parseFloat(e.target.value) })
                      }
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>8.0 pt (très compact)</span>
                      <span>9.0 pt (recommandé A4)</span>
                      <span>10.5 pt (aéré)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Interligne (Line Height)</span>
                      <span className="font-mono text-primary">{cvData.line_height}</span>
                    </div>
                    <input
                      type="range"
                      min={1.2}
                      max={1.55}
                      step={0.05}
                      value={cvData.line_height}
                      onChange={(e) =>
                        updateCvAndRender({ ...cvData, line_height: parseFloat(e.target.value) })
                      }
                      className="w-full accent-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                    <div>
                      <label className="font-semibold text-foreground">Marges Haut/Bas (mm)</label>
                      <input
                        type="number"
                        min={4}
                        max={16}
                        value={cvData.margin_top_mm}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 8;
                          updateCvAndRender({ ...cvData, margin_top_mm: val, margin_bottom_mm: val });
                        }}
                        className="mt-1 w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-foreground">Marges Gauche/Droite (mm)</label>
                      <input
                        type="number"
                        min={6}
                        max={20}
                        value={cvData.margin_left_mm}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 12;
                          updateCvAndRender({ ...cvData, margin_left_mm: val, margin_right_mm: val });
                        }}
                        className="mt-1 w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live A4 Visual Preview */}
        <div className="w-full lg:w-[52%] flex flex-col bg-muted/20 rounded-xl border border-border/80 shadow-inner overflow-hidden min-h-0">
          {/* Sub-toolbar: Zoom & Status */}
          <div className="px-4 py-2 border-b border-border/60 bg-card/60 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground">Aperçu Document Direct (A4 ATS)</span>
              <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                &bull; Rendu 100% vectoriel identique
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(0.6, prev - 0.1))}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Zoom -"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-muted-foreground w-10 text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(1.4, prev + 0.1))}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Zoom +"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(0.9)}
                className="text-[10px] font-mono text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border/50 ml-1"
                title="Réinitialiser le zoom"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Canvas Wrapper with realistic shadows and A4 sheet styling */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start bg-neutral-900/60">
            <div
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease-out",
              }}
              className="w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl rounded-sm border border-neutral-300 overflow-hidden shrink-0 flex flex-col"
            >
              <iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                title="Aperçu CV A4 Identique"
                className="w-full flex-1 border-0 bg-white"
                style={{
                  minHeight: "297mm",
                  height: "100%",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
