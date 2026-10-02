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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl h-[88vh] rounded-2xl border border-stone-200 bg-white shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between gap-4 bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-primary">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 font-display">
                  Lettre de Motivation — Ton d'Ingénieur Sobre
                </h2>
              </div>
              <p className="text-xs text-stone-600 mt-0.5 line-clamp-1">
                {job.title} &bull; <span className="font-semibold text-stone-900">{job.company}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Quality Banner */}
        <div className="px-5 py-2.5 border-b border-stone-200 bg-stone-50/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {isClean ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                Ton naturel et professionnel (0 formule générique)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {letter?.cliche_score} formulation(s) générique(s) détectée(s)
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              100% Fidèle au profil
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                !isEditing
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 text-stone-700 hover:text-stone-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lecture</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                isEditing
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 text-stone-700 hover:text-stone-900"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Éditer en ligne</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-white">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-stone-500">
                Synthèse de la lettre sobre à partir de vos réalisations...
              </p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-3">
              <p className="text-sm font-semibold text-red-700">{error}</p>
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
              <p className="text-xs text-stone-500">
                Personnalisez vos paragraphes. Le filtre anti-clichés analysera automatiquement vos modifications lors de la sauvegarde.
              </p>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={16}
                className="w-full flex-1 p-4 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-stone-900 font-mono leading-relaxed focus:outline-none focus:border-primary resize-none transition-colors"
                placeholder="Rédigez ou ajustez votre lettre..."
              />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4 text-xs sm:text-sm text-stone-800 leading-relaxed font-sans whitespace-pre-line bg-stone-50/70 p-6 rounded-2xl border border-stone-200 shadow-xs">
              {letter?.content_markdown}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={loadOrGenerateLetter}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors disabled:opacity-50"
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
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-800 transition-all disabled:opacity-50"
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
