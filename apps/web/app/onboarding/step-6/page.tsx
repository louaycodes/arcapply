"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { Skill, Language, SKILL_CATEGORIES, skillCategoryLabel } from "@/lib/api";
import {
  Code2,
  Globe2,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Tag,
  Check,
} from "lucide-react";

const SUGGESTED_SKILLS = [
  { name: "Python", category: "Langages & Scripting" },
  { name: "FastAPI", category: "Frameworks" },
  { name: "TypeScript", category: "Langages & Scripting" },
  { name: "React / Next.js", category: "Frameworks" },
  { name: "Docker", category: "Conteneurisation & Orchestration" },
  { name: "Kubernetes", category: "Conteneurisation & Orchestration" },
  { name: "PostgreSQL", category: "Bases de données" },
  { name: "Git", category: "Versioning & Méthodes" },
  { name: "Linux", category: "Systèmes & Réseaux" },
  { name: "AWS", category: "Cloud & Infrastructure" },
];

function Step6Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t, language } = useAppLanguage();
  const [error, setError] = useState<string | null>(null);

  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState<string>(SKILL_CATEGORIES[0]);
  const [newSkillLevel, setNewSkillLevel] = useState("Avancé");

  if (!profile) return null;

  const skills = profile.skills || [];
  const languages = profile.languages || [];

  const addSkill = (name: string, category: string, level = "Avancé") => {
    if (!name.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === name.trim().toLowerCase())) return;

    const newS: Skill = {
      name: name.trim(),
      category: category,
      level: level,
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

  const addLanguage = () => {
    const newL: Language = {
      name: "",
      level: "Courant (C1)",
    };
    setProfile({
      ...profile,
      languages: [...languages, newL],
    });
  };

  const removeLanguage = (index: number) => {
    setProfile({
      ...profile,
      languages: languages.filter((_, i) => i !== index),
    });
  };

  const updateLanguage = (index: number, field: keyof Language, value: string) => {
    const updated = languages.map((lang, i) => {
      if (i === index) return { ...lang, [field]: value };
      return lang;
    });
    setProfile({ ...profile, languages: updated });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (skills.length === 0) {
      setError(t("Veuillez renseigner au moins 2 ou 3 compétences clés pour permettre le matching ATS.", "Please add at least 2 or 3 key skills to enable ATS matching."));
      return;
    }

    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-7");
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-artisan p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-200/60 dark:border-stone-800">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-center text-primary">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
              {t("Compétences Techniques & Langues Étrangères", "Technical Skills & Foreign Languages")}
            </h3>
            <p className="text-xs text-stone-500">
              {t("Le moteur de matching ATS compare ces compétences directement avec les mots-clés des offres.", "The ATS matching engine compares these skills directly with the offers' keywords.")}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick add suggestions */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
            {t("Compétences populaires recommandées pour élèves-ingénieurs :", "Popular skills recommended for engineering students:")}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_SKILLS.map((sug) => {
              const alreadyHas = skills.some(
                (s) => s.name.toLowerCase() === sug.name.toLowerCase()
              );
              return (
                <button
                  type="button"
                  key={sug.name}
                  disabled={alreadyHas}
                  onClick={() => addSkill(sug.name, sug.category)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    alreadyHas
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 opacity-60 cursor-default"
                      : "bg-stone-100 dark:bg-stone-800 hover:bg-orange-50 hover:text-primary text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 cursor-pointer"
                  }`}
                >
                  {alreadyHas && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                  <span>{sug.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add custom skill input */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-800 space-y-3">
          <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
            {t("Ajouter une compétence personnalisée :", "Add a custom skill:")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(newSkillName, newSkillCategory, newSkillLevel);
                  }
                }}
                placeholder={t("Ex. PyTorch, Ansible, Go, Terraform...", "e.g. PyTorch, Ansible, Go, Terraform...")}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-primary text-stone-800 dark:text-stone-200"
              >
                {SKILL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {skillCategoryLabel(c, language)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                type="button"
                onClick={() => addSkill(newSkillName, newSkillCategory, newSkillLevel)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary hover:bg-orange-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("Ajouter", "Add")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active skills list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
              {t(`Compétences enregistrées (${skills.length})`, `Saved skills (${skills.length})`)}
            </h4>
          </div>

          {skills.length === 0 ? (
            <p className="text-xs text-stone-500 italic">
              {t("Aucune compétence ajoutée pour le moment.", "No skills added yet.")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {skills.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xs group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{s.name}</p>
                    <p className="text-[10px] text-stone-500 truncate">{skillCategoryLabel(s.category, language)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSkill(idx)}
                    className="p-1 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title={t("Supprimer", "Delete")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Languages Section */}
        <div className="pt-6 border-t border-stone-200/60 dark:border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                {t("Langues maîtrisées", "Languages spoken")}
              </h4>
            </div>
            <button
              type="button"
              onClick={addLanguage}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Ajouter une langue", "Add a language")}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {languages.map((lang, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/60 flex items-center gap-2 justify-between"
              >
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={lang.name}
                    onChange={(e) => updateLanguage(idx, "name", e.target.value)}
                    placeholder={t("Ex. Français, Anglais...", "e.g. French, English...")}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded font-semibold text-stone-900 dark:text-stone-100"
                  />
                  <input
                    type="text"
                    value={lang.level}
                    onChange={(e) => updateLanguage(idx, "level", e.target.value)}
                    placeholder={t("Ex. Bilingue (C2), Professionnel (C1)...", "e.g. Bilingual (C2), Professional (C1)...")}
                    className="w-full px-2 py-1 text-[11px] bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded text-stone-600 dark:text-stone-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLanguage(idx)}
                  className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push("/onboarding/step-5")}
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
              <span>{t("Finaliser & Découvrir le Cockpit", "Finish & Discover the Cockpit")}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function OnboardingStep6Page() {
  return (
    <OnboardingShell stepNumber={6}>
      <Step6Content />
    </OnboardingShell>
  );
}
