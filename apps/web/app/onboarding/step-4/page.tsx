"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { Experience } from "@/lib/api";
import {
  Briefcase,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";

function Step4Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const experiences = profile.experiences || [];

  const addExperience = (type: "stage" | "job" = "stage") => {
    const newExp: Experience = {
      company: "",
      role: "",
      role_fr: "",
      role_en: "",
      location: "",
      start_date: "",
      end_date: "",
      description: "",
      description_fr: "",
      description_en: "",
      technologies: [],
      experience_type: type,
    };
    setProfile({
      ...profile,
      experiences: [...experiences, newExp],
    });
  };

  const removeExperience = (index: number) => {
    setProfile({
      ...profile,
      experiences: experiences.filter((_, i) => i !== index),
    });
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = experiences.map((exp, i) => {
      if (i === index) {
        return { ...exp, [field]: value };
      }
      return exp;
    });
    setProfile({ ...profile, experiences: updated });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Save current step
    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-5");
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-artisan p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200/60 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-center text-primary">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
                Stages & Expériences Professionnelles
              </h3>
              <p className="text-xs text-stone-500">
                Mentionnez vos stages d'été, stages ingénieur ou missions freelance passées.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => addExperience("stage")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter un stage / job</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {experiences.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl text-center space-y-3">
            <Building2 className="w-10 h-10 text-stone-400 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">Aucune expérience enregistrée</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Si vous n'avez pas encore effectué de stage, vous pouvez passer directement à l'étape des projets.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => addExperience("stage")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm hover:bg-orange-700 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un stage</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/onboarding/step-5")}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
              >
                Passer cette étape
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {experiences.map((exp, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/60 space-y-4 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300 font-mono">
                      #Expérience {idx + 1}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                      {(exp.experience_type || "stage") === "stage" ? "Stage" : "Emploi"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExperience(idx)}
                    className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Supprimer cette expérience"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Entreprise / Organisation *
                    </label>
                    <input
                      type="text"
                      required
                      value={exp.company}
                      onChange={(e) => updateExperience(idx, "company", e.target.value)}
                      placeholder="Ex. Thales, Airbus, Sofrecom, Start-up..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Rôle / Intitulé du poste *
                    </label>
                    <input
                      type="text"
                      required
                      value={exp.role_fr ?? exp.role}
                      onChange={(e) => {
                        updateExperience(idx, "role", e.target.value);
                        updateExperience(idx, "role_fr", e.target.value);
                      }}
                      placeholder="Ex. Stagiaire Ingénieur DevOps / Backend"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Localisation (Ville, Pays)
                    </label>
                    <input
                      type="text"
                      value={exp.location || ""}
                      onChange={(e) => updateExperience(idx, "location", e.target.value)}
                      placeholder="Ex. Paris, France / Tunis, Tunisie"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Début
                      </label>
                      <input
                        type="text"
                        value={exp.start_date || ""}
                        onChange={(e) => updateExperience(idx, "start_date", e.target.value)}
                        placeholder="Ex. Juin 2024"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Fin
                      </label>
                      <input
                        type="text"
                        value={exp.end_date || ""}
                        onChange={(e) => updateExperience(idx, "end_date", e.target.value)}
                        placeholder="Ex. Août 2024"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Technologies & Stack (séparées par des virgules)
                    </label>
                    <input
                      type="text"
                      value={(exp.technologies || []).join(", ")}
                      onChange={(e) =>
                        updateExperience(
                          idx,
                          "technologies",
                          e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="Ex. FastAPI, Docker, PostgreSQL, AWS..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Missions & Réalisations concrètes
                    </label>
                    <textarea
                      rows={2}
                      value={exp.description_fr ?? exp.description ?? ""}
                      onChange={(e) => {
                        updateExperience(idx, "description", e.target.value);
                        updateExperience(idx, "description_fr", e.target.value);
                      }}
                      placeholder="Ex. Conception d'une API REST haute performance avec FastAPI, automatisation de tests unitaires et intégration dans GitLab CI..."
                      className="w-full p-2.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100 leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push("/onboarding/step-3")}
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
              <span>Étape suivante : Projets</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function OnboardingStep4Page() {
  return (
    <OnboardingShell stepNumber={4}>
      <Step4Content />
    </OnboardingShell>
  );
}
