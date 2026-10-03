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
    <div className="flex flex-col w-full rounded-2xl border border-stone-200 dark:border-stone-800 bg-[#F5EFE6]/70 dark:bg-stone-900/60 overflow-hidden shadow-artisan">
      {/* Column Header */}
      <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white/70 dark:bg-stone-900/90 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${badgeBg}`}>
            <Icon className={`w-4 h-4 ${colorClass}`} />
          </div>
          <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-display">{title}</span>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
          {jobs.length}
        </span>
      </div>

      {/* Cards list */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[300px]">
        {jobs.length === 0 ? (
          <div className="h-32 border border-dashed border-stone-300 dark:border-stone-700 rounded-xl flex items-center justify-center p-4 text-center">
            <span className="text-xs text-stone-400 dark:text-stone-500 italic">
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
