"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { ArrowRight, Loader2 } from "lucide-react";

function Step1Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t } = useAppLanguage();
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(" ");
      if (parts.length > 1) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(" "));
      } else {
        setFirstName(parts[0] || "");
        setLastName("");
      }
    }
  }, [profile?.full_name]);

  if (!profile) return null;

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fName = firstName.trim();
    const lName = lastName.trim();

    if (!fName || !lName) {
      setError(t("Veuillez renseigner votre prénom et votre nom.", "Please enter your first and last name."));
      return;
    }

    const fullName = `${fName} ${lName}`;
    const success = await saveCurrentStep({ full_name: fullName });
    if (success) {
      router.push("/onboarding/step-2");
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
            {t("Prénom *", "First name *")}
          </label>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setProfile({ ...profile, full_name: `${e.target.value.trim()} ${lastName.trim()}`.trim() });
            }}
            placeholder={t("Ex. Alexandre", "e.g. Alex")}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD2C3] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-sm text-stone-900 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1.5">
            {t("Nom de famille *", "Last name *")}
          </label>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setProfile({ ...profile, full_name: `${firstName.trim()} ${e.target.value.trim()}`.trim() });
            }}
            placeholder={t("Ex. Dupont", "e.g. Dupont")}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DDD2C3] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-sm text-stone-900 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-4 border-t border-[#EADFCE]">
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

export default function OnboardingStep1Page() {
  return (
    <OnboardingShell stepNumber={1}>
      <Step1Content />
    </OnboardingShell>
  );
}
