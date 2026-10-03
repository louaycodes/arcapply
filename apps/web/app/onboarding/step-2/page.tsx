"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  FileText,
} from "lucide-react";

function Step2Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const headline = profile.headline_fr || profile.headline;
    if (!headline?.trim()) {
      setError("Veuillez renseigner un titre professionnel ou une accroche.");
      return;
    }

    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-3");
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-artisan p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-200/60 dark:border-stone-800">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-center text-primary">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
              Objectif de Recherche & Accroche Professionnelle
            </h3>
            <p className="text-xs text-stone-500">
              ArcApply cible exclusivement les stages PFE (Projet de Fin d'Études) d'ingénieur d'une durée de 4 à 6 mois.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Target search mode banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 dark:border-orange-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-950 dark:text-orange-300 uppercase tracking-wide">
                Mode de Recherche Actif : 100% Stage PFE
              </p>
              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                Toutes les offres scrapées seront rigoureusement filtrées pour correspondre à un stage de fin d'études.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-white dark:bg-stone-900 border border-orange-300 dark:border-orange-800/60 text-primary shadow-xs">
            PFE (4 - 6 mois)
          </span>
        </div>

        {/* Headlines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
              <span>[FR] Titre d'accroche (Français) *</span>
            </label>
            <input
              type="text"
              required
              value={profile.headline_fr ?? profile.headline ?? ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  headline: e.target.value,
                  headline_fr: e.target.value,
                })
              }
              placeholder="Ex. Élève-ingénieur Cloud & DevOps | Recherche Stage PFE 2027"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
              <span>[EN] Professional Headline (English)</span>
            </label>
            <input
              type="text"
              value={profile.headline_en ?? ""}
              onChange={(e) => setProfile({ ...profile, headline_en: e.target.value })}
              placeholder="Ex. Software Engineering Student | Seeking Final Year Internship 2027"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* Bios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
              <span>[FR] Bio & Pitch de Présentation (Français)</span>
            </label>
            <textarea
              rows={4}
              value={profile.bio_fr ?? profile.bio ?? ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  bio: e.target.value,
                  bio_fr: e.target.value,
                })
              }
              placeholder="Présentez votre parcours en 3-4 lignes percutantes : votre spécialité, vos domaines de prédilection et vos atouts majeurs..."
              className="w-full p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
              <span>[EN] Professional Summary (English)</span>
            </label>
            <textarea
              rows={4}
              value={profile.bio_en ?? ""}
              onChange={(e) => setProfile({ ...profile, bio_en: e.target.value })}
              placeholder="Summarize your engineering background, favorite tech stack and career aspirations in 3-4 sentences..."
              className="w-full p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400 leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push("/onboarding/step-1")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Étape précédente</span>
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-orange-700 text-white font-semibold text-sm transition-all shadow-md shadow-orange-600/25 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <span>Étape suivante : Formations</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function OnboardingStep2Page() {
  return (
    <OnboardingShell stepNumber={2}>
      <Step2Content />
    </OnboardingShell>
  );
}
