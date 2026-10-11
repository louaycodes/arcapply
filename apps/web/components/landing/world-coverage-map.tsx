"use client";

import React, { useState, useEffect, useRef } from "react";
import { Radar, Globe, CheckCheck, Sparkles, Building2, MapPin } from "lucide-react";
import { useAppLanguage } from "@/lib/language-context";

// ── All 27 Scraped Platform Logos (Pure Logos Only) ──
const SCRAPED_LOGOS: { id: string; logo: string; alt: string; country: "FR" | "TN" | "ALL" }[] = [
  // France (18)
  { id: "linkedin", logo: "/logos/sources/linkedin.png", alt: "LinkedIn", country: "FR" },
  { id: "wttj", logo: "/logos/sources/wttj.png", alt: "Welcome to the Jungle", country: "FR" },
  { id: "indeed", logo: "/logos/sources/indeed.png", alt: "Indeed", country: "FR" },
  { id: "hellowork", logo: "/logos/sources/hellowork.png", alt: "HelloWork", country: "FR" },
  { id: "apec", logo: "/logos/sources/apec.png", alt: "Apec", country: "FR" },
  { id: "cadremploi", logo: "/logos/sources/cadremploi.png", alt: "Cadremploi", country: "FR" },
  { id: "jobteaser", logo: "/logos/sources/jobteaser.png", alt: "JobTeaser", country: "FR" },
  { id: "letudiant", logo: "/logos/sources/letudiant.png", alt: "L'Étudiant", country: "FR" },
  { id: "stagiaires_fr", logo: "/logos/sources/stagiaires_fr.png", alt: "Stagiaires.fr", country: "FR" },
  { id: "1jeune1solution", logo: "/logos/sources/1jeune1solution.png", alt: "1 Jeune 1 Solution", country: "FR" },
  { id: "monster", logo: "/logos/sources/monster.png", alt: "Monster", country: "FR" },
  { id: "meteojob", logo: "/logos/sources/meteojob.png", alt: "Meteojob", country: "FR" },
  { id: "optioncarriere", logo: "/logos/sources/optioncarriere.png", alt: "OptionCarrière", country: "FR" },
  { id: "moovijob", logo: "/logos/sources/moovijob.png", alt: "Moovijob", country: "FR" },
  { id: "capdigital", logo: "/logos/sources/capdigital.png", alt: "Cap Digital", country: "FR" },
  { id: "chooseyourboss", logo: "/logos/sources/chooseyourboss.png", alt: "ChooseYourBoss", country: "FR" },
  { id: "esn_direct", logo: "/logos/sources/esn_direct.png", alt: "ESN Direct", country: "FR" },
  { id: "numeum", logo: "/logos/sources/numeum.png", alt: "Numeum", country: "FR" },
  // Tunisie (7)
  { id: "tanitjobs", logo: "/logos/sources/tanitjobs.png", alt: "Tanitjobs", country: "TN" },
  { id: "keejob", logo: "/logos/sources/keejob.png", alt: "Keejob", country: "TN" },
  { id: "emploitunisie", logo: "/logos/sources/emploitunisie.png", alt: "Emploi Tunisie", country: "TN" },
  { id: "aneti", logo: "/logos/sources/aneti.png", alt: "ANETI", country: "TN" },
  { id: "tunisietravail", logo: "/logos/sources/tunisietravail.png", alt: "Tunisie Travail", country: "TN" },
  { id: "stagetunisie", logo: "/logos/sources/stagetunisie.png", alt: "Stage Tunisie", country: "TN" },
  { id: "offre_emploi_tn", logo: "/logos/sources/offre_emploi_tn.png", alt: "Offre Emploi TN", country: "TN" },
  // Tech / Spécialisés
  { id: "stackoverflow_jobs", logo: "/logos/sources/stackoverflow_jobs.png", alt: "StackOverflow Jobs", country: "ALL" },
  { id: "top100_enterprises", logo: "/logos/sources/top100_enterprises.png", alt: "Top 100 IT", country: "ALL" },
];

export function WorldCoverageMap() {
  const { t } = useAppLanguage();
  const [activeCountry, setActiveCountry] = useState<"FR" | "TN" | null>(null);
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Load flat SVG map from static asset and enhance
  useEffect(() => {
    fetch("/brand/world-map.svg")
      .then((res) => res.text())
      .then((data) => {
        // Strip xml declaration and doctype if present
        const cleaned = data
          .replace(/<\?xml[\s\S]*?\?>/i, "")
          .replace(/<!DOCTYPE[\s\S]*?>/i, "");
        setSvgMarkup(cleaned);
      })
      .catch((err) => {
        console.error("Could not load world map SVG:", err);
      });
  }, []);

  // Hook hover events to #fr and #tn in the injected SVG
  useEffect(() => {
    if (!containerRef.current || !svgMarkup) return;

    const frEl = containerRef.current.querySelector("#fr");
    const tnEl = containerRef.current.querySelector("#tn");

    const onEnterFr = () => setActiveCountry("FR");
    const onLeaveFr = () => setActiveCountry(null);
    const onEnterTn = () => setActiveCountry("TN");
    const onLeaveTn = () => setActiveCountry(null);

    if (frEl) {
      frEl.addEventListener("mouseenter", onEnterFr);
      frEl.addEventListener("mouseleave", onLeaveFr);
    }
    if (tnEl) {
      tnEl.addEventListener("mouseenter", onEnterTn);
      tnEl.addEventListener("mouseleave", onLeaveTn);
    }

    return () => {
      if (frEl) {
        frEl.removeEventListener("mouseenter", onEnterFr);
        frEl.removeEventListener("mouseleave", onLeaveFr);
      }
      if (tnEl) {
        tnEl.removeEventListener("mouseenter", onEnterTn);
        tnEl.removeEventListener("mouseleave", onLeaveTn);
      }
    };
  }, [svgMarkup]);

  return (
    <section id="sources" className="py-24 bg-stone-100/60 dark:bg-[#141210] border-y border-stone-200/80 dark:border-stone-800 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 text-primary text-xs font-bold tracking-wide">
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>{t("Couverture Géographique Ciblée", "Targeted Geographic Coverage")}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-stone-900 dark:text-white leading-[1.15]">
            {t(
              "27 Plateformes & Portails Scrutés en Continu",
              "27 Platforms & Job Boards Monitored Continuously"
            )}
          </h2>

          <div className="w-16 h-1 bg-primary rounded-full mx-auto" />

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
            {t(
              "Le Radar ArcApply agrège, déduplique et filtre les opportunités de stages PFE et d'emploi d'ingénieur en France et en Tunisie avec synchronisation continue.",
              "ArcApply Radar continuously aggregates, deduplicates, and filters engineering internship and tech offers across France and Tunisia."
            )}
          </p>
        </div>

        {/* ── Flat World Map Container ── */}
        <div className="relative max-w-5xl mx-auto rounded-3xl border border-stone-200/90 dark:border-stone-800/90 bg-white dark:bg-[#181513] shadow-xl p-4 sm:p-8 overflow-hidden">
          
          {/* Top Telemetry Header inside Map */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800/80 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200 tracking-wider uppercase">
                {t("Réseau de Scraping Actif", "Active Scraping Network")} &bull; FR &bull; TN
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveCountry(activeCountry === "FR" ? null : "FR")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCountry === "FR"
                    ? "bg-[#EA580C] text-white shadow-sm"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-orange-500 border border-transparent"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                <span>France (18 Sources)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCountry(activeCountry === "TN" ? null : "TN")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCountry === "TN"
                    ? "bg-[#FF8A3D] text-white shadow-sm"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-orange-500 border border-transparent"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#FF8A3D]" />
                <span>Tunisie (7 Sources)</span>
              </button>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="relative w-full aspect-[784/458] flex items-center justify-center">
            
            {/* Scoped Map Styling for SVG */}
            <style>{`
              .arc-world-map svg {
                width: 100%;
                height: 100%;
                display: block;
              }
              .arc-world-map svg path,
              .arc-world-map svg g {
                fill: #CBD5E1;
                stroke: #94A3B8;
                stroke-width: 0.4px;
                stroke-opacity: 0.4;
                transition: fill 0.3s ease, filter 0.3s ease;
              }
              .dark .arc-world-map svg path,
              .dark .arc-world-map svg g {
                fill: #24201D;
                stroke: #38332E;
                stroke-width: 0.4px;
                stroke-opacity: 0.5;
              }
              /* Highlighted Country: France */
              .arc-world-map svg #fr path,
              .arc-world-map svg #fr {
                fill: #EA580C !important;
                stroke: #C2410C !important;
                stroke-width: 1.2px !important;
                stroke-opacity: 1 !important;
                filter: drop-shadow(0 0 14px rgba(234, 88, 12, 0.85)) drop-shadow(0 0 4px #EA580C);
                cursor: pointer;
              }
              .arc-world-map svg #fr:hover {
                fill: #FF7A29 !important;
              }
              /* Highlighted Country: Tunisia */
              .arc-world-map svg #tn,
              .arc-world-map svg path#tn {
                fill: #FF8A3D !important;
                stroke: #EA580C !important;
                stroke-width: 1.2px !important;
                stroke-opacity: 1 !important;
                filter: drop-shadow(0 0 14px rgba(255, 138, 61, 0.9)) drop-shadow(0 0 4px #FF8A3D);
                cursor: pointer;
              }
              .arc-world-map svg #tn:hover {
                fill: #FFA266 !important;
              }
            `}</style>

            {/* Injected SVG World Map */}
            <div
              ref={containerRef}
              className="arc-world-map w-full h-full"
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />

            {/* ── Overlay Radar Pulse Pins ── */}
            {/* France Pin (coordinates: 48.4% left, 35.6% top) */}
            <div
              className="absolute top-[35.6%] left-[48.4%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group"
              onClick={() => setActiveCountry("FR")}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-8 h-8 rounded-full bg-[#EA580C]/35 animate-ping" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#EA580C] border-2 border-white dark:border-stone-900 shadow-md" />
              </div>
            </div>

            {/* Tunisia Pin (coordinates: 50.5% left, 43.7% top) */}
            <div
              className="absolute top-[43.7%] left-[50.5%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group"
              onClick={() => setActiveCountry("TN")}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-7 h-7 rounded-full bg-[#FF8A3D]/40 animate-ping" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#FF8A3D] border-2 border-white dark:border-stone-900 shadow-md" />
              </div>
            </div>

            {/* ── Floating Interactive Telemetry Card (FR / TN) ── */}
            {activeCountry && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 p-4 rounded-2xl bg-white/95 dark:bg-[#1C1917]/95 backdrop-blur-xl border border-stone-200/90 dark:border-stone-700/80 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-20">
                <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        activeCountry === "FR" ? "bg-[#EA580C]" : "bg-[#FF8A3D]"
                      }`}
                    />
                    <h4 className="text-xs font-bold font-display text-stone-900 dark:text-white">
                      {activeCountry === "FR"
                        ? t("France · 18 Canaux Connectés", "France · 18 Connected Channels")
                        : t("Tunisie · 7 Portails Officiels", "Tunisia · 7 Official Portals")}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold">
                    {activeCountry}
                  </span>
                </div>

                <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed mb-3">
                  {activeCountry === "FR"
                    ? t(
                        "Scraping en continu des offres PFE et ingénieurs sur LinkedIn, Welcome to the Jungle, HelloWork, Apec, Cadremploi, JobTeaser, L'Étudiant, 1jeune1solution, etc.",
                        "Continuous scraping of engineering internships and entry roles on LinkedIn, Welcome to the Jungle, HelloWork, Apec, JobTeaser, etc."
                      )
                    : t(
                        "Indexation directe des plateformes d'ingénierie tunisiennes : Tanitjobs, Keejob, Emploi Tunisie, ANETI, Tunisie Travail, Stage Tunisie, etc.",
                        "Direct indexing of Tunisian engineering boards: Tanitjobs, Keejob, Emploi Tunisie, ANETI, Tunisie Travail, Stage Tunisie, etc."
                      )}
                </p>

                <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className="flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t("Déduplication sémantique active", "Semantic deduplication active")}</span>
                  </span>
                  <span className="text-stone-400">&bull; {t("Temps réel", "Real-time")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Metric Strip inside Map Container */}
          <div className="mt-6 pt-5 border-t border-stone-200 dark:border-stone-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xl sm:text-2xl font-black font-display text-[#EA580C]">27</p>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                {t("Sources Scrutées", "Monitored Sources")}
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black font-display text-stone-900 dark:text-white">FR &bull; TN</p>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                {t("Corridor France-Tunisie", "France-Tunisia Corridor")}
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black font-display text-emerald-600">100%</p>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                {t("Déduplication Sémantique", "Deduplicated Feed")}
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black font-display text-stone-900 dark:text-white">&lt; 300 ms</p>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                {t("Alignement ATS", "ATS Alignment Time")}
              </p>
            </div>
          </div>
        </div>

        {/* ── Infinite Marquee Ribbon of the 27 Scraped Platform Logos (Logos Only, No Names) ── */}
        <div className="space-y-4 pt-4">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {t("Flux Continu des Plateformes Partenaires", "Continuous Feed from Partner Platforms")}
            </span>
          </div>

          <style>{`
            @keyframes infiniteScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .arc-marquee-track {
              display: flex;
              width: max-content;
              animation: infiniteScroll 40s linear infinite;
            }
            .arc-marquee-track:hover {
              animation-play-state: paused;
            }
          `}</style>

          <div className="relative overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="arc-marquee-track gap-5 items-center">
              {/* Duplicate array for seamless infinite marquee loop */}
              {[...SCRAPED_LOGOS, ...SCRAPED_LOGOS].map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="h-16 w-32 rounded-2xl bg-white dark:bg-[#1a1714] border border-stone-200/90 dark:border-stone-800 shadow-xs hover:border-orange-500/60 hover:shadow-md transition-all duration-200 p-2.5 flex items-center justify-center shrink-0 group cursor-pointer"
                  title={item.alt}
                >
                  <img
                    src={item.logo}
                    alt={item.alt}
                    className="max-h-9 max-w-[85px] object-contain transition-all duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
