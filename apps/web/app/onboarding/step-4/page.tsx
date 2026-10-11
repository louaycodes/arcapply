"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { testGroqKey } from "@/lib/api";
import { localizeServerMessage } from "@/lib/i18n";
import { ArrowRight, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";

function Step4Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t } = useAppLanguage();

  const [showGroqKey, setShowGroqKey] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [testResult, setTestResult] = useState<{ status: "idle" | "success" | "error"; message?: string }>({ status: "idle" });

  if (!profile) return null;

  const handleTestKey = async () => {
    if (!profile.groq_api_key?.trim()) {
      setTestResult({
        status: "error",
        message: t("Veuillez d'abord saisir une clé d'API Groq.", "Please enter a Groq API key first."),
      });
      return;
    }
    try {
      setTestingGroq(true);
      setTestResult({ status: "idle" });
      const res = await testGroqKey(profile.groq_api_key);
      setTestResult({
        status: "success",
        message: localizeServerMessage(res.message) || t("Clé Groq validée avec succès.", "Groq key validated successfully."),
      });
    } catch (err: any) {
      setTestResult({
        status: "error",
        message: err.message || t("Échec de la validation de la clé.", "Key validation failed."),
      });
    } finally {
      setTestingGroq(false);
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-5");
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1.5">
            {t("Clé d'API Groq (gsk_...)", "Groq API key (gsk_...)")}
          </label>
          <div className="relative">
            <input
              type={showGroqKey ? "text" : "password"}
              value={profile.groq_api_key || ""}
              onChange={(e) => {
                setProfile({ ...profile, groq_api_key: e.target.value });
                setTestResult({ status: "idle" });
              }}
              placeholder="gsk_..."
              className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-white border border-[#DDD2C3] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-sm font-mono text-stone-900 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowGroqKey(!showGroqKey)}
              className="absolute right-2.5 top-2.5 p-1 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              title={showGroqKey ? t("Masquer", "Hide") : t("Afficher", "Show")}
            >
              {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
            {t(
              "Optionnel. Laissez vide pour utiliser la configuration standard de la plateforme.",
              "Optional. Leave blank to use the platform's default setup."
            )}
          </p>
        </div>

        {profile.groq_api_key?.trim() && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testingGroq}
              className="px-3.5 py-1.5 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DACD] text-stone-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {testingGroq ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t("Test...", "Testing...")}
                </span>
              ) : (
                t("Tester la clé", "Test key")
              )}
            </button>

            {testResult.status === "success" && (
              <span className="text-xs text-emerald-700 font-medium">
                {testResult.message}
              </span>
            )}

            {testResult.status === "error" && (
              <span className="text-xs text-red-600 font-medium">
                {testResult.message}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#EADFCE]">
        <button
          type="button"
          onClick={() => router.push("/onboarding/step-3")}
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

export default function OnboardingStep4Page() {
  return (
    <OnboardingShell stepNumber={4}>
      <Step4Content />
    </OnboardingShell>
  );
}
