"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Send,
  Trophy,
  Briefcase,
  TrendingUp,
  Clock,
  Radar,
  ArrowRight,
  Sparkles,
  Award,
  ChevronRight,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Globe,
} from "lucide-react";
import { useAppLanguage } from "@/lib/language-context";
import { useAuth } from "@/components/auth/auth-context";
import { LandingPage } from "@/components/landing/landing-page";
import { fetchJobs, fetchPipelineMetrics, JobOffer, PipelineMetrics } from "@/lib/api";
import { ALL_RADAR_COUNTRIES, getCountryBadge } from "@/lib/countries";

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useAppLanguage();

  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        const [jobsData, metricsData] = await Promise.all([
          fetchJobs({ include_archived: false }).catch(() => []),
          fetchPipelineMetrics().catch(() => null),
        ]);
        if (isMounted) {
          setJobs(jobsData);
          setMetrics(metricsData);
        }
      } catch (err) {
        console.error("Erreur chargement données tableau de bord:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Calcul des candidatures postulées
  const appliedJobs = useMemo(() => {
    return jobs.filter((j) =>
      ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"].includes(j.status?.toUpperCase() || "")
    );
  }, [jobs]);

  const totalApplied = useMemo(() => {
    return metrics?.submitted_total ?? appliedJobs.length;
  }, [metrics, appliedJobs]);

  // Agrégation chronologique des candidatures (au cours du temps)
  const timelineData = useMemo(() => {
    const weeks: { [key: string]: { label: string; count: number; jobs: JobOffer[] } } = {};
    const now = new Date();

    // Générer les 6 dernières semaines
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekNum = Math.ceil(d.getDate() / 7);
      const monthName = d.toLocaleDateString("fr-FR", { month: "short" });
      const key = `S${weekNum} ${monthName}`;
      weeks[key] = { label: key, count: 0, jobs: [] };
    }

    appliedJobs.forEach((job) => {
      const dateStr = job.applied_at || job.updated_at || job.collected_at;
      if (!dateStr) return;
      const jobDate = new Date(dateStr);
      const weekNum = Math.ceil(jobDate.getDate() / 7);
      const monthName = jobDate.toLocaleDateString("fr-FR", { month: "short" });
      const key = `S${weekNum} ${monthName}`;
      if (weeks[key]) {
        weeks[key].count += 1;
        weeks[key].jobs.push(job);
      }
    });

    return Object.values(weeks);
  }, [appliedJobs]);

  const maxTimelineCount = useMemo(() => {
    const max = Math.max(...timelineData.map((d) => d.count), 1);
    return max;
  }, [timelineData]);

  // Répartition par localisation (FR vs TN)
  const locationStats = useMemo(() => {
    let fr = 0;
    let tn = 0;
    appliedJobs.forEach((j) => {
      const loc = (j.location || "").toLowerCase();
      if (loc.includes("tunis") || loc.includes("tn") || loc.includes("sousse") || loc.includes("sfax")) {
        tn++;
      } else {
        fr++;
      }
    });
    return { fr, tn };
  }, [appliedJobs]);

  // Distribution géographique consolidée des offres du vivier
  const geographicKPIs = useMemo(() => {
    const total = jobs.length;
    const countryCounts: Record<string, number> = {};

    jobs.forEach((j) => {
      const jc = (j.country || "").trim().toLowerCase();
      const matched = ALL_RADAR_COUNTRIES.find(
        (c) => c.id !== "all" && c.aliases.some((a) => jc === a || jc.includes(a))
      );
      const key = matched ? matched.id : (j.country || "Autre");
      countryCounts[key] = (countryCounts[key] || 0) + 1;
    });

    const franceCount = countryCounts["France"] || 0;
    const tunisieCount = countryCounts["Tunisie"] || 0;

    let internationalCount = 0;
    const breakdown: { id: string; label: string; count: number; badge: string }[] = [];

    Object.entries(countryCounts).forEach(([cId, count]) => {
      if (cId !== "France" && cId !== "Tunisie" && count > 0) {
        internationalCount += count;
        const cfg = ALL_RADAR_COUNTRIES.find((c) => c.id.toLowerCase() === cId.toLowerCase());
        breakdown.push({
          id: cId,
          label: cfg ? cfg.label : cId,
          count,
          badge: cfg?.badge || getCountryBadge(cId),
        });
      }
    });

    breakdown.sort((a, b) => b.count - a.count);

    return {
      total,
      france: {
        count: franceCount,
        percentage: total > 0 ? Math.round((franceCount / total) * 100) : 0,
      },
      tunisie: {
        count: tunisieCount,
        percentage: total > 0 ? Math.round((tunisieCount / total) * 100) : 0,
      },
      international: {
        count: internationalCount,
        percentage: total > 0 ? Math.round((internationalCount / total) * 100) : 0,
        breakdown,
      },
    };
  }, [jobs]);

  if (!user) {
    return <LandingPage />;
  }

  const interviewCount = metrics?.interview_count ?? appliedJobs.filter((j) => j.status === "INTERVIEW").length;
  const offerCount = metrics?.offer_count ?? appliedJobs.filter((j) => j.status === "OFFER").length;
  const rejectedCount = metrics?.rejected_count ?? appliedJobs.filter((j) => j.status === "REJECTED").length;
  const activeCount = metrics?.active_count ?? appliedJobs.filter((j) => ["APPLIED", "INTERVIEW"].includes(j.status)).length;

  const responseRate = totalApplied > 0
    ? Math.round(((interviewCount + rejectedCount) / totalApplied) * 100)
    : 0;

  const interviewRate = totalApplied > 0
    ? Math.round((interviewCount / totalApplied) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* ── En-tête du Tableau de Bord ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-display">
            {t("Tableau de Bord des Candidatures", "Application Dashboard")}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            {t(
              "Suivi en temps réel de votre progression, vélocité d'envoi et retours recruteurs.",
              "Real-time tracking of your progress, sending velocity, and recruiter feedback."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/radar"
            className="px-4 py-2 rounded-xl bg-primary hover:bg-[#C2410C] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Radar className="w-3.5 h-3.5" />
            <span>{t("Explorer les offres", "Explore offers")}</span>
          </Link>
          <Link
            href="/kanban"
            className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>{t("Voir le Kanban", "View Kanban")}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── 4 Cartes KPIs Principaux ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1 : Postes Postulés */}
        <div className="p-5 sm:p-6 rounded-2xl border border-orange-200/80 dark:border-orange-900/40 bg-gradient-to-br from-white via-orange-50/20 to-orange-100/30 dark:from-stone-900 dark:via-stone-900 dark:to-orange-950/20 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
              {t("Postes Postulés", "Applied Positions")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black font-display text-stone-900 dark:text-white tracking-tight">
              {isLoading ? "—" : totalApplied}
            </span>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {t(
                  `${activeCount} candidature${activeCount > 1 ? "s" : ""} active${activeCount > 1 ? "s" : ""}`,
                  `${activeCount} active application${activeCount > 1 ? "s" : ""}`
                )}
              </span>
            </p>
          </div>
        </div>

        {/* KPI 2 : Entretiens Décrochés */}
        <div className="p-5 sm:p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
              {t("Entretiens Décrochés", "Interviews Secured")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black font-display text-amber-600 dark:text-amber-400 tracking-tight">
              {isLoading ? "—" : interviewCount}
            </span>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              {t(
                `Taux de convocation : ${interviewRate}%`,
                `Interview rate: ${interviewRate}%`
              )}
            </p>
          </div>
        </div>

        {/* KPI 3 : Taux de Réponse Recruteurs */}
        <div className="p-5 sm:p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
              {t("Taux de Réponse", "Response Rate")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black font-display text-emerald-600 dark:text-emerald-400 tracking-tight">
              {isLoading ? "—" : `${responseRate}%`}
            </span>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              {t(
                `${interviewCount + rejectedCount} réponse${interviewCount + rejectedCount > 1 ? "s" : ""} reçue${interviewCount + rejectedCount > 1 ? "s" : ""}`,
                `${interviewCount + rejectedCount} response${interviewCount + rejectedCount > 1 ? "s" : ""} received`
              )}
            </p>
          </div>
        </div>

        {/* KPI 4 : Offres Finales Obtenues */}
        <div className="p-5 sm:p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
              {t("Offres Finales", "Final Offers")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black font-display text-purple-600 dark:text-purple-400 tracking-tight">
              {isLoading ? "—" : offerCount}
            </span>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              {offerCount > 0
                ? t("Proposition reçue !", "Offer received!")
                : t("En cours d'obtention", "In progress")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Répartition Géographique du Vivier PFE (Radar Stats) ── */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span>{t("Répartition Géographique du Vivier", "Geographic Pool Distribution")}</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {t(
                "Distribution des opportunités consolidées selon les marchés cibles.",
                "Distribution of consolidated opportunities across target markets."
              )}
            </p>
          </div>
          <Link
            href="/radar"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>{t("Consulter dans le Radar", "View in Radar")}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Total Radar */}
          <Link
            href="/radar"
            className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-primary/40 shadow-xs transition-all group block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                {t("Total Vivier Radar", "Total Radar Pool")}
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono text-[11px] font-bold">
                ALL
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-3xl sm:text-4xl font-black font-display text-stone-900 dark:text-white tracking-tight">
                {isLoading ? "—" : geographicKPIs.total}
              </span>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                {t("100% · Vivier consolidé", "100% · Consolidated pool")}
              </p>
            </div>
          </Link>

          {/* France */}
          <Link
            href="/radar"
            className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-blue-500/40 shadow-xs transition-all group block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                {t("France", "France")}
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold">
                FR
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black font-display text-blue-600 dark:text-blue-400 tracking-tight">
                  {isLoading ? "—" : geographicKPIs.france.count}
                </span>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  ({geographicKPIs.france.percentage}%)
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 truncate">
                {t("Île-de-France & Régions", "Paris Region & Provinces")}
              </p>
            </div>
          </Link>

          {/* Tunisie */}
          <Link
            href="/radar"
            className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-emerald-500/40 shadow-xs transition-all group block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                {t("Tunisie", "Tunisia")}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                TN
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black font-display text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {isLoading ? "—" : geographicKPIs.tunisie.count}
                </span>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  ({geographicKPIs.tunisie.percentage}%)
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 truncate">
                {t("Grand Tunis & Pôles Tech", "Tunis & Tech Hubs")}
              </p>
            </div>
          </Link>

          {/* Europe & International */}
          <Link
            href="/radar"
            className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-purple-500/40 shadow-xs transition-all group block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                {t("Europe & International", "Europe & International")}
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-mono text-[11px] font-bold">
                EU+
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black font-display text-purple-600 dark:text-purple-400 tracking-tight">
                  {isLoading ? "—" : geographicKPIs.international.count}
                </span>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  ({geographicKPIs.international.percentage}%)
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 truncate">
                {geographicKPIs.international.breakdown.length > 0
                  ? geographicKPIs.international.breakdown.slice(0, 3).map((item) => `${item.badge} ${item.count}`).join(" • ")
                  : t("Allemagne, Suisse, UK, Nordics...", "Germany, Switzerland, UK, Nordics...")}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Graphiques Clés : Évolution Temporelle & Entonnoir de Conversion ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graphique 1 : Postulations au cours du temps (lg: 8 cols) */}
        <div className="lg:col-span-8 p-6 sm:p-7 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{t("Postulations au Cours du Temps", "Applications Over Time")}</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {t(
                  "Volume hebdomadaire de candidatures transmises aux recruteurs.",
                  "Weekly volume of applications sent to recruiters."
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                {t("6 dernières semaines", "Last 6 weeks")}
              </span>
            </div>
          </div>

          {/* Histogramme des candidatures */}
          <div className="pt-4">
            <div className="h-48 flex items-end justify-between gap-3 sm:gap-6 border-b border-stone-200 dark:border-stone-800 pb-2">
              {timelineData.map((d, index) => {
                const heightPercent = maxTimelineCount > 0 ? Math.max((d.count / maxTimelineCount) * 100, d.count > 0 ? 12 : 4) : 4;
                const isCurrentWeek = index === timelineData.length - 1;

                return (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </span>
                    <div className="w-full max-w-[42px] bg-stone-100 dark:bg-stone-800 rounded-t-xl h-full flex items-end p-1">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-lg transition-all duration-500 ${
                          d.count > 0
                            ? isCurrentWeek
                              ? "bg-primary shadow-xs shadow-orange-500/20"
                              : "bg-orange-400 dark:bg-orange-500/80"
                            : "bg-stone-200/60 dark:bg-stone-800"
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 truncate max-w-full">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-3 text-[11px] text-stone-500 dark:text-stone-400">
              <span>{t("Vélocité moyenne : ", "Average velocity: ")} <strong className="text-stone-800 dark:text-stone-200">{Math.round(totalApplied / 6)} / sem.</strong></span>
              <span>{t("Total période : ", "Period total: ")} <strong className="text-stone-800 dark:text-stone-200">{totalApplied} postulations</strong></span>
            </div>
          </div>
        </div>

        {/* Graphique 2 : Entonnoir & Répartition Marchés (lg: 4 cols) */}
        <div className="lg:col-span-4 p-6 sm:p-7 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
              {t("Entonnoir de Conversion", "Conversion Funnel")}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {t("Rendement des étapes du pipeline.", "Yield across pipeline stages.")}
            </p>
          </div>

          {/* Étapes Entonnoir */}
          <div className="space-y-3.5">
            {/* Étape 1 : Postulées */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300">
                <span>{t("1. Postulées", "1. Applied")}</span>
                <span>{totalApplied}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            {/* Étape 2 : Retours Reçus */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300">
                <span>{t("2. Retours Reçus", "2. Responses")}</span>
                <span>{interviewCount + rejectedCount}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(responseRate, 100)}%` }}
                />
              </div>
            </div>

            {/* Étape 3 : Entretiens */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300">
                <span>{t("3. Entretiens", "3. Interviews")}</span>
                <span>{interviewCount}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${Math.min(interviewRate, 100)}%` }}
                />
              </div>
            </div>

            {/* Étape 4 : Offres */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300">
                <span>{t("4. Offres Finales", "4. Offers")}</span>
                <span>{offerCount}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${totalApplied > 0 ? (offerCount / totalApplied) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Répartition géographique compacte */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-500">{t("Répartition :", "Distribution:")}</span>
            <div className="flex items-center gap-3 font-semibold">
              <span className="text-stone-800 dark:text-stone-200">FR: {locationStats.fr}</span>
              <span className="text-stone-800 dark:text-stone-200">TN: {locationStats.tn}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dernières Candidatures Envoyées ── */}
      {appliedJobs.length > 0 && (
        <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
              {t("Dernières Candidatures en Cours", "Recent Active Applications")}
            </h2>
            <Link
              href="/kanban"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>{t("Gérer le pipeline", "Manage pipeline")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {appliedJobs.slice(0, 5).map((job) => (
              <div key={job.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">{job.company}</span>
                    <span>•</span>
                    <span>{job.location || "France / Tunisie"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      job.status === "INTERVIEW"
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                        : job.status === "OFFER"
                        ? "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60"
                        : job.status === "REJECTED"
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
                        : "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60"
                    }`}
                  >
                    {job.status === "INTERVIEW"
                      ? t("Entretien", "Interview")
                      : job.status === "OFFER"
                      ? t("Offre reçue", "Offer")
                      : job.status === "REJECTED"
                      ? t("Refusé", "Rejected")
                      : t("Postulé", "Applied")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

