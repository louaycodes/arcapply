import { Radar, Sparkles } from "lucide-react";
import Link from "next/link";

export default function RadarPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="border-b border-border/60 pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Radar d'Offres PFE
          </h1>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
            Flux Automatisé
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Collecte en temps réel et déduplication depuis LinkedIn et Jobteaser (Story 1.2).
        </p>
      </div>

      <div className="p-12 rounded-xl border border-dashed border-border bg-card/50 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
          <Radar className="w-6 h-6 animate-pulse" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-semibold text-foreground">Collecteur Radar en attente</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Le connecteur Playwright et le flux SSE d'offres seront initialisés dans la Story 1.2. Assurez-vous d'avoir validé votre Master Profile au préalable.
          </p>
          <div className="pt-2">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
            >
              <span>Vérifier mon Master Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
