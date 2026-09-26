"use client";

import { JobOffer, ATSMatchResult } from "@/lib/api";
import { KanbanCard } from "./kanban-card";
import { LucideIcon } from "lucide-react";

interface KanbanColumnProps {
  id: string;
  title: string;
  icon: LucideIcon;
  colorClass: string;
  badgeBg: string;
  jobs: JobOffer[];
  atsScores: Record<string, ATSMatchResult>;
  onOpenMirror: (job: JobOffer) => void;
  onTransition: (jobId: string, newStatus: string) => Promise<void>;
  transitioningJobId?: string | null;
}

export function KanbanColumn({
  id,
  title,
  icon: Icon,
  colorClass,
  badgeBg,
  jobs,
  atsScores,
  onOpenMirror,
  onTransition,
  transitioningJobId,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col flex-shrink-0 w-80 md:w-72 lg:w-80 rounded-2xl border border-border/70 bg-card/60 overflow-hidden shadow-sm">
      {/* Column Header */}
      <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${badgeBg}`}>
            <Icon className={`w-4 h-4 ${colorClass}`} />
          </div>
          <span className="text-xs font-bold text-foreground">{title}</span>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
          {jobs.length}
        </span>
      </div>

      {/* Cards list */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[300px]">
        {jobs.length === 0 ? (
          <div className="h-32 border border-dashed border-border/50 rounded-xl flex items-center justify-center p-4 text-center">
            <span className="text-xs text-muted-foreground/50 italic">
              Aucune candidature
            </span>
          </div>
        ) : (
          jobs.map((job) => (
            <KanbanCard
              key={job.id}
              job={job}
              atsMatch={atsScores[job.id]}
              onOpenMirror={onOpenMirror}
              onTransition={onTransition}
              isTransitioning={transitioningJobId === job.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
