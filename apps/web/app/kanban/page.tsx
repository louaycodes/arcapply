import { KanbanSquare } from "lucide-react";
import Link from "next/link";

export default function KanbanPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="border-b border-border/60 pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Suivi Kanban du Pipeline
          </h1>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">
            Cycle de vie PFE
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Orchestration des candidatures de la Découverte à l'Offre finale (Story 1.7).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {["Découverte", "À valider", "Postulé", "Entretien", "Offre"].map((col, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-xs font-semibold text-foreground">{col}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">0</span>
            </div>
            <div className="h-48 border border-dashed border-border/40 rounded-lg flex items-center justify-center p-4 text-center">
              <span className="text-xs text-muted-foreground/60 italic">Aucune candidature</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
