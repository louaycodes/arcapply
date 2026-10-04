"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { Project } from "@/lib/api";
import {
  FolderGit2,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Code,
  ExternalLink,
} from "lucide-react";

function Step5Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t } = useAppLanguage();
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const projects = profile.projects || [];

  const addProject = () => {
    const newProj: Project = {
      title: "",
      title_fr: "",
      title_en: "",
      role: "",
      role_fr: "",
      role_en: "",
      description: "",
      description_fr: "",
      description_en: "",
      url: "",
      technologies: [],
    };
    setProfile({
      ...profile,
      projects: [...projects, newProj],
    });
  };

  const removeProject = (index: number) => {
    setProfile({
      ...profile,
      projects: projects.filter((_, i) => i !== index),
    });
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = projects.map((proj, i) => {
      if (i === index) {
        return { ...proj, [field]: value };
      }
      return proj;
    });
    setProfile({ ...profile, projects: updated });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-6");
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-artisan p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/60 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-center text-primary">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
                {t("Projets Académiques & Personnels Marquants", "Notable Academic & Personal Projects")}
              </h3>
              <p className="text-xs text-stone-500">
                {t("Les projets concrets sont le meilleur moyen de prouver vos compétences pour un stage PFE.", "Concrete projects are the best way to prove your skills for a PFE internship.")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addProject}
            className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("Ajouter un projet", "Add a project")}</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl text-center space-y-3">
            <Code className="w-10 h-10 text-stone-400 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{t("Aucun projet ajouté", "No project added")}</p>
              <p className="text-xs text-stone-500 mt-0.5">
                {t("Ajoutez vos projets d'école, hackathons ou dépôts GitHub pour enrichir votre profil.", "Add your school projects, hackathons or GitHub repositories to enrich your profile.")}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={addProject}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm hover:bg-orange-700 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t("Ajouter un projet", "Add a project")}</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/onboarding/step-6")}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
              >
                {t("Passer cette étape", "Skip this step")}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/60 space-y-4 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 font-mono">
                    {t(`#Projet ${idx + 1}`, `#Project ${idx + 1}`)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProject(idx)}
                    className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title={t("Supprimer ce projet", "Delete this project")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      {t("Titre du projet *", "Project title *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={proj.title_fr ?? proj.title}
                      onChange={(e) => {
                        updateProject(idx, "title", e.target.value);
                        updateProject(idx, "title_fr", e.target.value);
                      }}
                      placeholder={t("Ex. ArcApply Copilot, Agent FinOps, Dashboard IoT...", "e.g. ArcApply Copilot, FinOps Agent, IoT Dashboard...")}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      {t("Votre rôle dans le projet", "Your role in the project")}
                    </label>
                    <input
                      type="text"
                      value={proj.role_fr ?? proj.role ?? ""}
                      onChange={(e) => {
                        updateProject(idx, "role", e.target.value);
                        updateProject(idx, "role_fr", e.target.value);
                      }}
                      placeholder={t("Ex. Développeur Lead, Architecte Backend, Concepteur...", "e.g. Lead Developer, Backend Architect, Designer...")}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      {t("Lien du dépôt GitHub / Démo en ligne", "GitHub repository / Live demo link")}
                    </label>
                    <input
                      type="url"
                      value={proj.url || ""}
                      onChange={(e) => updateProject(idx, "url", e.target.value)}
                      placeholder={t("https://github.com/mon-compte/mon-projet", "https://github.com/my-account/my-project")}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      {t("Technologies & Outils utilisés (séparés par des virgules)", "Technologies & Tools used (comma-separated)")}
                    </label>
                    <input
                      type="text"
                      value={(proj.technologies || []).join(", ")}
                      onChange={(e) =>
                        updateProject(
                          idx,
                          "technologies",
                          e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder={t("Ex. Python, Docker, Next.js, FastAPI...", "e.g. Python, Docker, Next.js, FastAPI...")}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      {t("Description technique & résultats obtenus", "Technical description & results")}
                    </label>
                    <textarea
                      rows={2}
                      value={proj.description_fr ?? proj.description ?? ""}
                      onChange={(e) => {
                        updateProject(idx, "description", e.target.value);
                        updateProject(idx, "description_fr", e.target.value);
                      }}
                      placeholder={t("Ex. Conception d'une architecture modulaire, intégration de modèles LLM avec Instructor et déploiement d'un conteneur sécurisé...", "e.g. Designed a modular architecture, integrated LLM models with Instructor and deployed a secure container...")}
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
          onClick={() => router.push("/onboarding/step-4")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("Étape précédente", "Previous step")}</span>
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-orange-700 text-white font-semibold text-sm transition-all shadow-md shadow-orange-600/25 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("Enregistrement...", "Saving...")}</span>
            </>
          ) : (
            <>
              <span>{t("Étape suivante : Compétences & Langues", "Next step: Skills & Languages")}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function OnboardingStep5Page() {
  return (
    <OnboardingShell stepNumber={5}>
      <Step5Content />
    </OnboardingShell>
  );
}
