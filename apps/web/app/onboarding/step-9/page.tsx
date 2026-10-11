"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { Project } from "@/lib/api";
import { ArrowRight, ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

function Step9Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t } = useAppLanguage();

  if (!profile) return null;

  const projects = profile.projects || [];

  const addProject = () => {
    setProfile((prev) => {
      if (!prev) return prev;
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
      return {
        ...prev,
        projects: [...(prev.projects || []), newProj],
      };
    });
  };

  const removeProject = (index: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        projects: (prev.projects || []).filter((_, i) => i !== index),
      };
    });
  };

  const updateProject = (index: number, patch: Partial<Project>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const current = prev.projects || [];
      const updated = current.map((proj, i) => (i === index ? { ...proj, ...patch } : proj));
      return { ...prev, projects: updated };
    });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const current = profile.projects || [];
    const valid = current
      .map((proj) => ({
        ...proj,
        title: (proj.title || proj.title_fr || "").trim(),
        title_fr: (proj.title_fr || proj.title || "").trim(),
        role: (proj.role || proj.role_fr || "").trim(),
        role_fr: (proj.role_fr || proj.role || "").trim(),
        description: (proj.description || proj.description_fr || "").trim(),
        description_fr: (proj.description_fr || proj.description || "").trim(),
      }))
      .filter((proj) => proj.title.length > 0);

    const success = await saveCurrentStep({ projects: valid });
    if (success) {
      router.push("/onboarding/step-10");
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-700">
            {t(`Projets enregistrés (${projects.length})`, `Recorded projects (${projects.length})`)}
          </span>
          <button
            type="button"
            onClick={addProject}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DACD] text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("Ajouter un projet", "Add project")}</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="py-8 border border-dashed border-[#DDD2C3] rounded-xl text-center space-y-3 bg-[#F6EFE6]/50">
            <p className="text-xs text-stone-600">
              {t("Aucun projet ajouté pour le moment. Vous pouvez en ajouter un ou passer.", "No project added yet. You can add one or skip.")}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={addProject}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("Ajouter un projet", "Add project")}</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/onboarding/step-10")}
                className="px-3.5 py-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DACD] text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t("Passer", "Skip")}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-[#DDD2C3] bg-[#F6EFE6] space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">
                    {t(`Projet ${idx + 1}`, `Project ${idx + 1}`)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProject(idx)}
                    className="p-1 rounded text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                    title={t("Supprimer", "Delete")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {t("Titre du projet *", "Project title *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={proj.title_fr || proj.title || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateProject(idx, { title: val, title_fr: val });
                      }}
                      placeholder={t("Ex. Plateforme de prédiction, API temps réel...", "e.g. Prediction platform, Real-time API...")}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {t("Votre rôle", "Your role")}
                    </label>
                    <input
                      type="text"
                      value={proj.role_fr || proj.role || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateProject(idx, { role: val, role_fr: val });
                      }}
                      placeholder={t("Ex. Développeur Full Stack, Concepteur", "e.g. Full Stack Developer, Designer")}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {t("Lien GitHub / Démo", "GitHub / Demo link")}
                    </label>
                    <input
                      type="url"
                      value={proj.url || ""}
                      onChange={(e) => updateProject(idx, { url: e.target.value })}
                      placeholder="https://github.com/..."
                      className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {t("Technologies utilisées (séparées par des virgules)", "Technologies used (comma-separated)")}
                    </label>
                    <input
                      type="text"
                      value={(proj.technologies || []).join(", ")}
                      onChange={(e) =>
                        updateProject(idx, {
                          technologies: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder={t("Ex. Next.js, FastAPI, PostgreSQL", "e.g. Next.js, FastAPI, PostgreSQL")}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {t("Description & Réalisations", "Description & Achievements")}
                    </label>
                    <textarea
                      rows={2}
                      value={proj.description_fr || proj.description || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateProject(idx, { description: val, description_fr: val });
                      }}
                      placeholder={t("Ex. Conception de l'architecture et déploiement du conteneur...", "e.g. Designed architecture and deployed container...")}
                      className="w-full p-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900 leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#EADFCE]">
        <button
          type="button"
          onClick={() => router.push("/onboarding/step-8")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DACD] text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("Précédent", "Back")}</span>
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("Enregistrement...", "Saving...")}</span>
            </>
          ) : (
            <>
              <span>{t("Continuer", "Continue")}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function OnboardingStep9Page() {
  return (
    <OnboardingShell stepNumber={9}>
      <Step9Content />
    </OnboardingShell>
  );
}
