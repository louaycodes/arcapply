"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  CustomCVData,
  uploadCVFile,
  renderCustomCV,
  compileCustomCVPdf,
  fetchCVFromProfile,
  saveCVDraft,
  fetchCVDraft,
} from "@/lib/api";
import {
  FileText,
  Upload,
  Download,
  Printer,
  Save,
  RotateCcw,
  Sparkles,
  Bold,
  Italic,
  Underline,
  List,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Eye,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Code2,
  Award,
  Undo2,
  Redo2,
  ShieldCheck,
  ChevronDown,
  Layers,
  HelpCircle,
  FileCheck,
} from "lucide-react";

export default function StudioCVPage() {
  const [cvData, setCvData] = useState<CustomCVData | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [iframeHeightPx, setIframeHeightPx] = useState<number>(1123);
  const [showHelperDrawer, setShowHelperDrawer] = useState<boolean>(false);
  const [fontSizePt, setFontSizePt] = useState<number>(9.0);
  const [lineHeight, setLineHeight] = useState<number>(1.35);
  const [marginMm, setMarginMm] = useState<number>(8.0);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const currentHtmlRef = useRef<string>("");

  const showNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Exit fullscreen on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Dynamic iframe height adjustment (no nested scrollbars, full continuous document)
  const updateIframeHeight = useCallback(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc || !doc.body) return;

    requestAnimationFrame(() => {
      try {
        const bodyHeight = doc.body.scrollHeight;
        const docHeight = doc.documentElement.scrollHeight;
        const naturalHeight = Math.max(bodyHeight, docHeight, 1123);
        const finalHeight = naturalHeight + 25;
        if (iframeRef.current) {
          iframeRef.current.style.height = `${finalHeight}px`;
        }
        setIframeHeightPx(finalHeight);
      } catch (err) {
        // Safe fallback
      }
    });
  }, []);

  // Fit to screen width for maximum visual clarity
  const fitWidth = useCallback(() => {
    if (!canvasContainerRef.current) return;
    const containerWidth = canvasContainerRef.current.clientWidth;
    // A4 width: 210mm ≈ 794px + 64px comfortable margins
    const targetZoom = Math.min(1.5, Math.max(0.7, (containerWidth - 64) / 794));
    setZoomScale(Number(targetZoom.toFixed(2)));
    showNotification("info", `Zoom ajusté à la largeur de votre écran (${Math.round(targetZoom * 100)}%).`);
  }, []);

  // 1. Initial Load: Check for draft or load from Master Profile
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const draftRes = await fetchCVDraft();
      if (draftRes.has_draft && draftRes.html_content) {
        setHtmlContent(draftRes.html_content);
        currentHtmlRef.current = draftRes.html_content;
        if (draftRes.data) {
          setCvData(draftRes.data);
          setFontSizePt(draftRes.data.font_size_pt || 9.0);
          setLineHeight(draftRes.data.line_height || 1.35);
          setMarginMm(draftRes.data.margin_top_mm || 8.0);
        }
        showNotification("info", "Brouillon sauvegardé chargé avec succès.");
      } else {
        const profRes = await fetchCVFromProfile("fr");
        setCvData(profRes.data);
        setHtmlContent(profRes.html_content);
        currentHtmlRef.current = profRes.html_content;
        setFontSizePt(profRes.data.font_size_pt || 9.0);
        setLineHeight(profRes.data.line_height || 1.35);
        setMarginMm(profRes.data.margin_top_mm || 8.0);
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

  // 2. Setup direct in-place editable behavior on iframe
  const setupIframeEditable = useCallback(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc || !doc.body) return;

    // Enable direct editing on the whole document
    doc.body.contentEditable = "true";
    doc.body.spellcheck = false;

    // Inject editor visual styles (hover dashed outline, focus ring, visual page break line)
    // AND enforce strict font and style inheritance for any edited or pasted content
    const existingStyle = doc.getElementById("cv-studio-editor-styles");
    if (!existingStyle) {
      const styleEl = doc.createElement("style");
      styleEl.id = "cv-studio-editor-styles";
      styleEl.textContent = `
        body {
          outline: none !important;
          cursor: text;
        }
        /* Enforce uniform typography: pasted or edited text inherits CV font & colors */
        body * {
          font-family: inherit !important;
        }
        span:not([class]), font {
          color: inherit !important;
          font-size: inherit !important;
          background: transparent !important;
          background-color: transparent !important;
        }
        .item, .section, header, p, .skill-row {
          position: relative;
        }
        .item:hover, header:hover, .section-title:hover, .skill-row:hover {
          outline: 1px dashed rgba(59, 130, 246, 0.45);
          outline-offset: 2px;
          border-radius: 3px;
        }
        .item:focus-within, header:focus-within, .skill-row:focus-within {
          outline: 1.5px solid #3b82f6 !important;
          outline-offset: 2px;
          border-radius: 3px;
        }
        /* Visual Page 1 delimiter marker */
        .cv-editor-page-break {
          position: relative;
          margin-top: 15px;
          margin-bottom: 15px;
          border-top: 2px dashed #93c5fd;
          text-align: right;
          color: #2563eb;
          font-family: monospace;
          font-size: 8pt;
          font-weight: bold;
          user-select: none;
          pointer-events: none;
        }
        .cv-editor-page-break span {
          background: #eff6ff;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid #bfdbfe;
        }
        @media print {
          .cv-editor-page-break {
            display: none !important;
          }
          * {
            outline: none !important;
          }
        }
      `;
      doc.head.appendChild(styleEl);
    }

    // Helper to strip foreign inline styles (color, font-family, font-size, background)
    const stripForeignStyles = (root: Element) => {
      const styledElements = root.querySelectorAll("[style]");
      styledElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.classList.contains("cv-editor-page-break")) return;
        htmlEl.style.removeProperty("font-family");
        htmlEl.style.removeProperty("font-size");
        htmlEl.style.removeProperty("color");
        htmlEl.style.removeProperty("background");
        htmlEl.style.removeProperty("background-color");
        htmlEl.style.removeProperty("line-height");
        if (!htmlEl.getAttribute("style")?.trim()) {
          htmlEl.removeAttribute("style");
        }
      });
    };

    // Attach input & keyup listeners to capture direct in-place edits
    const handleInput = () => {
      setHasUnsavedEdits(true);
      if (iframeRef.current?.contentDocument) {
        currentHtmlRef.current = iframeRef.current.contentDocument.documentElement.outerHTML;
      }
      updateIframeHeight();
    };

    // Intercept clipboard paste to guarantee 100% style inheritance
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      // Extract clean plain text from clipboard
      const text = e.clipboardData?.getData("text/plain") || "";
      if (!text) return;

      const cleanText = text.replace(/\r\n/g, "\n");

      // Insert plain text using execCommand to preserve browser Undo/Redo stack (Cmd+Z / Ctrl+Z)
      const success = doc.execCommand("insertText", false, cleanText);

      // Fallback if execCommand was not supported
      if (!success && doc.defaultView) {
        const sel = doc.defaultView.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          
          const lines = cleanText.split("\n");
          const fragment = doc.createDocumentFragment();
          lines.forEach((line, idx) => {
            if (idx > 0) fragment.appendChild(doc.createElement("br"));
            if (line) fragment.appendChild(doc.createTextNode(line));
          });
          range.insertNode(fragment);
          sel.collapseToEnd();
        }
      }

      // Strip any accidental inline style attributes in the current block
      stripForeignStyles(doc.body);

      handleInput();
    };

    doc.addEventListener("input", handleInput);
    doc.addEventListener("keyup", handleInput);
    doc.addEventListener("paste", handlePaste);

    updateIframeHeight();

    return () => {
      doc.removeEventListener("input", handleInput);
      doc.removeEventListener("keyup", handleInput);
      doc.removeEventListener("paste", handlePaste);
    };
  }, [updateIframeHeight]);

  // 3. Clean HTML extractor for 100% Identical Vector PDF Compilation
  const getCleanHtmlForPdf = (): string => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) {
      return currentHtmlRef.current || htmlContent;
    }
    const doc = iframeRef.current.contentDocument;
    const docClone = doc.documentElement.cloneNode(true) as HTMLElement;

    // Remove editor-specific contentEditable attributes & helper styles
    docClone.querySelectorAll("[contenteditable]").forEach((el) => {
      el.removeAttribute("contenteditable");
      el.removeAttribute("spellcheck");
    });
    const body = docClone.querySelector("body");
    if (body) {
      body.removeAttribute("contenteditable");
      body.removeAttribute("spellcheck");
      body.removeAttribute("style");
    }

    // Strip any rogue inline foreign styles from pasted content
    docClone.querySelectorAll("[style]").forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.removeProperty("font-family");
      htmlEl.style.removeProperty("font-size");
      htmlEl.style.removeProperty("color");
      htmlEl.style.removeProperty("background");
      htmlEl.style.removeProperty("background-color");
      if (!htmlEl.getAttribute("style")?.trim()) {
        htmlEl.removeAttribute("style");
      }
    });

    // Remove editor helper CSS
    const editorStyles = docClone.querySelector("#cv-studio-editor-styles");
    if (editorStyles) editorStyles.remove();

    // Remove page break visual lines
    docClone.querySelectorAll(".cv-editor-page-break").forEach((el) => el.remove());

    return "<!DOCTYPE html>\n" + docClone.outerHTML;
  };

  // 4. In-Place Direct Formatting Actions
  const executeDocCommand = (command: string, value: string | undefined = undefined) => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const doc = iframeRef.current.contentDocument;
    doc.execCommand(command, false, value);
    if (iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
    }
    setHasUnsavedEdits(true);
    currentHtmlRef.current = doc.documentElement.outerHTML;
  };

  // 5. In-Place Structural Insertions
  const insertExperienceBlock = () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const doc = iframeRef.current.contentDocument;

    // Find Experience Section
    const sections = Array.from(doc.querySelectorAll(".section"));
    const expSection = sections.find((s) => {
      const title = s.querySelector(".section-title")?.textContent || "";
      return /expérience|experience|stage/i.test(title);
    });

    const newExp = doc.createElement("div");
    newExp.className = "item";
    newExp.innerHTML = `
      <div class="item-header">
        <span class="item-role">Stagiaire Ingénieur</span> — 
        <span class="item-company">Nouvelle Entreprise</span>
        <span class="item-date">06/2026 – 08/2026</span>
      </div>
      <div class="item-desc">Description concrète de votre mission, réalisations et valeur délivrée.</div>
      <div class="item-tech"><em>Technologies :</em> Python, Docker, Kubernetes</div>
    `;

    if (expSection) {
      expSection.appendChild(newExp);
    } else {
      doc.querySelector(".cv-container")?.appendChild(newExp);
    }

    newExp.scrollIntoView({ behavior: "smooth", block: "center" });
    const roleSpan = newExp.querySelector(".item-role") as HTMLElement;
    if (roleSpan && doc.defaultView) {
      const range = doc.createRange();
      const sel = doc.defaultView.getSelection();
      range.selectNodeContents(roleSpan);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    setHasUnsavedEdits(true);
    currentHtmlRef.current = doc.documentElement.outerHTML;
    showNotification("info", "Nouveau stage inséré directement sur la page. Cliquez pour modifier.");
  };

  const insertEducationBlock = () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const doc = iframeRef.current.contentDocument;

    const sections = Array.from(doc.querySelectorAll(".section"));
    const eduSection = sections.find((s) => {
      const title = s.querySelector(".section-title")?.textContent || "";
      return /formation|education|diplôme/i.test(title);
    });

    const newEdu = doc.createElement("div");
    newEdu.className = "item";
    newEdu.innerHTML = `
      <div class="item-header">
        <span class="item-role">Diplôme National d'Ingénieur</span> — 
        <span class="item-company">ESPRIT</span>
        <span class="item-date">2022 – 2027</span>
      </div>
      <div class="item-desc">Spécialisation Systèmes Distribués, Cloud et DevOps.</div>
    `;

    if (eduSection) {
      eduSection.appendChild(newEdu);
    } else {
      doc.querySelector(".cv-container")?.appendChild(newEdu);
    }

    newEdu.scrollIntoView({ behavior: "smooth", block: "center" });
    setHasUnsavedEdits(true);
    currentHtmlRef.current = doc.documentElement.outerHTML;
    showNotification("info", "Nouvelle formation insérée directement sur la page.");
  };

  const insertProjectBlock = () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const doc = iframeRef.current.contentDocument;

    const sections = Array.from(doc.querySelectorAll(".section"));
    const projSection = sections.find((s) => {
      const title = s.querySelector(".section-title")?.textContent || "";
      return /projet|project/i.test(title);
    });

    const newProj = doc.createElement("div");
    newProj.className = "item";
    newProj.innerHTML = `
      <div class="item-header">
        <span class="item-role">Nouveau Projet d'Ingénierie</span> (Lead Développeur)
      </div>
      <div class="item-desc">Plateforme ou système développé avec architecture cloud et pipeline CI/CD automatisé.</div>
      <div class="item-tech"><em>Technologies :</em> Next.js, FastAPI, Docker</div>
    `;

    if (projSection) {
      projSection.appendChild(newProj);
    } else {
      doc.querySelector(".cv-container")?.appendChild(newProj);
    }

    newProj.scrollIntoView({ behavior: "smooth", block: "center" });
    setHasUnsavedEdits(true);
    currentHtmlRef.current = doc.documentElement.outerHTML;
    showNotification("info", "Nouveau projet inséré directement sur la page.");
  };

  const insertSkillCategory = () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const doc = iframeRef.current.contentDocument;

    const skillsGrid = doc.querySelector(".skills-grid");
    const newSkillRow = doc.createElement("div");
    newSkillRow.className = "skill-row";
    newSkillRow.innerHTML = `
      <span class="skill-cat">Nouvelle Catégorie :</span>
      <span class="skill-list">Outil 1, Outil 2, Outil 3</span>
    `;

    if (skillsGrid) {
      skillsGrid.appendChild(newSkillRow);
    }
    newSkillRow.scrollIntoView({ behavior: "smooth", block: "center" });
    setHasUnsavedEdits(true);
    currentHtmlRef.current = doc.documentElement.outerHTML;
    updateIframeHeight();
  };

  const insertExtracurricularBlock = () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const doc = iframeRef.current.contentDocument;

    let extraSection = Array.from(doc.querySelectorAll(".section")).find((s) => {
      const title = s.querySelector(".section-title")?.textContent || "";
      return /extra|associati|activité|activite/i.test(title);
    });

    if (!extraSection) {
      extraSection = doc.createElement("section");
      extraSection.className = "section";
      extraSection.innerHTML = `<h2 class="section-title">ACTIVITÉS EXTRA-PROFESSIONNELLES</h2>`;
      const container = doc.querySelector(".cv-container") || doc.body;
      container.appendChild(extraSection);
    }

    const newExtra = doc.createElement("div");
    newExtra.className = "item";
    newExtra.innerHTML = `
      <div class="item-header">
        <span class="item-role">Club ou Association</span> — Responsable Projets
        <span class="item-date">2025 – 2026</span>
      </div>
      <div class="item-desc">Organisation d'événements, hackathons ou engagement associatif.</div>
    `;

    extraSection.appendChild(newExtra);
    newExtra.scrollIntoView({ behavior: "smooth", block: "center" });
    setHasUnsavedEdits(true);
    currentHtmlRef.current = doc.documentElement.outerHTML;
    updateIframeHeight();
    showNotification("info", "Nouvelle activité extra-professionnelle insérée directement sur la page.");
  };

  // 6. Delete Selected Item Block
  const deleteCurrentItem = () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const doc = iframeRef.current.contentDocument;
    const sel = doc.defaultView?.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    let node: Node | null = sel.anchorNode;
    while (node && node !== doc.body) {
      if (node instanceof HTMLElement && (node.classList.contains("item") || node.classList.contains("skill-row"))) {
        node.remove();
        setHasUnsavedEdits(true);
        currentHtmlRef.current = doc.documentElement.outerHTML;
        showNotification("info", "Élément supprimé.");
        return;
      }
      node = node.parentNode;
    }
    showNotification("error", "Placez votre curseur dans un bloc (stage, projet, formation) pour le supprimer.");
  };

  // 7. Adjust Live Font Size & Margins directly on the sheet
  const handleFontSizeChange = (newSize: number) => {
    setFontSizePt(newSize);
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const doc = iframeRef.current.contentDocument;
    doc.body.style.fontSize = `${newSize}pt`;
    setHasUnsavedEdits(true);
    currentHtmlRef.current = doc.documentElement.outerHTML;
    updateIframeHeight();
  };

  const handleLineHeightChange = (newLineHeight: number) => {
    setLineHeight(newLineHeight);
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const doc = iframeRef.current.contentDocument;
    doc.body.style.lineHeight = `${newLineHeight}`;
    setHasUnsavedEdits(true);
    currentHtmlRef.current = doc.documentElement.outerHTML;
    updateIframeHeight();
  };

  const handleMarginChange = (newMargin: number) => {
    setMarginMm(newMargin);
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const doc = iframeRef.current.contentDocument;
    const styleEl = doc.querySelector("style");
    if (styleEl) {
      styleEl.textContent = styleEl.textContent?.replace(
        /@page\s*\{[^}]*\}/g,
        `@page { size: A4 portrait; margin: ${newMargin}mm 12mm; }`
      ) || "";
    }
    setHasUnsavedEdits(true);
    currentHtmlRef.current = doc.documentElement.outerHTML;
    updateIframeHeight();
  };

  // 8. File Upload (PDF, TXT, JSON)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      showNotification("info", `Extraction de ${file.name} en cours...`);
      const result = await uploadCVFile(file, false);
      setCvData(result.data);
      setHtmlContent(result.html_content);
      currentHtmlRef.current = result.html_content;
      setHasUnsavedEdits(true);
      showNotification("success", `CV extrait avec succès ! Modifiable directement sur la feuille A4.`);
    } catch (err: any) {
      showNotification("error", err.message || "Échec de l'analyse du fichier.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 9. Download Vector PDF (100% Pixel-Perfect Chromium Compilation)
  const handleDownloadPdf = async () => {
    const cleanHtml = getCleanHtmlForPdf();
    if (!cleanHtml) return;

    try {
      setIsCompiling(true);
      const nameMatch = cleanHtml.match(/<h1>(.*?)<\/h1>/i);
      const rawName = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, "").trim() : "Candidat";
      const cleanName = rawName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "CV";
      const filename = `CV_${cleanName}_A4_Vectoriel.pdf`;

      const blob = await compileCustomCVPdf(cleanHtml, filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showNotification("success", `PDF vectoriel A4 téléchargé (${filename}) avec fidélité 100% identique !`);
    } catch (err: any) {
      showNotification("error", err.message || "Erreur de compilation du PDF.");
    } finally {
      setIsCompiling(false);
    }
  };

  // 10. Native Print
  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  // 11. Save Draft in SQLite
  const handleSaveDraft = async () => {
    if (!cvData) return;
    try {
      setIsSaving(true);
      const currentHtml = getCleanHtmlForPdf();
      await saveCVDraft({
        ...cvData,
        html_content: currentHtml,
        font_size_pt: fontSizePt,
        line_height: lineHeight,
        margin_top_mm: marginMm,
        margin_bottom_mm: marginMm,
      });
      setHasUnsavedEdits(false);
      showNotification("success", "Modifications et texte enregistrés dans votre base SQLite locale.");
    } catch (err: any) {
      showNotification("error", err.message || "Échec de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  // 12. Reset with Master Profile
  const handleResetMasterProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetchCVFromProfile("fr");
      setCvData(res.data);
      setHtmlContent(res.html_content);
      currentHtmlRef.current = res.html_content;
      setHasUnsavedEdits(false);
      showNotification("success", "Données du Master Profile rechargées.");
    } catch (err: any) {
      showNotification("error", err.message || "Échec du rechargement.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[85vh]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-mono text-muted-foreground">
            Chargement de l'éditeur de PDF visuel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col min-w-0 transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 w-screen h-screen bg-[#F0EBE1]"
          : "h-full min-h-screen bg-[#F7F2EB]"
      }`}
    >
      {/* Hidden file upload input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.json,.md"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Cockpit Header: Identity & Global Actions */}
      <header className="px-5 py-2.5 border-b border-border bg-white/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-primary shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight font-display flex items-center gap-2">
                Éditeur Visuel de CV
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  WYSIWYG Direct
                </span>
              </h1>
              {hasUnsavedEdits && (
                <span className="text-[10px] text-amber-900 font-mono bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 font-semibold">
                  Modifications non enregistrées
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-600 line-clamp-1">
              Cliquez directement sur n'importe quel texte du CV pour le modifier en temps réel.
            </p>
          </div>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              isFullscreen
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                : "border-border/80 bg-muted/40 hover:bg-muted text-foreground"
            }`}
            title={isFullscreen ? "Quitter le mode plein écran (Échap)" : "Agrandir en plein écran pour un visuel maximal"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? "Fenêtre normale" : "Plein Écran"}</span>
          </button>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <Upload className={`w-3.5 h-3.5 ${isUploading ? "animate-bounce" : ""}`} />
            <span>{isUploading ? "Lecture..." : "Importer CV (PDF/TXT)"}</span>
          </button>

          {/* Reset from Master Profile */}
          <button
            type="button"
            onClick={handleResetMasterProfile}
            className="px-3 py-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all shadow-sm"
            title="Recharger les données certifiées du Master Profile"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Master Profile</span>
          </button>

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

          {/* Hero Action: Download Vector PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isCompiling}
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isCompiling ? "animate-spin" : ""}`} />
            <span>{isCompiling ? "Compilation..." : "Télécharger PDF (Identique)"}</span>
          </button>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div
          className={`mx-5 mt-2 p-2.5 rounded-lg border text-xs flex items-center justify-between shrink-0 animate-in slide-in-from-top-2 duration-150 z-30 font-medium ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs"
              : notification.type === "error"
              ? "bg-rose-50 border-rose-300 text-rose-950 shadow-xs"
              : "bg-blue-50 border-blue-300 text-blue-950 shadow-xs"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : notification.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-700 shrink-0" />
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

      {/* Floating Canvas Formatting Toolbar (Like Google Docs / Acrobat / Sejda) */}
      <div className="px-5 py-2 border-b border-border bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs z-10 shadow-xs">
        {/* Left: Text Formatting Controls */}
        <div className="flex items-center flex-wrap gap-1">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden sm:inline">Mise en forme :</span>
          <button
            type="button"
            onClick={() => executeDocCommand("bold")}
            className="p-1.5 rounded hover:bg-muted/70 text-foreground transition-colors font-bold"
            title="Gras (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeDocCommand("italic")}
            className="p-1.5 rounded hover:bg-muted/70 text-foreground transition-colors italic"
            title="Italique (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeDocCommand("underline")}
            className="p-1.5 rounded hover:bg-muted/70 text-foreground transition-colors underline"
            title="Souligné (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeDocCommand("insertUnorderedList")}
            className="p-1.5 rounded hover:bg-muted/70 text-foreground transition-colors"
            title="Liste à puces"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-border/80 mx-1.5" />

          {/* Direct Document Inserters */}
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden md:inline">Insérer sur le CV :</span>
          <button
            type="button"
            onClick={insertExperienceBlock}
            className="px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary text-[11px] font-bold flex items-center gap-1 transition-colors"
            title="Insérer un nouveau bloc stage / expérience"
          >
            <Briefcase className="w-3 h-3" />
            <span>+ Stage</span>
          </button>
          <button
            type="button"
            onClick={insertEducationBlock}
            className="px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary text-[11px] font-bold flex items-center gap-1 transition-colors"
            title="Insérer une formation"
          >
            <GraduationCap className="w-3 h-3" />
            <span>+ Formation</span>
          </button>
          <button
            type="button"
            onClick={insertProjectBlock}
            className="px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary text-[11px] font-bold flex items-center gap-1 transition-colors"
            title="Insérer un projet"
          >
            <FolderGit2 className="w-3 h-3" />
            <span>+ Projet</span>
          </button>
          <button
            type="button"
            onClick={insertSkillCategory}
            className="px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary text-[11px] font-bold flex items-center gap-1 transition-colors"
            title="Insérer une catégorie de compétences"
          >
            <Code2 className="w-3 h-3" />
            <span>+ Compétences</span>
          </button>
          <button
            type="button"
            onClick={insertExtracurricularBlock}
            className="px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary text-[11px] font-bold flex items-center gap-1 transition-colors"
            title="Insérer une activité extra-professionnelle (club, association, hackathon)"
          >
            <Award className="w-3 h-3" />
            <span>+ Extra-pro</span>
          </button>
          <button
            type="button"
            onClick={deleteCurrentItem}
            className="p-1 rounded text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors ml-1"
            title="Supprimer le bloc sous le curseur"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Typography Calibration & Zoom */}
        <div className="flex items-center gap-3">
          {/* Font Size slider */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Taille :</span>
            <input
              type="range"
              min={8.0}
              max={10.5}
              step={0.1}
              value={fontSizePt}
              onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
              className="w-16 accent-primary cursor-pointer"
            />
            <span className="text-[10px] font-mono text-foreground w-8">{fontSizePt}pt</span>
          </div>

          <div className="h-4 w-px bg-border/80" />

          {/* Margins */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Marges :</span>
            <select
              value={marginMm}
              onChange={(e) => handleMarginChange(parseFloat(e.target.value))}
              className="bg-background border border-border/80 text-foreground text-[11px] rounded px-1.5 py-0.5 outline-none cursor-pointer"
            >
              <option value={6}>6 mm (Compact)</option>
              <option value={8}>8 mm (Standard)</option>
              <option value={10}>10 mm (Aéré)</option>
              <option value={12}>12 mm (Large)</option>
            </select>
          </div>

          <div className="h-4 w-px bg-border/80" />

          {/* Zoom scale */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.max(0.6, Number((z - 0.1).toFixed(2))))}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Zoom -"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-muted-foreground w-10 text-center font-bold">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.min(1.6, Number((z + 0.1).toFixed(2))))}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Zoom +"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(1.0)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                zoomScale === 1.0
                  ? "bg-primary/20 text-primary border-primary/40 font-bold"
                  : "border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
              title="Taille réelle A4 (100%)"
            >
              100%
            </button>
            <button
              type="button"
              onClick={fitWidth}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-border/60 hover:bg-primary/15 hover:text-primary hover:border-primary/30 text-muted-foreground transition-colors"
              title="Ajuster à la largeur de votre écran pour un visuel agrandi et clair"
            >
              Ajuster Largeur
            </button>
          </div>
        </div>
      </div>

      {/* Main Full-Focus Visual Canvas (Desk / Page Environment) */}
      <div
        ref={canvasContainerRef}
        className="flex-1 overflow-auto p-2 sm:p-6 md:p-8 flex justify-center items-start bg-[#EFE8DD] relative select-none"
      >
        {/* Floating Instruction Pill */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="px-3.5 py-1 rounded-full bg-white/95 border border-orange-200 text-stone-900 text-[11px] font-medium backdrop-blur-md shadow-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Mode Éditeur Visuel Actif : Cliquez pour éditer &bull; Le texte collé adopte fidèlement le style du CV</span>
          </div>
        </div>

        {/* Real A4 Paper Sheet (210mm x dynamic height for 1 or 2 pages) */}
        <div
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
            height: `${iframeHeightPx}px`,
          }}
          className="w-[210mm] bg-white text-black shadow-[0_20px_50px_-10px_rgba(44,28,16,0.18)] rounded-sm border border-stone-300 overflow-hidden shrink-0 flex flex-col relative select-text"
        >
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            onLoad={setupIframeEditable}
            title="Éditeur de CV Direct A4"
            className="w-full flex-1 border-0 bg-white"
            style={{
              height: `${iframeHeightPx}px`,
              minHeight: "1123px",
            }}
          />
        </div>
      </div>
    </div>
  );
}
