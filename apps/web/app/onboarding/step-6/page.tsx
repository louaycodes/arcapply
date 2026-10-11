"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

function Step6Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t } = useAppLanguage();

  if (!profile) return null;

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-7");
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1.5">
            {t("Bio & Présentation (Français)", "Bio & Summary (French)")}
          </label>
          <textarea
            rows={4}
            value={profile.bio_fr ?? profile.bio ?? ""}
            onChange={(e) =>
              setProfile({
                ...profile,
                bio: e.target.value,
                bio_fr: e.target.value,
              })
            }
            placeholder={t(
              "Présentez votre profil en quelques phrases : votre domaine d'intérêt, vos points forts et votre motivation...",
              "Introduce your background in a few sentences: your key interests, main strengths, and motivation..."
            )}
            className="w-full p-3 rounded-xl bg-white border border-[#DDD2C3] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-xs text-stone-900 transition-colors leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1.5">
            {t("Professional summary (Anglais)", "Professional summary (English)")}
          </label>
          <textarea
            rows={4}
            value={profile.bio_en ?? ""}
            onChange={(e) => setProfile({ ...profile, bio_en: e.target.value })}
            placeholder={t(
              "Summarize your background, interests, and aspirations in a few sentences...",
              "Summarize your background, interests, and aspirations in a few sentences..."
            )}
            className="w-full p-3 rounded-xl bg-white border border-[#DDD2C3] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-xs text-stone-900 transition-colors leading-relaxed"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#EADFCE]">
        <button
          type="button"
          onClick={() => router.push("/onboarding/step-5")}
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

export default function OnboardingStep6Page() {
  return (
    <OnboardingShell stepNumber={6}>
      <Step6Content />
    </OnboardingShell>
  );
}
