"use client";

import React, { useState, useEffect, useRef } from "react";
import { Globe, CheckCheck, Sparkles, Building2, MapPin, ExternalLink } from "lucide-react";
import { useAppLanguage } from "@/lib/language-context";

export interface ScrapedCountryInfo {
  code: string; // ISO 2-letter lowercase for SVG element id
  isoCode: string; // ISO uppercase (e.g. FR, DE)
  nameFr: string;
  nameEn: string;
  sourcesCount: number;
  sampleSources: string[];
  descriptionFr: string;
  descriptionEn: string;
}

export const SCRAPED_COUNTRIES: Record<string, ScrapedCountryInfo> = {
  fr: {
    code: "fr",
    isoCode: "FR",
    nameFr: "France",
    nameEn: "France",
    sourcesCount: 18,
    sampleSources: ["LinkedIn", "Welcome to the Jungle", "HelloWork", "Apec", "JobTeaser", "Cadremploi"],
    descriptionFr: "Scraping continu des offres PFE et ingénieurs sur les plus grands portails carrières français.",
    descriptionEn: "Continuous scraping of engineering internships and entry-level positions on French job boards.",
  },
  tn: {
    code: "tn",
    isoCode: "TN",
    nameFr: "Tunisie",
    nameEn: "Tunisia",
    sourcesCount: 8,
    sampleSources: ["Tanitjobs", "Keejob", "Emploi Tunisie", "ANETI", "Tunisie Travail", "Stage Tunisie"],
    descriptionFr: "Indexation directe et exhaustive des portails d'ingénierie et d'emploi tunisiens.",
    descriptionEn: "Direct and exhaustive indexing of Tunisian engineering and internship boards.",
  },
  de: {
    code: "de",
    isoCode: "DE",
    nameFr: "Allemagne",
    nameEn: "Germany",
    sourcesCount: 7,
    sampleSources: ["Praktikum.info", "Arbeitsagentur", "Xing", "StepStone DE", "MeinPraktikum", "Praktika.de"],
    descriptionFr: "Exploration des portails spécialisés dans les stages d'ingénieurs (Praktikum & Werkstudent) en Allemagne.",
    descriptionEn: "Deep coverage of German engineering internship portals and university job networks.",
  },
  ch: {
    code: "ch",
    isoCode: "CH",
    nameFr: "Suisse",
    nameEn: "Switzerland",
    sourcesCount: 7,
    sampleSources: ["Jobs.ch", "SwissDevJobs", "Jobup.ch", "EPFL Jobs", "ETHZ Jobs", "ICTjobs.ch"],
    descriptionFr: "Couverture ciblée des hubs technologiques suisses (Zurich, Genève, Lausanne, EPFL/ETHZ).",
    descriptionEn: "Targeted coverage of Swiss tech hubs and top polytechnic institutes.",
  },
  gb: {
    code: "gb",
    isoCode: "GB",
    nameFr: "Royaume-Uni",
    nameEn: "United Kingdom",
    sourcesCount: 8,
    sampleSources: ["Gradcracker", "Prospects", "RateMyPlacement", "Bright Network", "Gov UK", "S1jobs"],
    descriptionFr: "Portails leaders des graduate schemes et internships d'ingénierie au Royaume-Uni.",
    descriptionEn: "Leading STEM graduate schemes and placement aggregators across the UK.",
  },
  be: {
    code: "be",
    isoCode: "BE",
    nameFr: "Belgique",
    nameEn: "Belgium",
    sourcesCount: 8,
    sampleSources: ["Student.be", "Actiris", "VDAB", "Le Forem", "Jobat", "StepStone BE", "MonPremierJob"],
    descriptionFr: "Portails régionaux et nationaux pour les stages et premiers emplois en Belgique.",
    descriptionEn: "Regional and national platforms for Belgian student internships and junior tech roles.",
  },
  nl: {
    code: "nl",
    isoCode: "NL",
    nameFr: "Pays-Bas",
    nameEn: "Netherlands",
    sourcesCount: 7,
    sampleSources: ["Magnet.me", "YoungCapital", "Nationale Vacaturebank", "Intermediair", "Stage.nl", "IamExpat NL"],
    descriptionFr: "Plateformes néerlandaises de stages technologiques et d'emplois pour étudiants internationaux.",
    descriptionEn: "Dutch tech placement boards and international student internship engines.",
  },
  lu: {
    code: "lu",
    isoCode: "LU",
    nameFr: "Luxembourg",
    nameEn: "Luxembourg",
    sourcesCount: 4,
    sampleSources: ["Jobs.lu", "Jobfinder.lu", "ADEM", "ICTjob.lu"],
    descriptionFr: "Indexation des opportunités fintech, IT et institutions au Luxembourg.",
    descriptionEn: "Direct aggregation of Luxembourg fintech, IT, and institutional opportunities.",
  },
  es: {
    code: "es",
    isoCode: "ES",
    nameFr: "Espagne",
    nameEn: "Spain",
    sourcesCount: 6,
    sampleSources: ["InfoJobs ES", "Primer Empleo", "Tecnoempleo", "StudentJob ES", "Empléate", "Feina Activa"],
    descriptionFr: "Canaux espagnols d'insertion pour ingénieurs et développeurs en Espagne.",
    descriptionEn: "Spanish engineering job boards and university graduate placement channels.",
  },
  it: {
    code: "it",
    isoCode: "IT",
    nameFr: "Italie",
    nameEn: "Italy",
    sourcesCount: 4,
    sampleSources: ["AlmaLaurea", "Cliclavoro", "InfoJobs IT", "Monster IT"],
    descriptionFr: "Consortium universitaire AlmaLaurea et portails officiels d'ingénierie en Italie.",
    descriptionEn: "Italian university consortium boards and tech employment hubs.",
  },
  no: {
    code: "no",
    isoCode: "NO",
    nameFr: "Norvège",
    nameEn: "Norway",
    sourcesCount: 4,
    sampleSources: ["NAV Norvège", "FINN.no", "Jobbnorge", "The Hub"],
    descriptionFr: "API officielle NAV de l'État norvégien et portail national FINN.no pour l'ingénierie nordique.",
    descriptionEn: "Official Norwegian government NAV API and national FINN.no board for Nordic tech.",
  },
  se: {
    code: "se",
    isoCode: "SE",
    nameFr: "Suède",
    nameEn: "Sweden",
    sourcesCount: 3,
    sampleSources: ["JobTech Suède (Arbetsförmedlingen)", "Academic Work", "Jobbsafari"],
    descriptionFr: "API ouverte JobTech Sweden et réseaux universitaires suédois.",
    descriptionEn: "Open API JobTech Sweden and Swedish graduate employment networks.",
  },
  dk: {
    code: "dk",
    isoCode: "DK",
    nameFr: "Danemark",
    nameEn: "Denmark",
    sourcesCount: 4,
    sampleSources: ["WorkInDenmark", "Jobindex", "Jobnet", "Graduateland"],
    descriptionFr: "Réseaux officiels et portails étudiants scandinaves au Danemark.",
    descriptionEn: "Official portals and Scandinavian student networks in Denmark.",
  },
  fi: {
    code: "fi",
    isoCode: "FI",
    nameFr: "Finlande",
    nameEn: "Finland",
    sourcesCount: 4,
    sampleSources: ["Duunitori", "JobMarket Finland", "Jobly Finland", "Academic Positions"],
    descriptionFr: "Écosystème technologique finlandais et portails de recherche et d'ingénierie.",
    descriptionEn: "Finnish tech ecosystem and STEM research/placement networks.",
  },
  ie: {
    code: "ie",
    isoCode: "IE",
    nameFr: "Irlande",
    nameEn: "Ireland",
    sourcesCount: 4,
    sampleSources: ["IrishJobs", "GradIreland", "Jobs.ie", "JobsIreland"],
    descriptionFr: "Hub technologique de Dublin et portails d'ingénierie en Irlande.",
    descriptionEn: "Dublin tech hub and Irish university graduate networks.",
  },
  pl: {
    code: "pl",
    isoCode: "PL",
    nameFr: "Pologne",
    nameEn: "Poland",
    sourcesCount: 6,
    sampleSources: ["No Fluff Jobs", "Just Join IT", "Pracuj.pl", "RocketJobs", "Absolvent", "GoWork"],
    descriptionFr: "Portails tech transparents et réseaux juniors en Pologne.",
    descriptionEn: "Transparent tech salary boards and graduate portals across Poland.",
  },
  ro: {
    code: "ro",
    isoCode: "RO",
    nameFr: "Roumanie",
    nameEn: "Romania",
    sourcesCount: 6,
    sampleSources: ["eJobs.ro", "BestJobs", "Hipo.ro", "Stagii pe Bune", "Undelucram", "OLX RO"],
    descriptionFr: "Plateformes spécialisées stages IT et ingénierie en Roumanie.",
    descriptionEn: "Specialized IT internship platforms and engineering boards in Romania.",
  },
  hu: {
    code: "hu",
    isoCode: "HU",
    nameFr: "Hongrie",
    nameEn: "Hungary",
    sourcesCount: 4,
    sampleSources: ["Profession.hu", "Zyntern", "DreamJobs", "CVonline.hu"],
    descriptionFr: "Réseau de stages et premiers emplois technologiques en Hongrie.",
    descriptionEn: "Tech internship and entry-level talent networks in Hungary.",
  },
  lt: {
    code: "lt",
    isoCode: "LT",
    nameFr: "Lituanie",
    nameEn: "Lithuania",
    sourcesCount: 4,
    sampleSources: ["Work in Lithuania", "CVbankas", "CVonline LT", "CVmarket LT"],
    descriptionFr: "Portail officiel d'attraction de talents tech et job boards baltes.",
    descriptionEn: "Official international talent portal and Baltic tech boards.",
  },
  lv: {
    code: "lv",
    isoCode: "LV",
    nameFr: "Lettonie",
    nameEn: "Latvia",
    sourcesCount: 4,
    sampleSources: ["CV.lv", "Visidarbi", "WorkingDay", "CVmarket LV"],
    descriptionFr: "Principaux agrégateurs d'emplois et carrières en Lettonie.",
    descriptionEn: "Leading employment aggregators and career hubs in Latvia.",
  },
  ee: {
    code: "ee",
    isoCode: "EE",
    nameFr: "Estonie",
    nameEn: "Estonia",
    sourcesCount: 2,
    sampleSources: ["EURES Estonie", "Top Tech Hubs"],
    descriptionFr: "Écosystème numérique et startups technologiques d'Estonie.",
    descriptionEn: "Estonian digital and startup ecosystem.",
  },
  at: {
    code: "at",
    isoCode: "AT",
    nameFr: "Autriche",
    nameEn: "Austria",
    sourcesCount: 3,
    sampleSources: ["EURES Autriche", "Arbeitsagentur AT", "Portails DACH"],
    descriptionFr: "Portails DACH et opportunités de stages industriels en Autriche.",
    descriptionEn: "DACH regional networks and industrial tech internships in Austria.",
  },
  pt: {
    code: "pt",
    isoCode: "PT",
    nameFr: "Portugal",
    nameEn: "Portugal",
    sourcesCount: 4,
    sampleSources: ["EURES Portugal", "InfoJobs PT", "Rede de Talentos"],
    descriptionFr: "Hubs de Lisbonne et Porto pour les carrières d'ingénieurs.",
    descriptionEn: "Lisbon and Porto tech hubs for engineering graduates.",
  },
  cz: {
    code: "cz",
    isoCode: "CZ",
    nameFr: "Tchéquie",
    nameEn: "Czechia",
    sourcesCount: 3,
    sampleSources: ["EURES Tchéquie", "StartupJobs CZ", "Tech Portals"],
    descriptionFr: "Écosystème technologique et industriel de Prague et Brno.",
    descriptionEn: "Tech and engineering ecosystem across Prague and Brno.",
  },
  gr: {
    code: "gr",
    isoCode: "GR",
    nameFr: "Grèce",
    nameEn: "Greece",
    sourcesCount: 4,
    sampleSources: ["Kariera.gr", "Skywalker.gr", "Jobfind.gr", "Workathlon"],
    descriptionFr: "Portails d'emploi et opportunités tech en Grèce.",
    descriptionEn: "Leading job portals and tech hubs in Greece.",
  },
  bg: {
    code: "bg",
    isoCode: "BG",
    nameFr: "Bulgarie",
    nameEn: "Bulgaria",
    sourcesCount: 4,
    sampleSources: ["Jobs.bg", "Dev.bg", "JobTiger", "Zaplata.bg"],
    descriptionFr: "Pôle informatique de Sofia et portails d'ingénierie logicielle bulgares.",
    descriptionEn: "Sofia software engineering hubs and Bulgarian tech networks.",
  },
  hr: {
    code: "hr",
    isoCode: "HR",
    nameFr: "Croatie",
    nameEn: "Croatia",
    sourcesCount: 3,
    sampleSources: ["MojPosao", "Posao.hr", "PickJobs"],
    descriptionFr: "Portails leaders des offres de stage et emploi en Croatie.",
    descriptionEn: "Leading internship and junior employment boards in Croatia.",
  },
  rs: {
    code: "rs",
    isoCode: "RS",
    nameFr: "Serbie",
    nameEn: "Serbia",
    sourcesCount: 4,
    sampleSources: ["Infostud", "HelloWorld.rs", "Startuj", "Joberty"],
    descriptionFr: "Portails d'ingénieurs et plateformes juniors en Serbie.",
    descriptionEn: "Developer and graduate engineering platforms in Serbia.",
  },
  ua: {
    code: "ua",
    isoCode: "UA",
    nameFr: "Ukraine",
    nameEn: "Ukraine",
    sourcesCount: 5,
    sampleSources: ["DOU.ua", "Djinni", "Robota.ua", "Work.ua", "Happy Monday"],
    descriptionFr: "Communautés de développeurs DOU, plateformes tech Djinni et portails nationaux.",
    descriptionEn: "Developer communities DOU, Djinni tech network, and national aggregators.",
  },
  sk: {
    code: "sk",
    isoCode: "SK",
    nameFr: "Slovaquie",
    nameEn: "Slovakia",
    sourcesCount: 2,
    sampleSources: ["EURES Slovaquie", "Regional Tech Portals"],
    descriptionFr: "Opportunités industrielles et tech en Slovaquie.",
    descriptionEn: "Industrial tech and engineering placements in Slovakia.",
  },
  si: {
    code: "si",
    isoCode: "SI",
    nameFr: "Slovénie",
    nameEn: "Slovakia",
    sourcesCount: 2,
    sampleSources: ["EURES Slovénie", "Regional IT Boards"],
    descriptionFr: "Pôle d'innovation et entreprises technologiques slovènes.",
    descriptionEn: "Innovation hubs and technology employers in Slovenia.",
  },
  al: {
    code: "al",
    isoCode: "AL",
    nameFr: "Albanie",
    nameEn: "Albania",
    sourcesCount: 2,
    sampleSources: ["duapune", "njoftime"],
    descriptionFr: "Portails carrières des Balkans et de l'espace adriatique.",
    descriptionEn: "Career portals in the Adriatic and Western Balkans.",
  },
  is: {
    code: "is",
    isoCode: "IS",
    nameFr: "Islande",
    nameEn: "Iceland",
    sourcesCount: 2,
    sampleSources: ["EURES Islande", "Nordic Networks"],
    descriptionFr: "Opportunités tech et recherche dans l'espace nordique.",
    descriptionEn: "Nordic engineering and green tech internships.",
  },
  cy: {
    code: "cy",
    isoCode: "CY",
    nameFr: "Chypre",
    nameEn: "Cyprus",
    sourcesCount: 2,
    sampleSources: ["EURES Chypre", "Mediterranean Tech"],
    descriptionFr: "Hub technologique et maritime de la Méditerranée orientale.",
    descriptionEn: "Eastern Mediterranean technology and engineering hubs.",
  },
  mt: {
    code: "mt",
    isoCode: "MT",
    nameFr: "Malte",
    nameEn: "Malta",
    sourcesCount: 2,
    sampleSources: ["EURES Malte", "Mediterranean Tech"],
    descriptionFr: "Écosystème technologique, fintech et gaming à Malte.",
    descriptionEn: "Malta tech, fintech, and digital engineering network.",
  },
};

// ── All 30+ Featured Platform Logos for Infinite Marquee ──
const SCRAPED_LOGOS: { id: string; logo: string; alt: string; country: string }[] = [
  { id: "linkedin", logo: "/logos/sources/linkedin.png", alt: "LinkedIn", country: "ALL" },
  { id: "wttj", logo: "/logos/sources/wttj.png", alt: "Welcome to the Jungle", country: "FR" },
  { id: "indeed", logo: "/logos/sources/indeed.png", alt: "Indeed", country: "ALL" },
  { id: "hellowork", logo: "/logos/sources/hellowork.png", alt: "HelloWork", country: "FR" },
  { id: "apec", logo: "/logos/sources/apec.png", alt: "Apec", country: "FR" },
  { id: "jobteaser", logo: "/logos/sources/jobteaser.png", alt: "JobTeaser", country: "FR" },
  { id: "cadremploi", logo: "/logos/sources/cadremploi.png", alt: "Cadremploi", country: "FR" },
  { id: "tanitjobs", logo: "/logos/sources/tanitjobs.png", alt: "Tanitjobs", country: "TN" },
  { id: "keejob", logo: "/logos/sources/keejob.png", alt: "Keejob", country: "TN" },
  { id: "emploitunisie", logo: "/logos/sources/emploitunisie.png", alt: "Emploi Tunisie", country: "TN" },
  { id: "praktikum_info", logo: "/logos/sources/praktikum_info.png", alt: "Praktikum.info", country: "DE" },
  { id: "arbeitsagentur", logo: "/logos/sources/arbeitsagentur.png", alt: "Arbeitsagentur", country: "DE" },
  { id: "xing_jobs", logo: "/logos/sources/xing_jobs.png", alt: "Xing", country: "DE" },
  { id: "jobs_ch", logo: "/logos/sources/jobs_ch.png", alt: "Jobs.ch", country: "CH" },
  { id: "swissdevjobs", logo: "/logos/sources/swissdevjobs.png", alt: "SwissDevJobs", country: "CH" },
  { id: "nav_norway", logo: "/logos/sources/nav_norway.png", alt: "NAV Norvège", country: "NO" },
  { id: "finn_no", logo: "/logos/sources/finn_no.png", alt: "FINN.no", country: "NO" },
  { id: "jobtech_sweden", logo: "/logos/sources/jobtech_sweden.png", alt: "JobTech Sweden", country: "SE" },
  { id: "gradcracker", logo: "/logos/sources/gradcracker.png", alt: "Gradcracker", country: "GB" },
  { id: "prospects", logo: "/logos/sources/prospects.png", alt: "Prospects", country: "GB" },
  { id: "student_be", logo: "/logos/sources/student_be.png", alt: "Student.be", country: "BE" },
  { id: "magnet_me", logo: "/logos/sources/magnet_me.png", alt: "Magnet.me", country: "NL" },
  { id: "jobs_lu", logo: "/logos/sources/jobs_lu.png", alt: "Jobs.lu", country: "LU" },
  { id: "infojobs_es", logo: "/logos/sources/infojobs_es.png", alt: "InfoJobs", country: "ES" },
  { id: "almalaurea", logo: "/logos/sources/almalaurea.png", alt: "AlmaLaurea", country: "IT" },
  { id: "nofluffjobs", logo: "/logos/sources/nofluffjobs.png", alt: "No Fluff Jobs", country: "PL" },
  { id: "justjoin_it", logo: "/logos/sources/justjoin_it.png", alt: "Just Join IT", country: "PL" },
  { id: "ejobs_ro", logo: "/logos/sources/ejobs_ro.png", alt: "eJobs", country: "RO" },
  { id: "eures", logo: "/logos/sources/eures.png", alt: "EURES", country: "ALL" },
  { id: "top100_enterprises", logo: "/logos/sources/top100_enterprises.png", alt: "Top 100 IT", country: "ALL" },
];

export function WorldCoverageMap() {
  const { t, language } = useAppLanguage();
  const [activeCountry, setActiveCountry] = useState<string | null>("FR");
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    country: ScrapedCountryInfo | null;
    x: number;
    y: number;
  }>({
    visible: false,
    country: null,
    x: 0,
    y: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Load flat SVG map from static asset and clean headers
  useEffect(() => {
    fetch("/brand/world-map.svg")
      .then((res) => res.text())
      .then((data) => {
        const cleaned = data
          .replace(/<\?xml[\s\S]*?\?>/i, "")
          .replace(/<!DOCTYPE[\s\S]*?>/i, "");
        setSvgMarkup(cleaned);
      })
      .catch((err) => {
        console.error("Could not load world map SVG:", err);
      });
  }, []);

  // Hook hover and click events across all scraped countries in the injected SVG
  useEffect(() => {
    if (!containerRef.current || !svgMarkup) return;

    const container = containerRef.current;
    const svgEl = container.querySelector("svg");
    if (!svgEl) return;

    const cleanups: (() => void)[] = [];

    Object.entries(SCRAPED_COUNTRIES).forEach(([code, countryData]) => {
      const el = svgEl.querySelector(`#${code}`) as SVGElement | null;
      if (!el) return;

      // Add identifier attribute & class to target via CSS
      el.setAttribute("data-scraped", "true");
      el.classList.add("arc-scraped-country");
      el.querySelectorAll("path").forEach((p) => {
        p.setAttribute("data-scraped", "true");
        p.classList.add("arc-scraped-country");
      });

      const handleMouseEnter = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        const rect = container.getBoundingClientRect();
        setTooltip({
          visible: true,
          country: countryData,
          x: mouseEvent.clientX - rect.left,
          y: mouseEvent.clientY - rect.top,
        });
        setHoveredCountry(code);
      };

      const handleMouseMove = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        const rect = container.getBoundingClientRect();
        setTooltip((prev) => ({
          ...prev,
          visible: true,
          country: countryData,
          x: mouseEvent.clientX - rect.left,
          y: mouseEvent.clientY - rect.top,
        }));
      };

      const handleMouseLeave = () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
        setHoveredCountry(null);
      };

      const handleClick = () => {
        setActiveCountry(countryData.isoCode);
      };

      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mousemove", handleMouseMove);
      el.addEventListener("mouseleave", handleMouseLeave);
      el.addEventListener("click", handleClick);

      cleanups.push(() => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mousemove", handleMouseMove);
        el.removeEventListener("mouseleave", handleMouseLeave);
        el.removeEventListener("click", handleClick);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [svgMarkup]);

  // Active country details for telemetry card
  const selectedCountryData =
    (activeCountry &&
      Object.values(SCRAPED_COUNTRIES).find(
        (c) => c.isoCode.toLowerCase() === activeCountry.toLowerCase()
      )) ||
    SCRAPED_COUNTRIES.fr;

  // Generate CSS selector for all scraped countries
  const scrapedIdsSelector = Object.keys(SCRAPED_COUNTRIES)
    .map((code) => `.arc-world-map svg #${code}, .arc-world-map svg #${code} path`)
    .join(",\n");

  return (
    <section id="sources" className="py-24 bg-stone-100/60 dark:bg-[#141210] border-y border-stone-200/80 dark:border-stone-800 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 text-primary text-xs font-bold tracking-wide">
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>{t("Couverture Géographique Européenne", "European Geographic Coverage")}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-stone-900 dark:text-white leading-[1.15]">
            {t(
              "161 Plateformes & Portails Scrutés en Continu",
              "161 Platforms & Job Boards Monitored Continuously"
            )}
          </h2>

          <div className="w-16 h-1 bg-primary rounded-full mx-auto" />

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
            {t(
              "Le Radar ArcApply agrège, déduplique et filtre les opportunités de stages PFE et d'emploi d'ingénieur en France, en Tunisie et dans plus de 33 pays européens avec synchronisation continue.",
              "ArcApply Radar continuously aggregates, deduplicates, and filters engineering internship and tech offers across France, Tunisia, and over 33 European countries."
            )}
          </p>
        </div>

        {/* ── Flat World Map Container ── */}
        <div className="relative max-w-5xl mx-auto rounded-3xl border border-stone-200/90 dark:border-stone-800/90 bg-white dark:bg-[#181513] shadow-xl p-4 sm:p-8 overflow-hidden">
          
          {/* Top Telemetry Header inside Map */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800/80 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200 tracking-wider uppercase">
                {t("Réseau de Scraping Actif", "Active Scraping Network")} &bull; 161 {t("Sources", "Sources")} &bull; 35 {t("Pays", "Countries")}
              </span>
            </div>

            {/* Quick Country Hub Selectors */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {[
                { code: "FR", label: "France", count: 18 },
                { code: "TN", label: "Tunisie", count: 8 },
                { code: "DE", label: "Allemagne", count: 7 },
                { code: "CH", label: "Suisse", count: 7 },
                { code: "GB", label: "UK", count: 8 },
                { code: "NO", label: "Norvège", count: 4 },
                { code: "SE", label: "Suède", count: 3 },
                { code: "BE", label: "Belgique", count: 8 },
              ].map((hub) => {
                const isSelected = activeCountry === hub.code;
                return (
                  <button
                    key={hub.code}
                    type="button"
                    onClick={() => setActiveCountry(isSelected ? null : hub.code)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-orange-500 border border-transparent"
                    }`}
                  >
                    <span>{hub.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {hub.count}
                    </span>
                  </button>
                );
              })}
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

              /* Unscraped base countries (neutral stone / slate) */
              .arc-world-map svg path,
              .arc-world-map svg g {
                fill: #CBD5E1;
                stroke: #94A3B8;
                stroke-width: 0.4px;
                stroke-opacity: 0.4;
                transition: fill 0.25s ease, stroke 0.25s ease, filter 0.25s ease;
              }
              .dark .arc-world-map svg path,
              .dark .arc-world-map svg g {
                fill: #221F1D;
                stroke: #35302C;
                stroke-width: 0.4px;
                stroke-opacity: 0.4;
              }

              /* ── Highlighted Scraped Countries (Vibrant Arc Theme Color Directly on Map) ── */
              ${scrapedIdsSelector},
              .arc-world-map svg .arc-scraped-country,
              .arc-world-map svg .arc-scraped-country path,
              .arc-world-map svg [data-scraped="true"],
              .arc-world-map svg [data-scraped="true"] path {
                fill: #EA580C !important;
                stroke: #C2410C !important;
                stroke-width: 0.8px !important;
                stroke-opacity: 0.95 !important;
                cursor: pointer;
                transition: fill 0.2s ease, stroke 0.2s ease, filter 0.2s ease;
              }

              .dark .arc-world-map svg .arc-scraped-country,
              .dark .arc-world-map svg .arc-scraped-country path,
              .dark ${scrapedIdsSelector} {
                fill: #EA580C !important;
                stroke: #9A3412 !important;
                stroke-width: 0.8px !important;
                stroke-opacity: 0.95 !important;
              }

              /* ── Hover Interaction: Country Highlights & Glows ── */
              .arc-world-map svg .arc-scraped-country:hover,
              .arc-world-map svg .arc-scraped-country:hover path,
              .arc-world-map svg [data-scraped="true"]:hover,
              .arc-world-map svg [data-scraped="true"]:hover path {
                fill: #FF8A3D !important;
                stroke: #FFFFFF !important;
                stroke-width: 1.4px !important;
                stroke-opacity: 1 !important;
                filter: drop-shadow(0 0 10px rgba(234, 88, 12, 0.85)) drop-shadow(0 0 3px #FF8A3D) !important;
              }

              .dark .arc-world-map svg .arc-scraped-country:hover,
              .dark .arc-world-map svg .arc-scraped-country:hover path,
              .dark .arc-world-map svg [data-scraped="true"]:hover,
              .dark .arc-world-map svg [data-scraped="true"]:hover path {
                fill: #FB923C !important;
                stroke: #FFFFFF !important;
                stroke-width: 1.4px !important;
                stroke-opacity: 1 !important;
                filter: drop-shadow(0 0 12px rgba(251, 146, 60, 0.9)) drop-shadow(0 0 4px #FB923C) !important;
              }
            `}</style>

            {/* Injected SVG World Map */}
            <div
              ref={containerRef}
              className="arc-world-map w-full h-full relative"
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />

            {/* ── Hover Tooltip: Appears when hovering over any scraped country ── */}
            {tooltip.visible && tooltip.country && (
              <div
                style={{
                  left: `${tooltip.x}px`,
                  top: `${tooltip.y}px`,
                  transform: tooltip.y < 90 ? "translate(-50%, 15px)" : "translate(-50%, -115%)",
                  pointerEvents: "none",
                }}
                className="absolute z-30 transition-transform duration-75 ease-out"
              >
                <div className="px-3.5 py-2.5 rounded-xl bg-stone-900/95 dark:bg-[#1C1917]/95 text-white backdrop-blur-md border border-orange-500/40 shadow-xl min-w-[200px] max-w-[260px] animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold font-display text-white">
                      {language === "en" ? tooltip.country.nameEn : tooltip.country.nameFr}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {tooltip.country.isoCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-orange-400 font-bold mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span>
                      {tooltip.country.sourcesCount}{" "}
                      {t("sources scrapées", "scraped sources")}
                    </span>
                  </div>

                  <div className="text-[10px] text-stone-300 leading-tight truncate">
                    {tooltip.country.sampleSources.slice(0, 3).join(" • ")}
                  </div>
                </div>
              </div>
            )}

            {/* ── Floating Interactive Telemetry Card (Active / Selected Country) ── */}
            {selectedCountryData && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-84 p-4 rounded-2xl bg-white/95 dark:bg-[#1C1917]/95 backdrop-blur-xl border border-stone-200/90 dark:border-stone-700/80 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-20">
                <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <h4 className="text-xs font-bold font-display text-stone-900 dark:text-white">
                      {language === "en" ? selectedCountryData.nameEn : selectedCountryData.nameFr} &bull; {selectedCountryData.sourcesCount} {t("Canaux Connectés", "Connected Channels")}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold">
                    {selectedCountryData.isoCode}
                  </span>
                </div>

                <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed mb-3">
                  {language === "en" ? selectedCountryData.descriptionEn : selectedCountryData.descriptionFr}
                </p>

                {/* Sample platform badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {selectedCountryData.sampleSources.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>

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
              <p className="text-xl sm:text-2xl font-black font-display text-primary">161</p>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                {t("Sources Scrutées", "Monitored Sources")}
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black font-display text-stone-900 dark:text-white">35 {t("Pays", "Countries")}</p>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                {t("Couverture Européenne & TN", "European & TN Coverage")}
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

        {/* ── Infinite Marquee Ribbon of Scraped Platform Logos (Logos Only, No Names) ── */}
        <div className="space-y-4 pt-4">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {t("Flux Continu des 161 Plateformes Scrutées", "Continuous Feed from 161 Monitored Platforms")}
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
              animation: infiniteScroll 45s linear infinite;
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
