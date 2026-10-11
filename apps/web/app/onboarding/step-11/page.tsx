"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { Language } from "@/lib/api";
import { ArrowRight, ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

function Step11Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t } = useAppLanguage();
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const languages = profile.languages || [];

  const addLanguage = () => {
    setProfile((prev) => {
      if (!prev) return prev;
      const newL: Language = {
        name: "",
        level: "Courant",
      };
      return {
        ...prev,
        languages: [...(prev.languages || []), newL],
      };
    });
  };

  const removeLanguage = (index: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        languages: (prev.languages || []).filter((_, i) => i !== index),
      };
    });
  };

  const updateLanguage = (index: number, patch: Partial<Language>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const current = prev.languages || [];
      const updated = current.map((lang, i) => (i === index ? { ...lang, ...patch } : lang));
      return { ...prev, languages: updated };
    });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const current = profile.languages || [];
    const valid = current
      .map((lang) => ({
        name: (lang.name || "").trim(),
        level: (lang.level || "").trim(),
      }))
      .filter((lang) => lang.name.length > 0);

    const success = await saveCurrentStep({ languages: valid });
    if (success) {
      router.push("/onboarding/step-12");
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
            {t(`Langues enregistrées (${languages.length})`, `Recorded languages (${languages.length})`)}
          </span>
          <button
            type="button"
            onClick={addLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DACD] text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("Ajouter une langue", "Add language")}</span>
          </button>
        </div>

        {languages.length === 0 ? (
          <div className="py-8 border border-dashed border-[#DDD2C3] rounded-xl text-center space-y-2 bg-[#F6EFE6]/50">
            <p className="text-xs text-stone-600">
              {t("Aucune langue ajoutée pour le moment.", "No language added yet.")}
            </p>
            <button
              type="button"
              onClick={addLanguage}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Ajouter une langue", "Add a language")}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {languages.map((lang, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[#DDD2C3] bg-[#F6EFE6] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={lang.name || ""}
                    onChange={(e) => updateLanguage(idx, { name: e.target.value })}
                    placeholder={t("Ex. Français, Anglais...", "e.g. French, English...")}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={lang.level || ""}
                    onChange={(e) => updateLanguage(idx, { level: e.target.value })}
                    placeholder={t("Ex. Langue maternelle, Courant (C1)...", "e.g. Native, Fluent (C1)...")}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD2C3] rounded-lg focus:border-[#EA580C] focus:outline-none text-stone-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLanguage(idx)}
                  className="self-end sm:self-center p-1.5 rounded text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                  title={t("Supprimer", "Delete")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#EADFCE]">
        <button
          type="button"
          onClick={() => router.push("/onboarding/step-10")}
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

export default function OnboardingStep11Page() {
  return (
    <OnboardingShell stepNumber={11}>
      <Step11Content />
    </OnboardingShell>
  );
}
