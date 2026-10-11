"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { Experience } from "@/lib/api";
import { ArrowRight, ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

function Step8Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t } = useAppLanguage();

  if (!profile) return null;

  const experiences = profile.experiences || [];

  const addExperience = () => {
    setProfile((prev) => {
      if (!prev) return prev;
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
        experience_type: "stage",
      };
      return {
        ...prev,
        experiences: [...(prev.experiences || []), newExp],
      };
    });
  };

  const removeExperience = (index: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        experiences: (prev.experiences || []).filter((_, i) => i !== index),
      };
    });
  };

  const updateExperience = (index: number, patch: Partial<Experience>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const current = prev.experiences || [];
      const updated = current.map((exp, i) => (i === index ? { ...exp, ...patch } : exp));
      return { ...prev, experiences: updated };
    });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const current = profile.experiences || [];
    const valid = current
      .map((exp) => ({
        ...exp,
        company: (exp.company || "").trim(),
        role: (exp.role || exp.role_fr || "").trim(),
        role_fr: (exp.role_fr || exp.role || "").trim(),
        description: (exp.description || exp.description_fr || "").trim(),
        description_fr: (exp.description_fr || exp.description || "").trim(),
      }))
      .filter((exp) => exp.company.length > 0 || exp.role.length > 0);

    const success = await saveCurrentStep({ experiences: valid });
    if (success) {
      router.push("/onboarding/step-9");
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-700">
            {t(`Expériences enregistrées (${experiences.length})`, `Recorded experiences (${experiences.length})`)}
          </span>
          <button
            type="button"
            onClick={addExperience}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DACD] text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("Ajouter une expérience", "Add experience")}</span>
          </button>
        </div>

        {experiences.length === 0 ? (
          <div className="py-8 border border-dashed border-[#DDD2C3] rounded-xl text-center space-y-3 bg-[#F6EFE6]/50">
            <p className="text-xs text-stone-600">
              {t("Aucune expérience ajoutée pour le moment. Vous pouvez passer si vous n'avez pas encore de stage.", "No experience added yet. You can skip if you have not done an internship yet.")}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={addExperience}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("Ajouter un stage", "Add internship")}</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/onboarding/step-9")}
                className="px-3.5 py-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DACD] text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t("Passer", "Skip")}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map((exp, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-[#DDD2C3] bg-[#F6EFE6] space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">
                    {t(`Expérience ${idx + 1}`, `Experience ${idx + 1}`)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExperience(idx)}
                    className="p-1 rounded text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                    title={t("Supprimer", "Delete")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {t("Entreprise *", "Company *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={exp.company || ""}
                      onChange={(e) => updateExperience(idx, { company: e.target.value })}
                      placeholder={t("Ex. Entreprise ou organisation", "e.g. Company or organization")}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {t("Poste / Rôle *", "Role / Job title *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={exp.role_fr || exp.role || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateExperience(idx, { role: val, role_fr: val });
                      }}
                      placeholder={t("Ex. Stagiaire Ingénieur Backend", "e.g. Backend Engineering Intern")}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        {t("Date début", "Start date")}
                      </label>
                      <input
                        type="text"
                        value={exp.start_date || ""}
                        onChange={(e) => updateExperience(idx, { start_date: e.target.value })}
                        placeholder={t("Ex. Juin 2024", "e.g. June 2024")}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        {t("Date fin", "End date")}
                      </label>
                      <input
                        type="text"
                        value={exp.end_date || ""}
                        onChange={(e) => updateExperience(idx, { end_date: e.target.value })}
                        placeholder={t("Ex. Août 2024", "e.g. August 2024")}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {t("Technologies clés (séparées par des virgules)", "Key technologies (comma-separated)")}
                    </label>
                    <input
                      type="text"
                      value={(exp.technologies || []).join(", ")}
                      onChange={(e) =>
                        updateExperience(idx, {
                          technologies: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder={t("Ex. Python, Docker, PostgreSQL", "e.g. Python, Docker, PostgreSQL")}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {t("Description des missions", "Responsibilities description")}
                    </label>
                    <textarea
                      rows={2}
                      value={exp.description_fr || exp.description || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateExperience(idx, { description: val, description_fr: val });
                      }}
                      placeholder={t("Ex. Développement de microservices et intégration continue...", "e.g. Built microservices and continuous integration...")}
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
          onClick={() => router.push("/onboarding/step-7")}
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

export default function OnboardingStep8Page() {
  return (
    <OnboardingShell stepNumber={8}>
      <Step8Content />
    </OnboardingShell>
  );
}
