import Link from "next/link";
import {
  ShieldCheck,
  Radar,
  UserCheck,
  KanbanSquare,
  ArrowRight,
  Sparkles,
  Compass,
  FileCheck,
} from "lucide-react";

export default function CockpitDashboard() {
  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-10">
      {/* Hero Welcome : Atelier d'Ingénierie */}
      <div className="relative overflow-hidden rounded-3xl border border-[#EADBCC] bg-gradient-to-br from-[#FFFDF9] via-[#FFF7ED] to-[#F7EFE4] p-8 sm:p-12 shadow-artisan-card">
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-100/90 border border-orange-200 text-orange-900 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>PFE 2027 — Atelier de Précision</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 font-display leading-[1.15]">
            Votre cockpit de candidature conçu pour l'excellence.
          </h1>

          <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-sans font-normal">
            Optimisez vos candidatures d'ingénieur en moins de 3 minutes par offre : adaptation déterministe de CV sans hallucination, scoring ATS prédictif, sas de validation humaine et suivi de pipeline en temps réel.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/profile"
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-2.5 tactile-button shadow-artisan-button transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>Configurer mon Master Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/radar"
              className="px-5 py-3 rounded-xl border border-stone-300 bg-white/90 hover:bg-white text-sm font-semibold text-stone-800 flex items-center gap-2 shadow-sm transition-all hover:border-orange-300"
            >
              <Radar className="w-4 h-4 text-primary" />
              <span>Explorer le Radar d'Offres</span>
            </Link>
          </div>
        </div>

        {/* Warm ambient studio glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-orange-200/25 via-amber-100/20 to-transparent pointer-events-none" />
      </div>

      {/* Feature Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-7 rounded-2xl border border-border bg-white shadow-artisan space-y-4 hover:border-orange-200 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-orange-100/80 border border-orange-200 flex items-center justify-center text-primary shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-display">Zéro-Hallucination Garanti</h2>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Le Master Profile constitue le socle immuable. Les moteurs d'IA ne peuvent ni extrapoler ni inventer la moindre compétence absente.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
              100% Vérifiable
            </span>
          </div>
        </div>

        <div className="p-7 rounded-2xl border border-border bg-white shadow-artisan space-y-4 hover:border-amber-200 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-display">Scoring ATS Prédictif</h2>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Confrontation mathématique directe entre l'offre et vos réalisations réelles, avec inventaire clair des compétences validées et manquantes.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Télémétrie Déterministe
            </span>
          </div>
        </div>

        <div className="p-7 rounded-2xl border border-border bg-white shadow-artisan space-y-4 hover:border-emerald-200 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
            <KanbanSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-display">Suivi Kanban & Synchronisation</h2>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Visualisez chaque étape de vos candidatures, de la découverte à l'offre finale, avec ingestion automatique des réponses recruteurs.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Human-in-the-Loop
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
