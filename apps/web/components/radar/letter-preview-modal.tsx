"use client";

import { useEffect, useState } from "react";
import { JobOffer, CoverLetter, generateCoverLetter, updateCoverLetter } from "@/lib/api";
import {
  X,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Edit3,
  Eye,
  Save,
  ShieldCheck,
} from "lucide-react";
import { LetterDownloadMenu } from "./letter-download-menu";

interface LetterPreviewModalProps {
  job: JobOffer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LetterPreviewModal({
  job,
  isOpen,
  onClose,
}: LetterPreviewModalProps) {
  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (job && isOpen) {
      loadOrGenerateLetter();
    }
  }, [job, isOpen]);

  const loadOrGenerateLetter = async () => {
    if (!job) return;
    try {
      setLoading(true);
      setError(null);
      const res = await generateCoverLetter(job.id);
      setLetter(res);
      setEditText(res.content_markdown);
    } catch (err: any) {
      setError(err.message || "Erreur de génération de la lettre");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = isEditing ? editText : letter?.content_markdown;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur de copie presse-papier", err);
    }
  };

  const handleSave = async () => {
    if (!job || !letter) return;
    try {
      setIsSaving(true);
      const updated = await updateCoverLetter(job.id, editText);
      setLetter(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !job) return null;

  const isClean = (letter?.cliche_score ?? 0) === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 !mt-0 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl h-[88vh] rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4 bg-stone-50/70 dark:bg-stone-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-primary">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 font-display">
                  Lettre de Motivation — Ton d'Ingénieur Sobre
                </h2>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-1">
                {job.title} &bull; <span className="font-semibold text-stone-900 dark:text-stone-200">{job.company}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Quality Banner */}
        <div className="px-5 py-2.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {isClean ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                Ton naturel et professionnel (0 formule générique)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                {letter?.cliche_score} formulation(s) générique(s) détectée(s)
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              100% Fidèle au profil
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                !isEditing
                  ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lecture</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                isEditing
                  ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Éditer en ligne</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-stone-900">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-stone-500 dark:text-stone-400">
                Synthèse de la lettre sobre à partir de vos réalisations...
              </p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-3">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>
              <button
                type="button"
                onClick={loadOrGenerateLetter}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : isEditing ? (
            <div className="space-y-3 h-full flex flex-col">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Personnalisez vos paragraphes. Le filtre anti-clichés analysera automatiquement vos modifications lors de la sauvegarde.
              </p>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={16}
                className="w-full flex-1 p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/80 text-xs text-stone-900 dark:text-stone-100 font-mono leading-relaxed focus:outline-none focus:border-primary resize-none transition-colors"
                placeholder="Rédigez ou ajustez votre lettre..."
              />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4 text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-sans whitespace-pre-line bg-stone-50/70 dark:bg-stone-800/50 p-6 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs">
              {letter?.content_markdown}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={loadOrGenerateLetter}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Régénérer</span>
          </button>

          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-800 dark:hover:bg-stone-200 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Sauvegarde..." : "Sauvegarder"}</span>
              </button>
            )}

            <LetterDownloadMenu
              jobId={job.id}
              jobTitle={job.title}
              companyName={job.company}
              content={isEditing ? editText : letter?.content_markdown}
              variant="outline"
            />

            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 tactile-button shadow-artisan-button transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copié !" : "Copier"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
