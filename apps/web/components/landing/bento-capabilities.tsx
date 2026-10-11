"use client";

import React, { useState } from "react";
import {
  Radar,
  Target,
  FileText,
  Sparkles,
  KanbanSquare,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  Lock,
  Cpu,
  Layers,
  Flame,
} from "lucide-react";
import { useAppLanguage } from "@/lib/language-context";

export function BentoCapabilities() {
  const { t } = useAppLanguage();
  const [cvLang, setCvLang] = useState<"fr" | "en">("fr");

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <Zap className="w-3.5 h-3.5" />
            <span>{t("Architecture & Moteur", "Architecture & Engine")}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-stone-900 dark:text-white leading-[1.15]">
            {t(
              "L'Ingénierie Déterministe : 6 Modules Clés",
              "Deterministic Engineering: 6 Core Modules"
            )}
          </h2>

          <div className="w-16 h-1 bg-primary rounded-full mx-auto" />

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
            {t(
              "Chaque brique a été pensée pour éliminer le travail répétitif, interdire les hallucinations et maximiser l'impact technique de vos candidatures.",
              "Each building block was engineered to eliminate repetitive toil, prohibit hallucinations, and maximize technical hiring impact."
            )}
          </p>
        </div>

        {/* ── Bento Grid Layout (Bento Command Center) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── BENTO 1: Radar Sémantique & Déduplication (Span 2 cols) ── */}
          <div className="md:col-span-2 rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#181513] p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 relative overflow-hidden group">
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-primary flex items-center justify-center">
                    <Radar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-display text-stone-900 dark:text-white">
                      {t("Radar Multi-Sources & Déduplication", "Multi-Source Radar & Deduplication")}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {t("27 Canaux officiels France & Tunisie", "27 Official France & Tunisia Channels")}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>LIVE FEED</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
                {t(
                  "Scrutateur d'offres déterministe avec pagination continue et normalisation discrète des mots-clés. Détecte les doublons par empreinte sémantique et enrichit la description brute pour l'analyse ATS.",
                  "Deterministic crawler with pagination and multi-location queries. Merges duplicates via semantic fingerprint and fetches deep descriptions for accurate ATS matching."
                )}
              </p>
            </div>

            {/* Visual Simulated Telemetry Stream */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800/90 bg-stone-50 dark:bg-[#12100E] p-4 font-mono text-xs space-y-2 relative z-10">
              <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-stone-200/80 dark:border-stone-800/80 pb-2">
                <span>RADAR_STREAM_TELEMETRY</span>
                <span className="text-emerald-600 dark:text-emerald-400">STATUS: ACTIVE</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
                  <span className="truncate">Thales &bull; Sophia &bull; DevOps Kubernetes</span>
                  <span className="text-[#EA580C] shrink-0 font-bold">MATCH 94%</span>
                </div>
                <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
                  <span className="truncate">Sofrecom &bull; Tunis &bull; PFE Fullstack FastAPI</span>
                  <span className="text-[#EA580C] shrink-0 font-bold">MATCH 91%</span>
                </div>
                <div className="flex items-center justify-between text-stone-500">
                  <span className="truncate">Tanitjobs / LinkedIn cross-post</span>
                  <span className="text-emerald-600 shrink-0 font-semibold">MERGED (1 OFFER)</span>
                </div>
              </div>
            </div>

            {/* Subtle Gradient Glow */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-orange-500/5 blur-3xl pointer-events-none" />
          </div>

          {/* ── BENTO 2: Moteur ATS Mathématique (Radial Gauge) (Span 1 col) ── */}
          <div className="rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#181513] p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-stone-900 dark:text-white">
                {t("Scoring ATS Mathématique", "Mathematical ATS Scoring")}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                {t(
                  "Calcul rigoureux de l'adéquation entre l'offre et vos acquis certifiés. Zéro hallucination, retour immédiat sur les mots-clés manquants.",
                  "Exact keyword match computation between target requirements and your certified profile facts."
                )}
              </p>
            </div>

            {/* Visual Radial Gauge Mock */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#12100E] border border-stone-200 dark:border-stone-800/80 flex items-center justify-between gap-4">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-stone-200 dark:text-stone-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray="94, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-black font-mono text-stone-900 dark:text-white">
                  94%
                </span>
              </div>
              <div className="text-left text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>5/5 Clés Requis</span>
                </div>
                <p className="text-stone-500">FastAPI &bull; Docker &bull; K8s</p>
              </div>
            </div>
          </div>

          {/* ── BENTO 3: Studio CV Vectoriel A4 (Direct Sheet) (Span 1 col) ── */}
          <div className="rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#181513] p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <button
                  type="button"
                  onClick={() => setCvLang(cvLang === "fr" ? "en" : "fr")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border border-blue-300 dark:border-blue-800/80 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 cursor-pointer"
                >
                  {cvLang === "fr" ? "FR -> EN" : "EN -> FR"}
                </button>
              </div>
              <h3 className="text-lg font-bold font-display text-stone-900 dark:text-white">
                {t("Studio CV Vectoriel A4", "Vector A4 CV Studio")}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                {t(
                  "Édition typographique calibrée pour tenir exactement sur 1 page A4 sans saut de ligne indésirable. Rendu PDF vectoriel pur.",
                  "Calibrated A4 layout ensuring a perfect 1-page fit with zero orphan margins. 100% vector PDF output."
                )}
              </p>
            </div>

            {/* Miniature A4 Sheet Mock */}
            <div className="p-3.5 rounded-xl bg-white text-stone-900 border border-stone-200 dark:border-stone-700 text-[10px] space-y-2 shadow-xs">
              <div className="border-b border-stone-200 pb-1.5 flex justify-between items-center">
                <span className="font-bold text-stone-900">Élève-Ingénieur IT</span>
                <span className="font-mono text-primary font-bold">1 PAGE A4</span>
              </div>
              <div className="space-y-1 text-stone-600 text-[9px]">
                <p>&bull; {cvLang === "fr" ? "Projet PFE Microservices (2026)" : "Microservices Capstone Project (2026)"}</p>
                <p>&bull; {cvLang === "fr" ? "Architecture Déterministe FastAPI" : "Deterministic FastAPI Architecture"}</p>
              </div>
            </div>
          </div>

          {/* ── BENTO 4: Lettre Chirurgicale Anti-Hallucination (Span 2 cols) ── */}
          <div className="md:col-span-2 rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#181513] p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-xl hover:border-purple-500/40 transition-all duration-300 relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-display text-stone-900 dark:text-white">
                      {t("Lettres Chirurgicales Anti-Hallucination", "Surgical Anti-Hallucination Letters")}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {t("Comparateur de factualité & Zéro Blabla", "Factuality Inspector & Zero Fluff")}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {t("Garde-Fou Strict", "Strict Guardrail")}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
                {t(
                  "Contrairement aux LLMs conventionnels qui inventent des expériences ou des compétences, le synthétiseur ArcApply rejette immédiatement toute affirmation non documentée dans votre profil vérifié.",
                  "Unlike standard AI prompts that invent imaginary skills, ArcApply systematically prunes any claims not grounded in your Master Profile facts."
                )}
              </p>
            </div>

            {/* Visual Prose Diff Inspector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-1.5">
                <div className="flex items-center gap-1.5 text-red-600 font-bold text-[11px]">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{t("Spam IA Générique (Bloqué)", "Generic AI Spam (Blocked)")}</span>
                </div>
                <p className="text-[10px] text-stone-500 line-through leading-relaxed italic">
                  &laquo; Fort d'une expérience de leadership international chez Google et Meta... &raquo;
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t("ArcApply Factual Synthesizer", "ArcApply Factual Synthesizer")}</span>
                </div>
                <p className="text-[10px] text-stone-700 dark:text-stone-300 leading-relaxed">
                  &laquo; Déploiement de microservices sous FastAPI et Kubernetes lors du projet certifié ArcApply... &raquo;
                </p>
              </div>
            </div>
          </div>

          {/* ── BENTO 5: Pipeline Kanban & Relances J+7 (Span 1 col) ── */}
          <div className="rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#181513] p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all duration-300 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
                <KanbanSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-stone-900 dark:text-white">
                {t("Pipeline Kanban & Relances J+7", "Kanban Pipeline & Day+7 Follow-ups")}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                {t(
                  "Vision globale de vos candidatures et alertes de relance polie après 7 jours sans retour recruteur.",
                  "Application tracking across stages with automated Day+7 follow-up email notifications."
                )}
              </p>
            </div>

            {/* Visual Mini Kanban Pill */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-amber-900 dark:text-amber-200 text-[11px]">
                  Thales &bull; J+7 Recommandée
                </span>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-white dark:bg-stone-900 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                Email prêt
              </span>
            </div>
          </div>

          {/* ── BENTO 6: BYOK Groq & Souveraineté (Span 2 cols) ── */}
          <div className="md:col-span-2 rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#181513] p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all duration-300 relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-500/10 border border-stone-500/20 text-stone-700 dark:text-stone-300 flex items-center justify-center">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-display text-stone-900 dark:text-white">
                      {t("Mode BYOK Groq & Confidentialité Totale", "BYOK Groq Mode & Private Isolation")}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {t("Multi-Tenant Étanche & Quota Privé Dédié", "Isolated Multi-Tenancy & Private Quota")}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>ZERO RETENTION</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
                {t(
                  "Connectez votre propre clé API Groq gratuite pour obtenir 200 000 tokens/jour d'inférence ultra-rapide sans dépendre des serveurs mutualisés. Vos données personnelles et vos CVs restent confinés à votre session.",
                  "Connect your own free Groq API key to unlock 200,000 daily inference tokens completely isolated from shared limits. Your data and resumes stay private to you."
                )}
              </p>
            </div>

            {/* Visual Vault Key Card */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#12100E] p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="px-2.5 py-1 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-bold">
                  GROQ_KEY
                </div>
                <span className="text-stone-500 text-xs">gsk_••••••••••••••••••••</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <span>200k TOKENS / JOUR</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
