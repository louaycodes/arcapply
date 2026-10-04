"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { Education } from "@/lib/api";
import {
  GraduationCap,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  School,
  Calendar,
} from "lucide-react";

function Step3Content() {
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
      setError(t("Veuillez renseigner au moins une formation ou école d'ingénieurs.", "Please add at least one degree or engineering school."));
      return;
    }

    const first = educations[0];
    if (!first.school?.trim() || !first.degree?.trim()) {
      setError(t("Veuillez préciser le nom de l'école et le diplôme préparé.", "Please specify the school name and the degree you are pursuing."));
      return;
    }

    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-4");
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-artisan p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/60 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-center text-primary">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
                {t("Cursus Académique & Écoles d'Ingénieurs", "Academic Background & Engineering Schools")}
              </h3>
              <p className="text-xs text-stone-500">
                {t("Renseignez votre école d'ingénieurs (ou université) et le diplôme que vous validez.", "Enter your engineering school (or university) and the degree you are completing.")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addEducation}
            className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("Ajouter une formation", "Add education")}</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {educations.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl text-center space-y-3">
            <School className="w-10 h-10 text-stone-400 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{t("Aucune formation ajoutée", "No education added")}</p>
              <p className="text-xs text-stone-500 mt-0.5">
                {t("Cliquez sur le bouton ci-dessous pour ajouter votre cursus actuel.", "Click the button below to add your current program.")}
              </p>
            </div>
            <button
              type="button"
              onClick={addEducation}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm hover:bg-orange-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t("Ajouter ma formation", "Add my education")}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {educations.map((edu, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/60 space-y-4 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 font-mono">
                    {t(`#Formation ${idx + 1}`, `#Education ${idx + 1}`)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEducation(idx)}
                    className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title={t("Supprimer cette formation", "Delete this education")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      {t("Établissement / École *", "Institution / School *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={edu.school}
                      onChange={(e) => updateEducation(idx, "school", e.target.value)}
                      placeholder={t("Ex. INSAT, Polytech, ENIT, INSA...", "e.g. INSAT, Polytech, ENIT, INSA...")}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
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
                      placeholder={t("Ex. Diplôme National d'Ingénieur", "e.g. National Engineering Degree")}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      {t("Spécialité / Filière", "Major / Track")}
                    </label>
                    <input
                      type="text"
                      value={edu.field_of_study_fr ?? edu.field_of_study ?? ""}
                      onChange={(e) => {
                        updateEducation(idx, "field_of_study", e.target.value);
                        updateEducation(idx, "field_of_study_fr", e.target.value);
                      }}
                      placeholder={t("Ex. Génie Logiciel, Réseaux & Sécurité, Informatique...", "e.g. Software Engineering, Networks & Security, Computer Science...")}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        {t("Début", "Start")}
                      </label>
                      <input
                        type="text"
                        value={edu.start_date || ""}
                        onChange={(e) => updateEducation(idx, "start_date", e.target.value)}
                        placeholder={t("Ex. Sept 2022", "e.g. Sept 2022")}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        {t("Fin prévue", "Expected end")}
                      </label>
                      <input
                        type="text"
                        value={edu.end_date || ""}
                        onChange={(e) => updateEducation(idx, "end_date", e.target.value)}
                        placeholder={t("Ex. Juin 2027", "e.g. June 2027")}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      {t("Description du cursus / Modules majeurs", "Program description / Key courses")}
                    </label>
                    <textarea
                      rows={2}
                      value={edu.description_fr ?? edu.description ?? ""}
                      onChange={(e) => {
                        updateEducation(idx, "description", e.target.value);
                        updateEducation(idx, "description_fr", e.target.value);
                      }}
                      placeholder={t("Ex. Architecture logicielle distribuée, Cloud computing, DevOps, Sécurité des SI...", "e.g. Distributed software architecture, Cloud computing, DevOps, Information security...")}
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
          onClick={() => router.push("/onboarding/step-2")}
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
              <span>{t("Étape suivante : Expériences", "Next step: Experience")}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function OnboardingStep3Page() {
  return (
    <OnboardingShell stepNumber={3}>
      <Step3Content />
    </OnboardingShell>
  );
}
