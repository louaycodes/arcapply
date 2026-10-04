"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppLanguage } from "@/lib/language-context";

export default function OnboardingIndexPage() {
  const router = useRouter();
  const { t } = useAppLanguage();

  useEffect(() => {
    router.replace("/onboarding/step-1");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#12100E] flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500 font-medium">{t("Chargement du guide de configuration...", "Loading the setup guide...")}</p>
      </div>
    </div>
  );
}
