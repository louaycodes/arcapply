"use client";

import { useEffect, useState } from "react";
import {
  JobOffer,
  CoverLetter,
  generateCoverLetter,
  fetchCoverLetter,
  updateCoverLetter,
} from "@/lib/api";
import {
  Mail,
  Copy,
  Check,
  Edit3,
  Eye,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Save,
} from "lucide-react";

interface LetterPreviewModalProps {
  job: JobOffer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LetterPreviewModal({ job, isOpen, onClose }: LetterPreviewModalProps) {
  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [editText, setEditText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrGenerateLetter = async () => {
    if (!job) return;
    try {
      setLoading(true);
      setError(null);
      const data = await generateCoverLetter(job.id);
      setLetter(data);
      setEditText(data.content_markdown);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la génération de la lettre de motivation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && job) {
      loadOrGenerateLetter();
    } else {
      setLetter(null);
      setEditText("");
      setError(null);
      setIsEditing(false);
    }
  }, [isOpen, job?.id]);

  const handleCopy = async () => {
    const textToCopy = isEditing ? editText : letter?.content_markdown;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Échec de la copie dans le presse-papier :", err);
    }
  };

  const handleSave = async () => {
    if (!job) return;
    try {
      setIsSaving(true);
      setError(null);
      const updated = await updateCoverLetter(job.id, editText);
      setLetter(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Impossible de sauvegarder la lettre.");
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl h-[88vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between gap-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Lettre de Motivation — Ton d'Ingénieur Sobre
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {job.title} &bull; <span className="font-semibold text-foreground">{job.company}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Quality Banner */}
        <div className="px-5 py-2.5 border-b border-border/60 bg-muted/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {isClean ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Anti-Clichés validé (0 formule stéréotypée)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {letter?.cliche_score} cliché(s) d'IA détecté(s)
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
              <ShieldCheck className="w-3 h-3 text-primary" />
              Zéro-Hallucination
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors ${
                !isEditing
                  ? "bg-secondary text-secondary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lecture</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors ${
                isEditing
                  ? "bg-secondary text-secondary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Éditer en ligne</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-card">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-muted-foreground">
                Synthèse de la lettre sobre à partir de vos réalisations...
              </p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-3">
              <p className="text-sm font-semibold text-destructive">{error}</p>
              <button
                type="button"
                onClick={loadOrGenerateLetter}
                className="px-4 py-2 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : isEditing ? (
            <div className="space-y-3 h-full flex flex-col">
              <p className="text-xs text-muted-foreground">
                Personnalisez vos paragraphes. Le filtre anti-clichés analysera automatiquement vos modifications lors de la sauvegarde.
              </p>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={16}
                className="w-full flex-1 p-4 rounded-xl border border-border bg-muted/30 text-xs text-foreground font-mono leading-relaxed focus:outline-none focus:border-primary resize-none transition-colors"
                placeholder="Rédigez ou ajustez votre lettre..."
              />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4 text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans whitespace-pre-line bg-muted/15 p-6 rounded-xl border border-border/40 shadow-sm">
              {letter?.content_markdown}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={loadOrGenerateLetter}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
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
                className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-secondary/80 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Sauvegarde..." : "Sauvegarder"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copié !" : "Copier le texte"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
