"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download,
  ChevronDown,
  FileText,
  Globe,
  Image as ImageIcon,
  FileCode,
  Loader2,
  Check,
} from "lucide-react";
import { downloadCoverLetterFile, CoverLetterFormat } from "@/lib/api";

interface LetterDownloadMenuProps {
  jobId?: string;
  jobTitle?: string;
  companyName?: string;
  content?: string;
  lang?: string;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
}

interface FormatOption {
  format: CoverLetterFormat;
  label: string;
  ext: string;
  desc: string;
  icon: typeof FileText;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: "pdf",
    label: "PDF Vectoriel",
    ext: ".pdf",
    desc: "Format standard A4 haute qualité",
    icon: FileText,
  },
  {
    format: "html",
    label: "Document Web",
    ext: ".html",
    desc: "Page HTML stylisée et imprimable",
    icon: Globe,
  },
  {
    format: "jpeg",
    label: "Image Haute Définition",
    ext: ".jpeg",
    desc: "Rendu graphique A4 retina 2x",
    icon: ImageIcon,
  },
  {
    format: "txt",
    label: "Texte Brut",
    ext: ".txt",
    desc: "Format épuré pour formulaires ATS",
    icon: FileCode,
  },
];

export function LetterDownloadMenu({
  jobId,
  jobTitle,
  companyName,
  content,
  lang = "fr",
  className = "",
  variant = "secondary",
}: LetterDownloadMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<CoverLetterFormat | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<CoverLetterFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu lors d'un clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = async (format: CoverLetterFormat) => {
    try {
      setDownloadingFormat(format);
      setError(null);
      await downloadCoverLetterFile({
        jobId,
        jobTitle,
        companyName,
        content,
        format,
        lang,
      });
      setDownloadSuccess(format);
      setTimeout(() => setDownloadSuccess(null), 2000);
      setIsOpen(false);
    } catch (err: any) {
      console.error(`Erreur téléchargement ${format}:`, err);
      setError(err?.message || `Échec du téléchargement en .${format}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const buttonStyle =
    variant === "primary"
      ? "bg-primary hover:bg-primary-hover text-white shadow-artisan-button tactile-button"
      : variant === "outline"
      ? "border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900"
      : "bg-stone-900 hover:bg-stone-800 text-white shadow-xs";

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!!downloadingFormat}
        className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${buttonStyle}`}
        title="Télécharger la lettre de motivation (.pdf, .html, .jpeg, .txt)"
      >
        {downloadingFormat ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{downloadingFormat ? "Génération..." : "Télécharger"}</span>
        <ChevronDown
          className={`w-3 h-3 opacity-70 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-72 rounded-2xl bg-white border border-stone-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-1.5 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
              Format d'exportation
            </span>
            {error && (
              <span className="text-[10px] text-red-600 font-semibold truncate max-w-[140px]">
                {error}
              </span>
            )}
          </div>

          <div className="p-1 space-y-0.5">
            {FORMAT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isItemLoading = downloadingFormat === opt.format;
              const isItemSuccess = downloadSuccess === opt.format;

              return (
                <button
                  key={opt.format}
                  type="button"
                  onClick={() => handleDownload(opt.format)}
                  disabled={!!downloadingFormat}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-between group disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 group-hover:bg-primary/10 text-stone-600 group-hover:text-primary flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-900">
                          {opt.label}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-semibold">
                          {opt.ext}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-tight">
                        {opt.desc}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isItemLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    ) : isItemSuccess ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
