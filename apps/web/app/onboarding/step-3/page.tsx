"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
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
      setError("Veuillez renseigner au moins une formation ou école d'ingénieurs.");
      return;
    }

    const first = educations[0];
    if (!first.school?.trim() || !first.degree?.trim()) {
      setError("Veuillez préciser le nom de l'école et le diplôme préparé.");
      return;
    }

    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-4");
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-artisan p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-primary">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-display">
                Cursus Académique & Écoles d'Ingénieurs
              </h3>
              <p className="text-xs text-stone-500">
                Renseignez votre école d'ingénieurs (ou université) et le diplôme que vous validez.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addEducation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter une formation</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {educations.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-stone-200 rounded-2xl text-center space-y-3">
            <School className="w-10 h-10 text-stone-400 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-stone-800">Aucune formation ajoutée</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Cliquez sur le bouton ci-dessous pour ajouter votre cursus actuel.
              </p>
            </div>
            <button
              type="button"
              onClick={addEducation}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm hover:bg-orange-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter ma formation</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {educations.map((edu, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-stone-200 bg-stone-50/60 space-y-4 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 font-mono">
                    #Formation {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEducation(idx)}
                    className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Supprimer cette formation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Établissement / École *
                    </label>
                    <input
                      type="text"
                      required
                      value={edu.school}
                      onChange={(e) => updateEducation(idx, "school", e.target.value)}
                      placeholder="Ex. INSAT, Polytech, ENIT, INSA..."
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-primary text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Diplôme préparé *
                    </label>
                    <input
                      type="text"
                      required
                      value={edu.degree_fr ?? edu.degree}
                      onChange={(e) => {
                        updateEducation(idx, "degree", e.target.value);
                        updateEducation(idx, "degree_fr", e.target.value);
                      }}
                      placeholder="Ex. Diplôme National d'Ingénieur"
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-primary text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Spécialité / Filière
                    </label>
                    <input
                      type="text"
                      value={edu.field_of_study_fr ?? edu.field_of_study ?? ""}
                      onChange={(e) => {
                        updateEducation(idx, "field_of_study", e.target.value);
                        updateEducation(idx, "field_of_study_fr", e.target.value);
                      }}
                      placeholder="Ex. Génie Logiciel, Réseaux & Sécurité, Informatique..."
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-primary text-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Début
                      </label>
                      <input
                        type="text"
                        value={edu.start_date || ""}
                        onChange={(e) => updateEducation(idx, "start_date", e.target.value)}
                        placeholder="Ex. Sept 2022"
                        className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-primary text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Fin prévue
                      </label>
                      <input
                        type="text"
                        value={edu.end_date || ""}
                        onChange={(e) => updateEducation(idx, "end_date", e.target.value)}
                        placeholder="Ex. Juin 2027"
                        className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-primary text-stone-900"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Description du cursus / Modules majeurs
                    </label>
                    <textarea
                      rows={2}
                      value={edu.description_fr ?? edu.description ?? ""}
                      onChange={(e) => {
                        updateEducation(idx, "description", e.target.value);
                        updateEducation(idx, "description_fr", e.target.value);
                      }}
                      placeholder="Ex. Architecture logicielle distribuée, Cloud computing, DevOps, Sécurité des SI..."
                      className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-primary text-stone-900 leading-relaxed"
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
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all shadow-xs"
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
              <span>Étape suivante : Expériences</span>
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
