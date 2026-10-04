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
  X,
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
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useAppLanguage } from "@/lib/language-context";

// Largeur d'une page A4 (210mm) en pixels CSS, et zoom minimal autorisé (écrans mobiles)
const A4_WIDTH_PX = 794;
const MIN_ZOOM = 0.3;

export default function StudioCVPage() {
  const { t } = useAppLanguage();
  const [cvData, setCvData] = useState<CustomCVData | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProfileEmpty, setIsProfileEmpty] = useState<boolean>(false);
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

  // Zoom qui fait tenir la feuille A4 dans la largeur disponible
  const computeFitZoom = useCallback(() => {
    if (!canvasContainerRef.current) return 1;
    const containerWidth = canvasContainerRef.current.clientWidth;
    const margin = containerWidth < 640 ? 16 : 64;
    return Number(Math.min(1.5, Math.max(MIN_ZOOM, (containerWidth - margin) / A4_WIDTH_PX)).toFixed(2));
  }, []);

  // Fit to screen width for maximum visual clarity
  const fitWidth = useCallback(() => {
    const targetZoom = computeFitZoom();
    setZoomScale(targetZoom);
    showNotification(
      "info",
      t(
        `Zoom ajusté à la largeur de votre écran (${Math.round(targetZoom * 100)}%).`,
        `Zoom fitted to your screen width (${Math.round(targetZoom * 100)}%).`
      )
    );
  }, [computeFitZoom]);

  // Sur petit écran, la feuille A4 (794px) est réduite automatiquement pour tenir dans la largeur
  useEffect(() => {
    const fitIfTooNarrow = () => {
      if (!canvasContainerRef.current) return;
      if (canvasContainerRef.current.clientWidth < A4_WIDTH_PX + 64) {
        setZoomScale(computeFitZoom());
      }
    };
    fitIfTooNarrow();
    window.addEventListener("resize", fitIfTooNarrow);
    return () => window.removeEventListener("resize", fitIfTooNarrow);
  }, [computeFitZoom, isLoading]);

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
        setIsProfileEmpty(Boolean(draftRes.is_profile_empty));
        showNotification("info", t("Brouillon sauvegardé chargé avec succès.", "Saved draft loaded successfully."));
      } else {
        const profRes = await fetchCVFromProfile("fr");
        setCvData(profRes.data);
        setHtmlContent(profRes.html_content);
        currentHtmlRef.current = profRes.html_content;
        setFontSizePt(profRes.data.font_size_pt || 9.0);
        setLineHeight(profRes.data.line_height || 1.35);
        setMarginMm(profRes.data.margin_top_mm || 8.0);
        setIsProfileEmpty(Boolean(profRes.is_profile_empty));
      }
    } catch (err: any) {
      showNotification("error", err.message || t("Erreur de chargement du CV.", "Error loading the CV."));
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
        <span class="item-role">Poste / Rôle</span> — 
        <span class="item-company">Entreprise</span>
        <span class="item-date">MM/AAAA – MM/AAAA</span>
      </div>
      <div class="item-desc">Description de la mission, réalisations et valeur délivrée.</div>
      <div class="item-tech"><em>Technologies :</em> Outils, Frameworks</div>
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
    showNotification("info", t("Nouvelle expérience insérée. Cliquez pour modifier.", "New experience inserted. Click to edit."));
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
        <span class="item-role">Diplôme</span> — 
        <span class="item-company">Établissement / École</span>
        <span class="item-date">Année – Année</span>
      </div>
      <div class="item-desc">Domaine d'études ou spécialité.</div>
    `;

    if (eduSection) {
      eduSection.appendChild(newEdu);
    } else {
      doc.querySelector(".cv-container")?.appendChild(newEdu);
    }

    newEdu.scrollIntoView({ behavior: "smooth", block: "center" });
    setHasUnsavedEdits(true);
    currentHtmlRef.current = doc.documentElement.outerHTML;
    showNotification("info", t("Nouvelle formation insérée. Cliquez pour modifier.", "New education inserted. Click to edit."));
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
        <span class="item-role">Titre du Projet</span> (Rôle)
      </div>
      <div class="item-desc">Description de la réalisation et valeur apportée.</div>
      <div class="item-tech"><em>Technologies :</em> Technologies utilisées</div>
    `;

    if (projSection) {
      projSection.appendChild(newProj);
    } else {
      doc.querySelector(".cv-container")?.appendChild(newProj);
    }

    newProj.scrollIntoView({ behavior: "smooth", block: "center" });
    setHasUnsavedEdits(true);
    currentHtmlRef.current = doc.documentElement.outerHTML;
    showNotification("info", t("Nouveau projet inséré. Cliquez pour modifier.", "New project inserted. Click to edit."));
  };

  const insertSkillCategory = () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    const doc = iframeRef.current.contentDocument;

    const skillsGrid = doc.querySelector(".skills-grid");
    const newSkillRow = doc.createElement("div");
    newSkillRow.className = "skill-row";
    newSkillRow.innerHTML = `
      <span class="skill-cat">Catégorie :</span>
      <span class="skill-list">Compétence 1, Compétence 2</span>
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
        <span class="item-role">Club ou Association</span> — Rôle
        <span class="item-date">Année</span>
      </div>
      <div class="item-desc">Activités, engagements et réalisations.</div>
    `;

    extraSection.appendChild(newExtra);
    newExtra.scrollIntoView({ behavior: "smooth", block: "center" });
    setHasUnsavedEdits(true);
    currentHtmlRef.current = doc.documentElement.outerHTML;
    updateIframeHeight();
    showNotification("info", t("Nouvelle activité extra-professionnelle insérée directement sur la page.", "New extracurricular activity inserted directly on the page."));
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
        showNotification("info", t("Élément supprimé.", "Element deleted."));
        return;
      }
      node = node.parentNode;
    }
    showNotification("error", t("Placez votre curseur dans un bloc (stage, projet, formation) pour le supprimer.", "Place your cursor inside a block (internship, project, education) to delete it."));
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
      showNotification("info", t(`Extraction de ${file.name} en cours...`, `Extracting ${file.name}...`));
      const result = await uploadCVFile(file, false);
      setCvData(result.data);
      setHtmlContent(result.html_content);
      currentHtmlRef.current = result.html_content;
      setHasUnsavedEdits(true);
      showNotification("success", t("CV extrait avec succès ! Modifiable directement sur la feuille A4.", "CV extracted successfully! Editable directly on the A4 sheet."));
    } catch (err: any) {
      showNotification("error", err.message || t("Échec de l'analyse du fichier.", "Failed to parse the file."));
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
      showNotification(
        "success",
        t(
          `PDF vectoriel A4 téléchargé (${filename}) avec fidélité 100% identique !`,
          `A4 vector PDF downloaded (${filename}), 100% identical!`
        )
      );
    } catch (err: any) {
      showNotification("error", err.message || t("Erreur de compilation du PDF.", "PDF compilation error."));
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
      showNotification("success", t("Votre CV a été enregistré avec succès.", "Your CV was saved successfully."));
    } catch (err: any) {
      showNotification("error", err.message || t("Échec de la sauvegarde.", "Save failed."));
    } finally {
      setIsSaving(false);
    }
  };

  // 12. Reset with Profile
  const handleResetMasterProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetchCVFromProfile("fr");
      setCvData(res.data);
      setHtmlContent(res.html_content);
      currentHtmlRef.current = res.html_content;
      setHasUnsavedEdits(false);
      setIsProfileEmpty(Boolean(res.is_profile_empty));
      if (res.is_profile_empty) {
        showNotification("info", t("Votre profil est actuellement vide.", "Your profile is currently empty."));
      } else {
        showNotification("success", t("Données de votre profil rechargées.", "Your profile data was reloaded."));
      }
    } catch (err: any) {
      showNotification("error", err.message || t("Échec du rechargement.", "Reload failed."));
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
            {t("Chargement de l'éditeur de PDF visuel...", "Loading the visual PDF editor...")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col min-w-0 transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 w-screen h-screen bg-[#F0EBE1] dark:bg-[#12100E]"
          : "h-full min-h-screen bg-[#F7F2EB] dark:bg-[#12100E]"
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
      <header className="px-3 sm:px-5 py-2.5 border-b border-stone-200/80 dark:border-stone-800 bg-white/85 dark:bg-stone-900/90 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 flex items-center justify-center text-primary dark:text-orange-400 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight font-display flex items-center gap-2">
                {t("Éditeur Visuel de CV", "Visual CV Editor")}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  {t("Édition Directe", "Direct Editing")}
                </span>
              </h1>
              {hasUnsavedEdits && (
                <span className="text-[10px] text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800/60 font-semibold">
                  {t("Modifications non enregistrées", "Unsaved changes")}
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-1">
              {t("Cliquez directement sur n'importe quel texte du CV pour le modifier en temps réel.", "Click any text on the CV to edit it in real time.")}
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
            title={isFullscreen ? t("Quitter le mode plein écran (Échap)", "Exit full screen (Esc)") : t("Agrandir en plein écran pour un visuel maximal", "Expand to full screen for maximum visibility")}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? t("Fenêtre normale", "Normal window") : t("Plein Écran", "Full Screen")}</span>
          </button>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <Upload className={`w-3.5 h-3.5 ${isUploading ? "animate-bounce" : ""}`} />
            <span>{isUploading ? t("Lecture...", "Reading...") : t("Importer CV (PDF/TXT)", "Import CV (PDF/TXT)")}</span>
          </button>

          {/* Reset from Profile */}
          <button
            type="button"
            onClick={handleResetMasterProfile}
            className="px-3 py-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all shadow-sm"
            title={t("Recharger les données de mon profil", "Reload my profile data")}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t("Mon Profil", "My Profile")}</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
            <span>{t("Sauvegarder", "Save")}</span>
          </button>

          {/* Native Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-foreground transition-all"
            title={t("Imprimer directement", "Print directly")}
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
            <span>{isCompiling ? t("Compilation...", "Compiling...") : t("Télécharger PDF (Identique)", "Download PDF (Identical)")}</span>
          </button>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div
          className={`mx-5 mt-2 p-2.5 rounded-lg border text-xs flex items-center justify-between shrink-0 animate-in slide-in-from-top-2 duration-150 z-30 font-medium ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-300 shadow-xs"
              : notification.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/60 text-rose-950 dark:text-rose-300 shadow-xs"
              : "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800/60 text-blue-950 dark:text-blue-300 shadow-xs"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            ) : notification.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 px-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Canvas Formatting Toolbar (Like Google Docs / Acrobat / Sejda) */}
      <div className={`sticky ${isFullscreen ? "top-0" : "top-14"} z-20 px-3 sm:px-5 py-2 border-b border-stone-200/80 dark:border-stone-800 bg-white/80 dark:bg-stone-900/90 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs shadow-xs`}>
        {/* Left: Text Formatting Controls */}
        <div className="flex items-center flex-wrap gap-1">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden sm:inline">{t("Mise en forme :", "Formatting:")}</span>
          <button
            type="button"
            onClick={() => executeDocCommand("bold")}
            className="p-1.5 rounded hover:bg-muted/70 text-foreground transition-colors font-bold"
            title={t("Gras (Ctrl+B)", "Bold (Ctrl+B)")}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeDocCommand("italic")}
            className="p-1.5 rounded hover:bg-muted/70 text-foreground transition-colors italic"
            title={t("Italique (Ctrl+I)", "Italic (Ctrl+I)")}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeDocCommand("underline")}
            className="p-1.5 rounded hover:bg-muted/70 text-foreground transition-colors underline"
            title={t("Souligné (Ctrl+U)", "Underline (Ctrl+U)")}
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeDocCommand("insertUnorderedList")}
            className="p-1.5 rounded hover:bg-muted/70 text-foreground transition-colors"
            title={t("Liste à puces", "Bulleted list")}
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-border/80 mx-1.5" />

          {/* Direct Document Inserters */}
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden md:inline">{t("Insérer sur le CV :", "Insert on the CV:")}</span>
          <button
            type="button"
            onClick={insertExperienceBlock}
            className="px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary text-[11px] font-bold flex items-center gap-1 transition-colors"
            title={t("Insérer un nouveau bloc stage / expérience", "Insert a new internship / experience block")}
          >
            <Briefcase className="w-3 h-3" />
            <span>{t("+ Stage", "+ Internship")}</span>
          </button>
          <button
            type="button"
            onClick={insertEducationBlock}
            className="px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary text-[11px] font-bold flex items-center gap-1 transition-colors"
            title={t("Insérer une formation", "Insert an education entry")}
          >
            <GraduationCap className="w-3 h-3" />
            <span>{t("+ Formation", "+ Education")}</span>
          </button>
          <button
            type="button"
            onClick={insertProjectBlock}
            className="px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary text-[11px] font-bold flex items-center gap-1 transition-colors"
            title={t("Insérer un projet", "Insert a project")}
          >
            <FolderGit2 className="w-3 h-3" />
            <span>{t("+ Projet", "+ Project")}</span>
          </button>
          <button
            type="button"
            onClick={insertSkillCategory}
            className="px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary text-[11px] font-bold flex items-center gap-1 transition-colors"
            title={t("Insérer une catégorie de compétences", "Insert a skills category")}
          >
            <Code2 className="w-3 h-3" />
            <span>{t("+ Compétences", "+ Skills")}</span>
          </button>
          <button
            type="button"
            onClick={insertExtracurricularBlock}
            className="px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary text-[11px] font-bold flex items-center gap-1 transition-colors"
            title={t("Insérer une activité extra-professionnelle (club, association, hackathon)", "Insert an extracurricular activity (club, association, hackathon)")}
          >
            <Award className="w-3 h-3" />
            <span>+ Extra-pro</span>
          </button>
          <button
            type="button"
            onClick={deleteCurrentItem}
            className="p-1 rounded text-stone-500 hover:text-rose-700 hover:bg-rose-50 dark:text-stone-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors ml-1"
            title={t("Supprimer le bloc sous le curseur", "Delete the block under the cursor")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Typography Calibration & Zoom */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {/* Font Size slider */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">{t("Taille :", "Size:")}</span>
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
            <span className="text-[11px] text-muted-foreground">{t("Marges :", "Margins:")}</span>
            <select
              value={marginMm}
              onChange={(e) => handleMarginChange(parseFloat(e.target.value))}
              className="bg-background border border-border/80 text-foreground text-[11px] rounded px-1.5 py-0.5 outline-none cursor-pointer"
            >
              <option value={6}>{t("6 mm (Compact)", "6 mm (Compact)")}</option>
              <option value={8}>{t("8 mm (Standard)", "8 mm (Standard)")}</option>
              <option value={10}>{t("10 mm (Aéré)", "10 mm (Airy)")}</option>
              <option value={12}>{t("12 mm (Large)", "12 mm (Wide)")}</option>
            </select>
          </div>

          <div className="h-4 w-px bg-border/80" />

          {/* Zoom scale */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.max(MIN_ZOOM, Number((z - 0.1).toFixed(2))))}
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
              title={t("Taille réelle A4 (100%)", "Actual A4 size (100%)")}
            >
              100%
            </button>
            <button
              type="button"
              onClick={fitWidth}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-border/60 hover:bg-primary/15 hover:text-primary hover:border-primary/30 text-muted-foreground transition-colors"
              title={t("Ajuster à la largeur de votre écran pour un visuel agrandi et clair", "Fit to your screen width for a larger, clearer view")}
            >
              {t("Ajuster Largeur", "Fit Width")}
            </button>
          </div>
        </div>
      </div>

      {/* Main Full-Focus Visual Canvas (Desk / Page Environment) */}
      <div
        ref={canvasContainerRef}
        className="flex-1 overflow-auto p-2 sm:p-6 md:p-8 flex flex-col items-center justify-start bg-[#EFE8DD] dark:bg-[#181513] relative select-none gap-5"
      >
        {/* Empty Profile Banner / Guidance Card */}
        {isProfileEmpty && (
          <div className="w-full max-w-[210mm] p-4 sm:p-5 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/95 dark:bg-amber-950/40 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-stone-900 dark:text-stone-100 shrink-0 select-text z-20">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-amber-200/90 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700/60 flex items-center justify-center text-amber-900 dark:text-amber-300 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-800 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">
                  {t("Votre Master Profile est actuellement vide", "Your Master Profile is currently empty")}
                </h3>
                <p className="text-xs text-stone-700 dark:text-stone-300 mt-1 leading-relaxed">
                  {t("Pour garantir un CV factuel et zéro hallucination, ArcApply construit votre CV directement à partir des formations, expériences et compétences de votre profil. Renseignez d'abord votre profil pour générer votre CV complet.", "To guarantee a factual CV with zero hallucination, ArcApply builds your CV directly from the education, experience and skills in your profile. Fill in your profile first to generate your complete CV.")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Link
                href="/profile"
                className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>{t("Remplir mon profil", "Fill in my profile")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Floating Instruction Pill */}
        {!isProfileEmpty && (
          <div className="sticky top-0 z-10 pointer-events-none mb-1">
            <div className="px-3.5 py-1 rounded-full bg-white/95 dark:bg-stone-900/95 border border-orange-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-[11px] font-medium backdrop-blur-md shadow-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>
                {t("Cliquez sur un élément pour le modifier", "Click an element to edit it")} &bull;{" "}
                {t("Le texte s'adapte automatiquement", "Text adapts automatically")}
              </span>
            </div>
          </div>
        )}

        {/* Real A4 Paper Sheet (210mm x dynamic height for 1 or 2 pages) */}
        {/* Le wrapper occupe la taille réellement affichée : transform: scale ne réduit pas la boîte de layout */}
        <div
          className="shrink-0 relative"
          style={{
            width: `${A4_WIDTH_PX * zoomScale}px`,
            height: `${iframeHeightPx * zoomScale}px`,
            transition: "width 0.15s ease-out, height 0.15s ease-out",
          }}
        >
        <div
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: "top left",
            transition: "transform 0.15s ease-out",
            height: `${iframeHeightPx}px`,
          }}
          className="w-[210mm] bg-white text-black shadow-[0_20px_50px_-10px_rgba(44,28,16,0.18)] rounded-sm border border-stone-300 overflow-hidden shrink-0 flex flex-col relative select-text"
        >
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            onLoad={setupIframeEditable}
            title={t("Éditeur de CV Direct A4", "Direct A4 CV Editor")}
            className="w-full flex-1 border-0 bg-white"
            style={{
              height: `${iframeHeightPx}px`,
              minHeight: "1123px",
            }}
          />
        </div>
        </div>
      </div>
    </div>
  );
}
