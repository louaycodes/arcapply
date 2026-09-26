import { Settings, Shield, HardDrive, Terminal } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Paramètres du Système
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configuration de l'hôte local, persistance souveraine et connecteurs d'IA.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-5 rounded-xl border border-border bg-card space-y-2">
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Base de données souveraine</h3>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            Emplacement : ~/.arcapply/arcapply.db
          </p>
          <p className="text-xs text-muted-foreground">
            Toutes vos informations personnelles et sessions restent strictement confinées sur cette machine.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-2">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Engine API REST & SSE</h3>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            URL : http://localhost:8000
          </p>
          <p className="text-xs text-muted-foreground">
            Moteur découplé gérant l'automatisation, la validation et les adaptateurs externes.
          </p>
        </div>
      </div>
    </div>
  );
}
