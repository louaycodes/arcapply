"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { Skill, SKILL_CATEGORIES, skillCategoryLabel } from "@/lib/api";
import { ArrowRight, ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

function Step10Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t, language } = useAppLanguage();
  const [error, setError] = useState<string | null>(null);

  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState<string>(SKILL_CATEGORIES[0]);

  if (!profile) return null;

  const skills = profile.skills || [];

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
      setNewSkillName("");
      return;
    }

    const newS: Skill = {
      name: newSkillName.trim(),
      category: newSkillCategory,
      level: "Avancé",
    };
    setProfile({
      ...profile,
      skills: [...skills, newS],
    });
    setNewSkillName("");
  };

  const removeSkill = (index: number) => {
    setProfile({
      ...profile,
      skills: skills.filter((_, i) => i !== index),
    });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (skills.length === 0) {
      setError(t("Veuillez renseigner au moins une compétence.", "Please add at least one skill."));
      return;
    }

    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-11");
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
        {/* Add custom skill input */}
        <div className="p-4 rounded-xl border border-[#DDD2C3] bg-[#F6EFE6] space-y-3">
          <label className="block text-xs font-semibold text-stone-800">
            {t("Ajouter une compétence :", "Add a skill:")}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder={t("Ex. Python, Docker, React...", "e.g. Python, Docker, React...")}
              className="flex-1 px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
            />
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
            >
              {SKILL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {skillCategoryLabel(cat, language)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addSkill}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Ajouter", "Add")}</span>
            </button>
          </div>
        </div>

        {/* Added skills list */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-stone-700 block">
            {t(`Compétences ajoutées (${skills.length})`, `Added skills (${skills.length})`)}
          </span>

          {skills.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-2">
              {t("Aucune compétence ajoutée pour l'instant.", "No skills added yet.")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F6EFE6] border border-[#DDD2C3] text-xs"
                >
                  <span className="font-semibold text-stone-800">{s.name}</span>
                  <span className="text-[10px] text-stone-500 font-normal">
                    ({skillCategoryLabel(s.category, language)})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSkill(idx)}
                    className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                    title={t("Supprimer", "Delete")}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#EADFCE]">
        <button
          type="button"
          onClick={() => router.push("/onboarding/step-9")}
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

export default function OnboardingStep10Page() {
  return (
    <OnboardingShell stepNumber={10}>
      <Step10Content />
    </OnboardingShell>
  );
}
