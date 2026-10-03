"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/step-1");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500 font-medium">Chargement du guide de configuration...</p>
      </div>
    </div>
  );
}
