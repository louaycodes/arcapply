"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { completeOnboarding } from "@/lib/api";
import {
  ShieldCheck,
  Radar,
  FileText,
  KanbanSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Check,
  Compass,
} from "lucide-react";

function Step7Content() {
  const router = useRouter();
  const { profile, status } = useOnboarding();
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = async () => {
    try {
      setIsFinishing(true);
      await completeOnboarding();
      if (typeof window !== "undefined") {
        localStorage.setItem("arcapply_walkthrough_done", "true");
        localStorage.removeItem("arcapply_just_registered");
        // Update stored user if present
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

  const score = status?.completion_percentage ?? 85;

  return (
    <div className="space-y-6">
      {/* Celebration Banner */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Configuration Initiale Réussie</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">
              Félicitations {profile?.full_name?.split(" ")[0] || ""} ! Votre profil est prêt.
            </h3>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Vos informations ont été enregistrées avec succès dans votre Master Profile. Le moteur déterministe ArcApply peut maintenant générer des candidatures ultra-ciblées sans aucune hallucination.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center shrink-0">
            <span className="block text-4xl font-extrabold font-mono text-white tracking-tight">
              {score}%
            </span>
            <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider block mt-1">
              Score de Complétude
            </span>
          </div>
        </div>
      </div>

      {/* 3 Pillars of ArcApply */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
          Découvrez vos 3 super-pouvoirs de candidature :
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Radar */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 p-5 shadow-artisan space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-primary flex items-center justify-center">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                1. Radar des Offres PFE
              </h5>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                Collecte automatisée multi-plateformes (LinkedIn, JobTeaser, Apec, etc.). Grâce au bouclier anti-rescrape, les offres déjà postulées et archivées ne réapparaissent jamais.
              </p>
            </div>
          </div>

          {/* Card 2: CV */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 p-5 shadow-artisan space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                2. CV & Lettre 100% Déterministes
              </h5>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                Chaque candidature est ajustée aux mots-clés exacts de l'offre en exploitant uniquement vos vraies expériences, sans aucune compétence inventée.
              </p>
            </div>
          </div>

          {/* Card 3: Kanban */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 p-5 shadow-artisan space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <KanbanSquare className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                3. Suivi Kanban Transparent
              </h5>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                Suivez en temps réel le statut de chacune de vos candidatures, des entretiens jusqu'à l'offre finale de stage PFE.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Launch CTA */}
      <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-artisan flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Prêt à trouver votre stage de rêve ?
            </h5>
            <p className="text-xs text-stone-500">
              Lancez le Radar pour scanner les meilleures offres de stage PFE adaptées à votre profil.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFinish}
          disabled={isFinishing}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl bg-primary hover:bg-orange-700 text-white font-bold text-sm transition-all shadow-md shadow-orange-600/30 cursor-pointer disabled:opacity-50"
        >
          {isFinishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Ouverture du Radar...</span>
            </>
          ) : (
            <>
              <span>Découvrir mes premières offres sur le Radar</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function OnboardingStep7Page() {
  return (
    <OnboardingShell stepNumber={7}>
      <Step7Content />
    </OnboardingShell>
  );
}
