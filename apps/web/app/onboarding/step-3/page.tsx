"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

function Step3Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t } = useAppLanguage();

  if (!profile) return null;

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-4");
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1.5">
            {t("Profil LinkedIn", "LinkedIn profile")}
          </label>
          <input
            type="url"
            value={profile.linkedin_url || ""}
            onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
            placeholder="https://linkedin.com/in/..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD2C3] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-sm text-stone-900 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1.5">
            {t("Profil GitHub", "GitHub profile")}
          </label>
          <input
            type="url"
            value={profile.github_url || ""}
            onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
            placeholder="https://github.com/..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD2C3] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-sm text-stone-900 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1.5">
            {t("Site Web / Portfolio", "Website / Portfolio")}
          </label>
          <input
            type="url"
            value={profile.website_url || ""}
            onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
            placeholder="https://..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD2C3] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-sm text-stone-900 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#EADFCE]">
        <button
          type="button"
          onClick={() => router.push("/onboarding/step-2")}
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

export default function OnboardingStep3Page() {
  return (
    <OnboardingShell stepNumber={3}>
      <Step3Content />
    </OnboardingShell>
  );
}
