"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

function Step5Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t } = useAppLanguage();
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const headline = profile.headline_fr || profile.headline;
    if (!headline?.trim()) {
      setError(t("Veuillez renseigner votre titre professionnel.", "Please enter your professional headline."));
      return;
    }

    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-6");
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
        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1.5">
            {t("Titre d'accroche (Français) *", "Professional headline (French) *")}
          </label>
          <input
            type="text"
            required
            value={profile.headline_fr ?? profile.headline ?? ""}
            onChange={(e) =>
              setProfile({
                ...profile,
                headline: e.target.value,
                headline_fr: e.target.value,
              })
            }
            placeholder={t("Ex. Élève-ingénieur Logiciel & Cloud | Recherche Stage PFE", "e.g. Software & Cloud Engineering Student | Seeking PFE Internship")}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD2C3] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-sm text-stone-900 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1.5">
            {t("Titre professionnel (Anglais)", "Professional headline (English)")}
          </label>
          <input
            type="text"
            value={profile.headline_en ?? ""}
            onChange={(e) => setProfile({ ...profile, headline_en: e.target.value })}
            placeholder={t("Ex. Software & Cloud Engineering Student | Seeking Final Year Internship", "e.g. Software & Cloud Engineering Student | Seeking Final Year Internship")}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD2C3] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-sm text-stone-900 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#EADFCE]">
        <button
          type="button"
          onClick={() => router.push("/onboarding/step-4")}
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

export default function OnboardingStep5Page() {
  return (
    <OnboardingShell stepNumber={5}>
      <Step5Content />
    </OnboardingShell>
  );
}
