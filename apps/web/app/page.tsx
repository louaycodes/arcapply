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
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  Target,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-10">
      {/* ── Hero Welcome ── */}
      <div className="relative overflow-hidden rounded-3xl border border-[#EADBCC] bg-gradient-to-br from-[#FFFDF9] via-[#FFF7ED] to-[#F7EFE4] p-8 sm:p-12 shadow-artisan-card">
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-100/90 border border-orange-200 text-orange-900 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Stages PFE & Emploi Ingénieur 2027</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 font-display leading-[1.15]">
            Votre copilote intelligent pour décrocher le poste idéal.
          </h1>

          <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-sans font-normal">
            Optimisez vos candidatures d'ingénieur en moins de 3 minutes par offre : adaptation ciblée de votre CV, calcul immédiat de votre score de compatibilité et suivi complet de vos envois et entretiens.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/radar"
              className="px-6 py-3 rounded-xl bg-primary hover:bg-orange-700 text-white text-sm font-semibold flex items-center gap-2.5 tactile-button shadow-artisan-button transition-all"
            >
              <Radar className="w-4 h-4" />
              <span>Explorer les offres Radar</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/cv"
              className="px-5 py-3 rounded-xl border border-stone-300 bg-white/90 hover:bg-white text-sm font-semibold text-stone-800 flex items-center gap-2 shadow-sm transition-all hover:border-orange-300"
            >
              <FileText className="w-4 h-4 text-primary" />
              <span>Éditeur de CV vectoriel</span>
            </Link>
          </div>
        </div>

        {/* Ambient Warm Studio Glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-orange-200/30 via-amber-100/25 to-transparent pointer-events-none" />
      </div>

      {/* ── Modules Clés du Cockpit ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-display flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              <span>Cockpit de Candidature</span>
            </h2>
            <p className="text-xs text-stone-600">
              Accédez directement aux outils d'ingénierie conçus pour votre recherche.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Radar */}
          <Link
            href="/radar"
            className="group p-5 rounded-2xl border border-border bg-white shadow-artisan hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <Radar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-display group-hover:text-primary transition-colors">
                  Radar des Offres
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Flux continu des portails carrières dédiés des 100 meilleures firmes IT (France & Tunisie).
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Voir le flux</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 2: CV Studio */}
          <Link
            href="/cv"
            className="group p-5 rounded-2xl border border-border bg-white shadow-artisan hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-display group-hover:text-primary transition-colors">
                  Éditeur de CV A4
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Modifiez directement sur la feuille A4 et compilez des PDF vectoriels fidèles à 100%.
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Ouvrir l'éditeur</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 3: Kanban */}
          <Link
            href="/kanban"
            className="group p-5 rounded-2xl border border-border bg-white shadow-artisan hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                <KanbanSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-display group-hover:text-primary transition-colors">
                  Suivi Kanban
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Pipeline visuel d'embauche : À postuler, Postulé, Entretiens et Offres finales reçues.
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Consulter le suivi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 4: Profil */}
          <Link
            href="/profile"
            className="group p-5 rounded-2xl border border-border bg-white shadow-artisan hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 group-hover:scale-105 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-display group-hover:text-primary transition-colors">
                  Profil de Référence
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Vos compétences et expériences certifiées. Source unique garantissant zéro hallucination.
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Mettre à jour</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── Feature Pillar Cards ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-bold text-stone-900 font-display">
            Piliers d'Excellence ArcApply
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-2xl border border-border bg-white shadow-artisan space-y-4 hover:border-orange-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-orange-100/80 border border-orange-200 flex items-center justify-center text-primary shadow-sm">
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
          </div>

          <div className="p-7 rounded-2xl border border-border bg-white shadow-artisan space-y-4 hover:border-amber-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-display">Score de Compatibilité ATS</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Mesurez instantanément la correspondance entre votre profil et les exigences du recruteur pour cibler les offres où vous avez le plus de chances.
              </p>
            </div>
            <div className="pt-1">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                Score déterministe
              </span>
            </div>
          </div>

          <div className="p-7 rounded-2xl border border-border bg-white shadow-artisan space-y-4 hover:border-emerald-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
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
          </div>
        </div>
      </div>
    </div>
  );
}
