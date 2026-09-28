"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Radar,
  UserCheck,
  KanbanSquare,
  ArrowRight,
  Sparkles,
  Compass,
  Zap,
  Move,
} from "lucide-react";
import {
  LiquidGlassRoot,
  LiquidGlassElement,
} from "@/components/ui/liquid-glass";
import { useState } from "react";

export default function HomePage() {
  const [fps, setFps] = useState<number | null>(null);

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-12">
      {/* ── Liquid Glass Interactive Hero ── */}
      <LiquidGlassRoot
        className="relative overflow-hidden rounded-3xl min-h-[480px] p-6 sm:p-12 border border-[#E8DFD4] shadow-2xl flex flex-col justify-between"
        defaults={{
          refraction: 0.72,
          blurAmount: 0.18,
          chromAberration: 0.05,
          edgeHighlight: 0.14,
          specular: 0.1,
          fresnel: 0.9,
          cornerRadius: 28,
        }}
        onReady={(inst) => {
          const updateFps = () => {
            if (inst.fps) setFps(Math.round(inst.fps));
          };
          const interval = setInterval(updateFps, 1000);
          return () => clearInterval(interval);
        }}
      >
        {/* NON-GLASS SIBLING: Rich ambient backdrop for refraction */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Warm mesh gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFFDF9] via-[#FFF3E0] to-[#FCE7D0]" />

          {/* Glowing ambient orbs for optical bending */}
          <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-br from-orange-400/40 via-amber-300/30 to-rose-400/25 blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-gradient-to-bl from-orange-500/35 via-rose-400/25 to-amber-200/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-gradient-to-tr from-amber-400/30 via-orange-300/20 to-transparent blur-2xl" />

          {/* Subtle textured grid / pattern */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `radial-gradient(#1C1917 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        {/* GLASS ELEMENT 1: Draggable Floating Pill 1 (Direct Child) */}
        <LiquidGlassElement
          config={{
            floating: true,
            cornerRadius: 9999,
            zRadius: 24,
            refraction: 0.85,
            chromAberration: 0.08,
            edgeHighlight: 0.22,
            specular: 0.15,
            shadowOpacity: 0.2,
          }}
          className="self-start inline-flex items-center gap-2 px-4 py-1.5 z-20 text-orange-950 font-semibold text-xs border border-white/60 shadow-lg cursor-grab active:cursor-grabbing backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>Copilote PFE 2027</span>
          <span className="text-[10px] text-orange-700/80 bg-orange-100/80 px-1.5 py-0.5 rounded-full flex items-center gap-1 font-normal">
            <Move className="w-2.5 h-2.5" /> Glissez-moi
          </span>
        </LiquidGlassElement>

        {/* GLASS ELEMENT 2: Main Hero Showcase Card (Direct Child) */}
        <LiquidGlassElement
          config={{
            cornerRadius: 28,
            zRadius: 36,
            refraction: 0.7,
            blurAmount: 0.2,
            edgeHighlight: 0.15,
            specular: 0.1,
            fresnel: 0.95,
            shadowOpacity: 0.28,
          }}
          className="my-6 p-6 sm:p-8 z-10 max-w-2xl border border-white/70 shadow-2xl backdrop-blur-lg bg-white/40"
        >
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 font-display leading-[1.12]">
              Votre copilote intelligent pour décrocher le poste idéal.
            </h1>

            <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-sans font-normal">
              Optimisez vos candidatures d'ingénieur en moins de 3 minutes par offre : adaptation ciblée de votre CV, calcul immédiat de votre score de compatibilité et suivi complet de vos envois et entretiens.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/profile"
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-orange-700 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-orange-600/30 transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <UserCheck className="w-4 h-4" />
                <span>Compléter mon profil</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/radar"
                className="px-5 py-2.5 rounded-xl border border-stone-300/80 bg-white/80 hover:bg-white text-sm font-semibold text-stone-800 flex items-center gap-2 shadow-sm transition-all hover:border-orange-300"
              >
                <Radar className="w-4 h-4 text-primary" />
                <span>Découvrir les offres</span>
              </Link>
            </div>
          </div>
        </LiquidGlassElement>

        {/* GLASS ELEMENT 3: Floating Footer Glass Badge Bar (Direct Child) */}
        <LiquidGlassElement
          config={{
            floating: true,
            cornerRadius: 9999,
            zRadius: 22,
            refraction: 0.65,
            edgeHighlight: 0.16,
            shadowOpacity: 0.15,
          }}
          className="self-end inline-flex items-center gap-3 px-4 py-1.5 z-20 text-xs font-mono text-stone-700 border border-white/60 shadow-md backdrop-blur-md cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-stone-900">WebGL LiquidGlass</span>
          </div>
          <span className="text-stone-300">|</span>
          <span className="text-[11px] text-stone-600">Réfraction Optique Active</span>
          {fps && (
            <>
              <span className="text-stone-300">|</span>
              <span className="text-[11px] font-semibold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-full">
                {fps} FPS
              </span>
            </>
          )}
        </LiquidGlassElement>
      </LiquidGlassRoot>

      {/* ── Feature Pillar Cards (Direct children of grid LiquidGlassRoot) ── */}
      <LiquidGlassRoot
        className="grid grid-cols-1 md:grid-cols-3 gap-6 relative p-6 sm:p-8 rounded-3xl border border-border bg-gradient-to-b from-[#FBF8F3] to-[#F5ECE0] overflow-hidden"
        defaults={{
          refraction: 0.55,
          blurAmount: 0.1,
          edgeHighlight: 0.14,
          specular: 0.08,
          cornerRadius: 20,
        }}
      >
        {/* NON-GLASS SIBLING: Ambient background glow blobs */}
        <div className="col-span-full absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-orange-300/25 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-300/30 rounded-full blur-3xl" />
        </div>

        {/* NON-GLASS SIBLING: Section Header */}
        <div className="col-span-full relative z-10 mb-2">
          <h2 className="text-xl font-bold text-stone-900 font-display flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>Piliers d'Excellence ArcApply</span>
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Conçu pour vous donner un avantage décisif sur le marché de l'emploi d'ingénieur.
          </p>
        </div>

        {/* GLASS ELEMENT: Pillar 1 (Direct Child) */}
        <LiquidGlassElement
          config={{
            cornerRadius: 20,
            refraction: 0.6,
            edgeHighlight: 0.14,
            specular: 0.08,
            shadowOpacity: 0.18,
          }}
          className="p-6 border border-white/60 bg-white/60 shadow-lg backdrop-blur-md space-y-4 hover:border-orange-300 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-100/90 border border-orange-200/80 flex items-center justify-center text-primary shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 font-display">Candidatures 100% Sincères</h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Votre profil sert de référence unique. Vos CV et lettres mettent en valeur vos vraies expériences et compétences, sans jamais rien inventer.
            </p>
          </div>
          <div className="pt-1">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
              Fidélité garantie
            </span>
          </div>
        </LiquidGlassElement>

        {/* GLASS ELEMENT: Pillar 2 (Direct Child) */}
        <LiquidGlassElement
          config={{
            cornerRadius: 20,
            refraction: 0.6,
            edgeHighlight: 0.14,
            specular: 0.08,
            shadowOpacity: 0.18,
          }}
          className="p-6 border border-white/60 bg-white/60 shadow-lg backdrop-blur-md space-y-4 hover:border-amber-300 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100/90 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-sm">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 font-display">Score de Compatibilité</h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Mesurez instantanément la correspondance entre votre profil et les exigences du recruteur pour cibler les offres où vous avez le plus de chances.
            </p>
          </div>
          <div className="pt-1">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
              Score précis
            </span>
          </div>
        </LiquidGlassElement>

        {/* GLASS ELEMENT: Pillar 3 (Direct Child) */}
        <LiquidGlassElement
          config={{
            cornerRadius: 20,
            refraction: 0.6,
            edgeHighlight: 0.14,
            specular: 0.08,
            shadowOpacity: 0.18,
          }}
          className="p-6 border border-white/60 bg-white/60 shadow-lg backdrop-blur-md space-y-4 hover:border-emerald-300 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100/90 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-sm">
            <KanbanSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 font-display">Suivi des Candidatures</h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Visualisez chaque étape de vos candidatures, de la découverte à l'offre finale, avec détection automatique des retours recruteurs.
            </p>
          </div>
          <div className="pt-1">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
              Contrôle total
            </span>
          </div>
        </LiquidGlassElement>
      </LiquidGlassRoot>
    </div>
  );
}
