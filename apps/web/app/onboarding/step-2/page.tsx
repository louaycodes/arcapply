"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

function Step2Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t } = useAppLanguage();
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profile.email?.trim() || !profile.email.includes("@")) {
      setError(t("Veuillez renseigner une adresse email valide.", "Please enter a valid email address."));
      return;
    }

    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-3");
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
            {t("Email de contact *", "Contact email *")}
          </label>
          <input
            type="email"
            required
            value={profile.email || ""}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder={t("Ex. alexandre.dupont@email.com", "e.g. alex.dupont@email.com")}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD2C3] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-sm text-stone-900 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1.5">
            {t("Numéro de téléphone", "Phone number")}
          </label>
          <input
            type="tel"
            value={profile.phone || ""}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            placeholder={t("Ex. +33 6 12 34 56 78", "e.g. +33 6 12 34 56 78")}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD2C3] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-sm text-stone-900 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1.5">
            {t("Localisation (Ville, Pays)", "Location (City, Country)")}
          </label>
          <input
            type="text"
            value={profile.location || ""}
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            placeholder={t("Ex. Paris, France / Tunis, Tunisie", "e.g. Paris, France / Tunis, Tunisia")}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD2C3] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-sm text-stone-900 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#EADFCE]">
        <button
          type="button"
          onClick={() => router.push("/onboarding/step-1")}
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

export default function OnboardingStep2Page() {
  return (
    <OnboardingShell stepNumber={2}>
      <Step2Content />
    </OnboardingShell>
  );
}
