import Link from "next/link";
import {
  ShieldCheck,
  Radar,
  UserCheck,
  KanbanSquare,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function CockpitDashboard() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Hero Welcome */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[#0F172A] to-[#0B0F19] p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PFE 2027 — France & Tunisie</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Bienvenue sur votre cockpit personnel ArcApply
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Optimisez vos candidatures d'ingénieur avec un cycle inférieur à 3 minutes par offre : adaptation déterministe de CV sans hallucination, scoring ATS prédictif, sas de validation humaine et suivi de pipeline en temps réel.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/profile"
              className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/25 transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>Configurer mon Master Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/radar"
              className="px-5 py-2.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm font-medium text-foreground flex items-center gap-2 transition-colors"
            >
              <Radar className="w-4 h-4 text-primary" />
              <span>Explorer le Radar d'Offres</span>
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
      </div>

      {/* Feature Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-border bg-card space-y-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Zéro-Hallucination Garanti</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Le Master Profile constitue le socle immuable. Les moteurs d'IA ne peuvent ni extrapoler ni inventer la moindre compétence absente.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card space-y-3">
          <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <Radar className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Scoring ATS Prédictif</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Confrontation mathématique directe entre l'offre et vos réalisations réelles, avec inventaire clair des compétences validées et manquantes.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card space-y-3">
          <div className="w-10 h-10 rounded-lg bg-success/15 border border-success/30 flex items-center justify-center text-success">
            <KanbanSquare className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Suivi Kanban & Synchronisation</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Visualisez chaque étape de vos candidatures, de la découverte à l'offre finale, avec ingestion automatique des réponses recruteurs.
          </p>
        </div>
      </div>
    </div>
  );
}
