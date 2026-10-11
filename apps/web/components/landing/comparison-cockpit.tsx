"use client";

import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Target,
  Clock,
  KeyRound,
  FileText,
  Globe,
  Sparkles,
} from "lucide-react";
import { useAppLanguage } from "@/lib/language-context";

export function ComparisonCockpit() {
  const { t } = useAppLanguage();

  const criteria = [
    {
      title: t("Véracité des compétences", "Skill Veracity"),
      bad: t(
        "Hallucinations fréquentes, projets et compétences inventés qui vous discréditent en entretien technique.",
        "Frequent hallucinations and fabricated skills that get you exposed in technical interviews."
      ),
      good: t(
        "100% Master Profile Réel : Chaque argument est issu de vos projets documentés et certifiés.",
        "100% Verified Profile: Every statement stems strictly from your documented engineering facts."
      ),
    },
    {
      title: t("Périmètre des opportunités", "Opportunity Scope"),
      bad: t(
        "Limité à 1 ou 2 jobboards US sans filtre de stage PFE ni distinction France/Tunisie.",
        "Limited to 1-2 generic US platforms with zero PFE filters or France/Tunisia localization."
      ),
      good: t(
        "27 Sources officielles FR & TN avec déduplication sémantique en temps réel.",
        "27 Official FR & TN job boards with real-time continuous semantic deduplication."
      ),
    },
    {
      title: t("Format & Rendu du CV", "CV Layout & Rendering"),
      bad: t(
        "Fichiers Word désalignés, marges cassées et rejets automatiques par les parsers ATS.",
        "Unaligned Word templates, overflowing pages, and automatic parsing rejection by ATS."
      ),
      good: t(
        "A4 Vectoriel pur compilé par Playwright, 1 page exacte et 100% compatible ATS.",
        "Pure vector A4 compiled by Playwright, exact 1-page fit, and 100% ATS-compliant."
      ),
    },
    {
      title: t("Temps par candidature", "Time Per Application"),
      bad: t(
        "45 minutes de copier-coller manuel pénible et d'adaptation laborieuse.",
        "45 minutes of tedious manual copy-pasting and repetitive boilerplate tweaking."
      ),
      good: t(
        "Moins de 2 minutes par candidature ciblée et chirurgicalement adaptée.",
        "Under 2 minutes per targeted, surgically tailored engineering application."
      ),
    },
    {
      title: t("Souveraineté & Quota", "Privacy & Dedicated Quota"),
      bad: t(
        "Serveurs partagés saturés (erreur 429), données revendues à des recruteurs tiers.",
        "Saturated shared servers (rate limits) and your personal data monetized with third parties."
      ),
      good: t(
        "Mode BYOK Groq privé (200 000 tokens/jour) et données confinées à votre session.",
        "Private BYOK Groq mode (200,000 daily tokens) with complete local data sovereignty."
      ),
    },
  ];

  return (
    <section id="comparison" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
            <Target className="w-3.5 h-3.5 text-amber-600" />
            <span>{t("Comparatif Déterministe", "Deterministic Benchmark")}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-stone-900 dark:text-white leading-[1.15]">
            {t(
              "Pourquoi les Étudiants Ingénieurs Choisissent ArcApply",
              "Why Engineering Students Choose ArcApply"
            )}
          </h2>

          <div className="w-16 h-1 bg-amber-600 rounded-full mx-auto" />

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
            {t(
              "La différence entre le mass-spam IA générique rejeté par les recruteurs et une candidature d'ingénieur d'élite.",
              "The difference between bulk AI spam rejected by hiring teams and an elite engineering submission."
            )}
          </p>
        </div>

        {/* ── Side-by-Side Dual Engine Comparison Cockpit ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* ── Left Panel: Generic AI Spam Model ── */}
          <div className="rounded-3xl border border-red-200/90 dark:border-red-900/60 bg-red-50/30 dark:bg-[#181110] p-6 sm:p-9 space-y-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-red-200 dark:border-red-900/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 flex items-center justify-center font-bold">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold font-display text-red-950 dark:text-red-200">
                      {t("Le Modèle Spam IA Générique", "The Generic AI Spam Model")}
                    </h3>
                    <p className="text-xs text-red-700/70 dark:text-red-400/80">
                      ChatGPT prompts &bull; Bots de candidature massive
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
                  REJET RECRUTEUR
                </span>
              </div>

              {/* Criteria items */}
              <div className="space-y-4">
                {criteria.map((item, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <span className="font-bold text-stone-700 dark:text-stone-300 text-[11px] uppercase tracking-wider block">
                      {item.title}
                    </span>
                    <div className="flex items-start gap-2 text-stone-600 dark:text-stone-400">
                      <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{item.bad}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Result Card */}
            <div className="pt-4 border-t border-red-200 dark:border-red-900/50 flex items-center justify-between text-xs font-mono">
              <span className="text-stone-500">TAUX DE RETOUR ESTIMÉ :</span>
              <span className="font-black text-red-600 dark:text-red-400">&lt; 2% (BURN-OUT)</span>
            </div>
          </div>

          {/* ── Right Panel: ArcApply Deterministic Copilot ── */}
          <div className="rounded-3xl border border-orange-500/40 dark:border-orange-500/40 bg-white dark:bg-[#181513] p-6 sm:p-9 space-y-6 shadow-xl ring-1 ring-orange-500/20 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-primary flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold font-display text-stone-900 dark:text-white">
                      ArcApply Copilot Déterministe
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {t("Standard d'Ingénierie & Zéro Hallucination", "Engineering Standard & Zero Fluff")}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  STANDARD D'ÉLITE
                </span>
              </div>

              {/* Criteria items */}
              <div className="space-y-4">
                {criteria.map((item, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <span className="font-bold text-primary dark:text-orange-400 text-[11px] uppercase tracking-wider block">
                      {item.title}
                    </span>
                    <div className="flex items-start gap-2 text-stone-800 dark:text-stone-200">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-medium">{item.good}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Result Card */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs font-mono relative z-10">
              <span className="text-stone-500">TAUX DE CONVOCATION :</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">MULTIPLIÉ PAR 3</span>
            </div>

            {/* Ambient Accent Glow */}
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-orange-500/5 blur-3xl pointer-events-none" />
          </div>

        </div>
      </div>
    </section>
  );
}
