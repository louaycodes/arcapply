"use client";

import React, { useState } from "react";
import {
  Compass,
  Radar,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Target,
  Sparkles,
  KanbanSquare,
  ChevronRight,
  Clock,
  Layers,
  Award,
} from "lucide-react";
import { useAppLanguage } from "@/lib/language-context";

export function AscensionProtocol() {
  const { t } = useAppLanguage();
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  return (
    <section id="how-it-works" className="py-24 bg-stone-100/60 dark:bg-[#141210] border-y border-stone-200/80 dark:border-stone-800 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t("Protocole en 3 Phases", "3-Phase Protocol")}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-stone-900 dark:text-white leading-[1.15]">
            {t(
              "De Votre Profil aux Entretiens en 3 Étapes",
              "From Verified Profile to Interviews in 3 Steps"
            )}
          </h2>

          <div className="w-16 h-1 bg-emerald-600 rounded-full mx-auto" />

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
            {t(
              "Un parcours limpide et rigoureux conçu pour les étudiants ingénieurs. Moins de 10 minutes pour tout configurer.",
              "A transparent, rigorous journey tailored for student engineers. Configured in under 10 minutes."
            )}
          </p>
        </div>

        {/* ── Interactive Step Rail / Tabs ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {/* Step Tab 1 */}
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
              activeStep === 1
                ? "bg-white dark:bg-[#181513] border-primary shadow-lg ring-1 ring-primary/40 -translate-y-1"
                : "bg-white/60 dark:bg-[#181513]/60 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`w-8 h-8 rounded-xl font-bold font-display text-xs flex items-center justify-center ${
                activeStep === 1
                  ? "bg-primary text-white"
                  : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
              }`}>
                01
              </span>
              <span className="text-[10px] font-mono text-stone-400 uppercase font-semibold">
                PHASE 01
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                {t("Ensemencement du Master Profile", "Master Profile Seeding")}
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {t("7 étapes guidées sans friction", "7 guided frictionless steps")}
              </p>
            </div>
          </button>

          {/* Step Tab 2 */}
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
              activeStep === 2
                ? "bg-white dark:bg-[#181513] border-emerald-600 shadow-lg ring-1 ring-emerald-600/40 -translate-y-1"
                : "bg-white/60 dark:bg-[#181513]/60 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`w-8 h-8 rounded-xl font-bold font-display text-xs flex items-center justify-center ${
                activeStep === 2
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
              }`}>
                02
              </span>
              <span className="text-[10px] font-mono text-stone-400 uppercase font-semibold">
                PHASE 02
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                {t("Radar & Calcul ATS en Direct", "Radar & Live ATS Alignment")}
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {t("Scoring instantané sur 27 sources", "Instant scoring on 27 sources")}
              </p>
            </div>
          </button>

          {/* Step Tab 3 */}
          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
              activeStep === 3
                ? "bg-white dark:bg-[#181513] border-blue-600 shadow-lg ring-1 ring-blue-600/40 -translate-y-1"
                : "bg-white/60 dark:bg-[#181513]/60 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`w-8 h-8 rounded-xl font-bold font-display text-xs flex items-center justify-center ${
                activeStep === 3
                  ? "bg-blue-600 text-white"
                  : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
              }`}>
                03
              </span>
              <span className="text-[10px] font-mono text-stone-400 uppercase font-semibold">
                PHASE 03
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                {t("Déploiement Vectoriel & Relances", "Vector Dispatch & Follow-ups")}
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {t("CV A4, lettre et suivi Kanban", "A4 CV, letter & Kanban tracker")}
              </p>
            </div>
          </button>
        </div>

        {/* ── Active Phase Interactive Showcase Card ── */}
        <div className="max-w-5xl mx-auto rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#181513] shadow-xl p-6 sm:p-10 animate-in fade-in duration-300">
          
          {/* Phase 1 Detail */}
          {activeStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-primary text-xs font-bold font-mono">
                  <span>STEP 01/03 &bull; MASTER PROFILE</span>
                </div>
                <h3 className="text-2xl font-bold font-display text-stone-900 dark:text-white">
                  {t(
                    "Une source unique de vérité infalsifiable",
                    "A Single Unfalsifiable Source of Truth"
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {t(
                    "Notre assistant d'onboarding en 7 étapes recueille vos expériences, formations, projets d'école certifiés et compétences techniques réelles. Ce qui n'est pas dans le Master Profile n'existera jamais dans vos candidatures.",
                    "Our 7-step onboarding wizard collects your verified education, real internships, school engineering projects, and technical stacks. Nothing synthetic is ever fabricated."
                  )}
                </p>
                <div className="pt-2 space-y-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t("Formations certifiées (ESPRIT, INSAT, INSA, Polytech...)", "Certified engineering schools")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t("Projets académiques et personnels documentés", "Documented capstone & academic projects")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t("Garantie stricte anti-hallucination", "Strict zero-hallucination guarantee")}</span>
                  </div>
                </div>
              </div>

              {/* Visual Pillar Pills */}
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#12100E] p-5 space-y-2.5 font-mono text-xs">
                <div className="text-[11px] text-stone-400 font-bold uppercase pb-1 border-b border-stone-200 dark:border-stone-800">
                  SCHEMA_MASTER_PROFILE
                </div>
                {[
                  "1. Coordonnées & Mobilité (FR & TN)",
                  "2. Cursus & Diplômes d'Ingénieur",
                  "3. Expériences & Stages Précédents",
                  "4. Projets d'Ingénierie Clés",
                  "5. Compétences & Stacks Techniques",
                  "6. Langues de Travail (Bilingue FR/EN)",
                  "7. Clé Privée BYOK (Groq Inférence)",
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#181513] border border-stone-200/80 dark:border-stone-800 text-[11px]"
                  >
                    <span className="text-stone-800 dark:text-stone-200">{step}</span>
                    <span className="text-emerald-600 font-bold">VERIFIED</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase 2 Detail */}
          {activeStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
                  <span>STEP 02/03 &bull; RADAR & ATS ENGINE</span>
                </div>
                <h3 className="text-2xl font-bold font-display text-stone-900 dark:text-white">
                  {t(
                    "Score de compatibilité ATS calculé en direct",
                    "Live ATS Compatibility Score in Under 300ms"
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {t(
                    "Le moteur compare les exigences de chaque offre indexée avec vos acquis certifiés. Vous visualisez immédiatement votre score d'adéquation (ex: 94%), les mots-clés correspondants et les axes prioritaires.",
                    "The engine cross-checks the job specs against your Master Profile. You instantly view your match percentage (e.g. 94%), verified keywords, and primary gaps."
                  )}
                </p>
                <div className="pt-2 space-y-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t("Veille en continu sur 27 sources FR & TN", "Continuous crawl of 27 FR & TN boards")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t("Déduplication sémantique sans spam", "Zero-spam semantic deduplication")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t("Ciblage chirurgical des meilleures opportunités", "Surgical targeting of top tier offers")}</span>
                  </div>
                </div>
              </div>

              {/* Visual Match Calculation */}
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#12100E] p-5 space-y-4 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                  <span className="font-bold font-display text-stone-900 dark:text-white">
                    Thales &bull; DevOps Kubernetes
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs">
                    MATCH 94%
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                    Mots-Clés Analysés :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Kubernetes", "Docker", "CI/CD Actions", "FastAPI", "Python"].map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 italic">
                  Alignement parfait avec le projet Microservices documenté dans votre Master Profile.
                </p>
              </div>
            </div>
          )}

          {/* Phase 3 Detail */}
          {activeStep === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono">
                  <span>STEP 03/03 &bull; VECTOR DISPATCH & KANBAN</span>
                </div>
                <h3 className="text-2xl font-bold font-display text-stone-900 dark:text-white">
                  {t(
                    "Générez, postulez et suivez vos relances",
                    "Generate, Apply, and Automate Recruiter Follow-ups"
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {t(
                    "Téléchargez votre CV A4 vectoriel et votre lettre chirurgicale sur-mesure. Vos démarches sont automatiquement synchronisées dans le Kanban avec rappel intelligent à J+7.",
                    "Export your calibrated vector A4 resume and surgical letter. Every submission synchronizes to your Kanban pipeline with Day+7 follow-up reminders."
                  )}
                </p>
                <div className="pt-2 space-y-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>{t("Compilation PDF vectoriel fidèle Playwright", "100% faithful vector PDF export")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>{t("Synthèse sobre sans blabla", "Surgical cover letter grounded in projects")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>{t("Rappels de relance polie à J+7", "Optimal follow-up notifications at Day+7")}</span>
                  </div>
                </div>
              </div>

              {/* Visual Pipeline Stage */}
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#12100E] p-5 space-y-3 font-mono text-xs">
                <div className="text-[11px] text-stone-400 font-bold uppercase pb-1 border-b border-stone-200 dark:border-stone-800">
                  CYCLE_CANDIDATURE_ACTIF
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#181513] border border-stone-200 dark:border-stone-800">
                  <span className="text-stone-800 dark:text-stone-200 font-sans font-semibold">1. CV Vectoriel A4</span>
                  <span className="text-blue-600 font-bold">PRÊT</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#181513] border border-stone-200 dark:border-stone-800">
                  <span className="text-stone-800 dark:text-stone-200 font-sans font-semibold">2. Lettre Chirurgicale</span>
                  <span className="text-blue-600 font-bold">ALIGNÉE</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-sans font-semibold">
                  <span>3. Sentinelle Relance J+7</span>
                  <span className="text-amber-600 font-bold font-mono">AUTOMATIQUE</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
