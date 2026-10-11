"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { Education } from "@/lib/api";
import { ArrowRight, ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

function Step7Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t } = useAppLanguage();
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const educations = profile.educations || [];

  const addEducation = () => {
    const newEdu: Education = {
      school: "",
      degree: "",
      degree_fr: "",
      degree_en: "",
      field_of_study: "",
      field_of_study_fr: "",
      field_of_study_en: "",
      start_date: "",
      end_date: "",
      description: "",
      description_fr: "",
      description_en: "",
    };
    setProfile({
      ...profile,
      educations: [...educations, newEdu],
    });
  };

  const removeEducation = (index: number) => {
    setProfile({
      ...profile,
      educations: educations.filter((_, i) => i !== index),
    });
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const updated = educations.map((edu, i) => {
      if (i === index) {
        return { ...edu, [field]: value };
      }
      return edu;
    });
    setProfile({ ...profile, educations: updated });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (educations.length === 0) {
      setError(t("Veuillez renseigner au moins une formation.", "Please add at least one education program."));
      return;
    }

    const first = educations[0];
    if (!first.school?.trim() || !first.degree?.trim()) {
      setError(t("Veuillez préciser le nom de l'école et le diplôme préparé.", "Please specify the school name and the degree."));
      return;
    }

    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-8");
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-700">
            {t(`Formations enregistrées (${educations.length})`, `Recorded degrees (${educations.length})`)}
          </span>
          <button
            type="button"
            onClick={addEducation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DACD] text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("Ajouter une formation", "Add education")}</span>
          </button>
        </div>

        {educations.length === 0 ? (
          <div className="py-8 border border-dashed border-[#DDD2C3] rounded-xl text-center space-y-2 bg-[#F6EFE6]/50">
            <p className="text-xs text-stone-600">
              {t("Aucune formation ajoutée pour le moment.", "No education added yet.")}
            </p>
            <button
              type="button"
              onClick={addEducation}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Ajouter ma formation", "Add my education")}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {educations.map((edu, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-[#DDD2C3] bg-[#F6EFE6] space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">
                    {t(`Formation ${idx + 1}`, `Education ${idx + 1}`)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEducation(idx)}
                    className="p-1 rounded text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                    title={t("Supprimer", "Delete")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {t("Établissement / École *", "School / University *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={edu.school}
                      onChange={(e) => updateEducation(idx, "school", e.target.value)}
                      placeholder={t("Ex. Polytech, INSAT, Télécom Paris...", "e.g. Polytech, INSAT, Telecom Paris...")}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {t("Diplôme préparé *", "Degree pursued *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={edu.degree_fr ?? edu.degree}
                      onChange={(e) => {
                        updateEducation(idx, "degree", e.target.value);
                        updateEducation(idx, "degree_fr", e.target.value);
                      }}
                      placeholder={t("Ex. Diplôme d'Ingénieur", "e.g. Master of Engineering")}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {t("Spécialité / Filière", "Major / Track")}
                    </label>
                    <input
                      type="text"
                      value={edu.field_of_study_fr ?? edu.field_of_study ?? ""}
                      onChange={(e) => {
                        updateEducation(idx, "field_of_study", e.target.value);
                        updateEducation(idx, "field_of_study_fr", e.target.value);
                      }}
                      placeholder={t("Ex. Génie Logiciel & Cloud", "e.g. Software & Cloud Engineering")}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        {t("Date de début", "Start date")}
                      </label>
                      <input
                        type="text"
                        value={edu.start_date || ""}
                        onChange={(e) => updateEducation(idx, "start_date", e.target.value)}
                        placeholder={t("Ex. Sept 2022", "e.g. Sept 2022")}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        {t("Date de fin prévue", "Expected graduation")}
                      </label>
                      <input
                        type="text"
                        value={edu.end_date || ""}
                        onChange={(e) => updateEducation(idx, "end_date", e.target.value)}
                        placeholder={t("Ex. Juin 2027", "e.g. June 2027")}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                      />
                    </div>
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
          onClick={() => router.push("/onboarding/step-6")}
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

export default function OnboardingStep7Page() {
  return (
    <OnboardingShell stepNumber={7}>
      <Step7Content />
    </OnboardingShell>
  );
}
