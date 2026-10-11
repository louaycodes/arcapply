"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { completeOnboarding, syncProfileMirror } from "@/lib/api";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

function Step12Content() {
  const router = useRouter();
  const { profile } = useOnboarding();
  const { t } = useAppLanguage();
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = async () => {
    try {
      setIsFinishing(true);
      await completeOnboarding();
      syncProfileMirror().catch((e) => console.warn("Background mirror sync non-fatal warning:", e));
      if (typeof window !== "undefined") {
        localStorage.setItem("arcapply_walkthrough_done", "true");
        localStorage.removeItem("arcapply_just_registered");
        localStorage.removeItem("arcapply_onboarding_skipped");
        const savedUser = localStorage.getItem("arcapply_user");
        if (savedUser) {
          try {
            const u = JSON.parse(savedUser);
            u.onboarding_completed = true;
            localStorage.setItem("arcapply_user", JSON.stringify(u));
          } catch (_) {}
        }
      }
      router.push("/radar");
    } catch (err: any) {
      console.error("Failed to complete onboarding:", err);
      router.push("/radar");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-[#DDD2C3] bg-[#F6EFE6] space-y-2">
        <p className="text-sm font-semibold text-stone-900">
          {profile?.full_name ? `${profile.full_name}, ` : ""}
          {t("votre profil est prêt.", "your profile is ready.")}
        </p>
        <p className="text-xs text-stone-600 leading-relaxed">
          {t(
            "Toutes vos données sont enregistrées dans votre Master Profile. Le moteur déterministe peut désormais cibler des offres et préparer vos candidatures sans hallucination.",
            "All your data has been saved to your Master Profile. The deterministic engine can now target offers and prepare your applications without hallucinations."
          )}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#EADFCE]">
        <button
          type="button"
          onClick={() => router.push("/onboarding/step-11")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EFE9DF] hover:bg-[#E5DACD] text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("Précédent", "Back")}</span>
        </button>

        <button
          type="button"
          onClick={handleFinish}
          disabled={isFinishing}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {isFinishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("Ouverture...", "Opening...")}</span>
            </>
          ) : (
            <>
              <span>{t("Accéder au Radar", "Access Radar")}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function OnboardingStep12Page() {
  return (
    <OnboardingShell stepNumber={12}>
      <Step12Content />
    </OnboardingShell>
  );
}
