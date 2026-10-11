"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Radar,
  Sparkles,
  FileText,
  KanbanSquare,
  KeyRound,
  CheckCircle2,
  Target,
  Zap,
  Building2,
  Globe,
  Mail,
  HelpCircle,
  Send,
  ArrowRight,
  ChevronDown,
  Check,
  X,
  Lock,
  UserPlus,
  LogIn,
  Sliders,
  Cpu,
  Layers,
  Award,
  Search,
  MessageSquare,
  Bot,
  ExternalLink,
  MapPin,
  Phone,
  Linkedin,
  Github,
  Clock,
  Briefcase,
  Flame,
  CheckCheck,
  RefreshCw,
  Compass,
} from "lucide-react";
import { useAppLanguage } from "@/lib/language-context";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { LoginForm } from "@/components/auth/login-form";

// ── Official Scraping Sources Data (27 Platforms France & Tunisie) ──
interface SourceItem {
  id: string;
  name: string;
  logo: string;
  country: "FR" | "TN" | "ALL";
  category: "Généraliste" | "Spécialisé Tech" | "Officiel / Institutionnel" | "Stages & Jeunes";
  tag: string;
}

const ALL_SOURCES: SourceItem[] = [
  // France
  { id: "linkedin", name: "LinkedIn", logo: "/logos/sources/linkedin.png", country: "FR", category: "Généraliste", tag: "Tech & Corporate" },
  { id: "wttj", name: "Welcome to the Jungle", logo: "/logos/sources/wttj.png", country: "FR", category: "Spécialisé Tech", tag: "Startups & Scaleups" },
  { id: "indeed", name: "Indeed", logo: "/logos/sources/indeed.png", country: "FR", category: "Généraliste", tag: "Flux Continu" },
  { id: "hellowork", name: "HelloWork", logo: "/logos/sources/hellowork.png", country: "FR", category: "Généraliste", tag: "France Régions" },
  { id: "apec", name: "Apec", logo: "/logos/sources/apec.png", country: "FR", category: "Spécialisé Tech", tag: "Cadres & Ingénieurs" },
  { id: "cadremploi", name: "Cadremploi", logo: "/logos/sources/cadremploi.png", country: "FR", category: "Spécialisé Tech", tag: "Management & IT" },
  { id: "jobteaser", name: "JobTeaser", logo: "/logos/sources/jobteaser.png", country: "FR", category: "Stages & Jeunes", tag: "Grandes Écoles" },
  { id: "letudiant", name: "L'Étudiant", logo: "/logos/sources/letudiant.png", country: "FR", category: "Stages & Jeunes", tag: "Stages PFE" },
  { id: "stagiaires_fr", name: "Stagiaires.fr", logo: "/logos/sources/stagiaires_fr.png", country: "FR", category: "Stages & Jeunes", tag: "Stages & Alternance" },
  { id: "1jeune1solution", name: "1 Jeune 1 Solution", logo: "/logos/sources/1jeune1solution.png", country: "FR", category: "Officiel / Institutionnel", tag: "Gouvernement FR" },
  { id: "monster", name: "Monster", logo: "/logos/sources/monster.png", country: "FR", category: "Généraliste", tag: "Multi-Secteurs" },
  { id: "meteojob", name: "Meteojob", logo: "/logos/sources/meteojob.png", country: "FR", category: "Généraliste", tag: "Matching Direct" },
  { id: "optioncarriere", name: "OptionCarrière", logo: "/logos/sources/optioncarriere.png", country: "FR", category: "Généraliste", tag: "Agrégateur FR" },
  { id: "moovijob", name: "Moovijob", logo: "/logos/sources/moovijob.png", country: "FR", category: "Généraliste", tag: "Transfrontalier" },
  { id: "capdigital", name: "Cap Digital", logo: "/logos/sources/capdigital.png", country: "FR", category: "Spécialisé Tech", tag: "Pôle de Compétitivité" },
  { id: "chooseyourboss", name: "ChooseYourBoss", logo: "/logos/sources/chooseyourboss.png", country: "FR", category: "Spécialisé Tech", tag: "Inversion Recruteur" },
  { id: "esn_direct", name: "ESN Direct", logo: "/logos/sources/esn_direct.png", country: "FR", category: "Spécialisé Tech", tag: "Sociétés de Conseil" },
  { id: "numeum", name: "Numeum", logo: "/logos/sources/numeum.png", country: "FR", category: "Spécialisé Tech", tag: "Fédération Numérique" },

  // Tunisie
  { id: "tanitjobs", name: "Tanitjobs", logo: "/logos/sources/tanitjobs.png", country: "TN", category: "Généraliste", tag: "Portail Majeur TN" },
  { id: "keejob", name: "Keejob", logo: "/logos/sources/keejob.png", country: "TN", category: "Généraliste", tag: "Emploi & PFE TN" },
  { id: "emploitunisie", name: "Emploi Tunisie", logo: "/logos/sources/emploitunisie.png", country: "TN", category: "Généraliste", tag: "Offres Nationales" },
  { id: "aneti", name: "ANETI", logo: "/logos/sources/aneti.png", country: "TN", category: "Officiel / Institutionnel", tag: "Agence Nationale TN" },
  { id: "tunisietravail", name: "Tunisie Travail", logo: "/logos/sources/tunisietravail.png", country: "TN", category: "Généraliste", tag: "Concours & PFE" },
  { id: "stagetunisie", name: "Stage Tunisie", logo: "/logos/sources/stagetunisie.png", country: "TN", category: "Stages & Jeunes", tag: "Stages d'Ingénieurs" },
  { id: "offre_emploi_tn", name: "Offre Emploi TN", logo: "/logos/sources/offre_emploi_tn.png", country: "TN", category: "Généraliste", tag: "Index Régional TN" },

  // Spécialisés Tech / Direct
  { id: "stackoverflow_jobs", name: "StackOverflow Jobs", logo: "/logos/sources/stackoverflow_jobs.png", country: "ALL", category: "Spécialisé Tech", tag: "Ingénierie & Dev" },
  { id: "top100_enterprises", name: "Top 100 Entreprises IT", logo: "/logos/sources/top100_enterprises.png", country: "ALL", category: "Spécialisé Tech", tag: "Carrières Directes" },
];

export function LandingPage() {
  const { t, language } = useAppLanguage();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter sources state
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "FR" | "TN">("ALL");

  // Interactive Demo Cockpit Tab
  const [demoTab, setDemoTab] = useState<"ats" | "cv" | "letter" | "kanban">("ats");
  const [cvLangPreview, setCvLangPreview] = useState<"fr" | "en">("fr");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Footer newsletter state
  const [footerEmail, setFooterEmail] = useState("");
  const [footerSubscribed, setFooterSubscribed] = useState(false);

  const handleFooterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!footerEmail.trim()) return;
    setFooterSubscribed(true);
  };

  const filteredSources = ALL_SOURCES.filter((s) => {
    if (sourceFilter === "ALL") return true;
    if (sourceFilter === "FR") return s.country === "FR" || s.country === "ALL";
    if (sourceFilter === "TN") return s.country === "TN" || s.country === "ALL";
    return true;
  });

  const faqItems = [
    {
      q: t(
        "Qu'est-ce qu'ArcApply et à qui s'adresse la plateforme ?",
        "What is ArcApply and who is it designed for?"
      ),
      a: t(
        "ArcApply est un copilote de candidature d'ingénieur conçu spécifiquement pour les étudiants en fin d'études (PFE) et jeunes diplômés cherchant un stage ou premier emploi en France et en Tunisie. Contrairement aux générateurs de masse, ArcApply garantit zéro hallucination en s'appuyant rigoureusement sur votre Master Profile vérifié.",
        "ArcApply is an engineering application copilot tailored for graduating engineering students (internships/PFE) and junior engineers in France and Tunisia. Unlike bulk spam generators, ArcApply guarantees zero hallucination by strictly drawing from your verified Master Profile."
      ),
    },
    {
      q: t(
        "Comment fonctionne la garantie Zéro Hallucination ?",
        "How does the Zero Hallucination guarantee work?"
      ),
      a: t(
        "Les modèles IA classiques inventent fréquemment des compétences ou des projets. ArcApply applique un filtre déterministe strict : chaque argument d'une lettre de motivation ou élément de CV personnalisé doit provenir d'un fait documenté dans votre profil (projets réels, technologies utilisées, expériences). Tout contenu non vérifiable est éliminé.",
        "Standard AI generators frequently fabricate skills or experiences. ArcApply enforces a strict deterministic guardrail: every line in a cover letter or CV must stem from documented facts in your Master Profile (real projects, stacks, verified work). Unverifiable synthetic content is strictly prohibited."
      ),
    },
    {
      q: t(
        "Quelles sont les 27 sources scrutées en continu par le Radar ?",
        "Which 27 job boards does Radar monitor continuously?"
      ),
      a: t(
        "Le Radar ArcApply agrège et déduplique automatiquement les offres provenant de 27 plateformes majeures en France et en Tunisie : LinkedIn, Welcome to the Jungle, Indeed, HelloWork, Apec, Cadremploi, JobTeaser, L'Étudiant, 1 Jeune 1 Solution, Tanitjobs, Keejob, Emploi Tunisie, ANETI, Tunisie Travail, ainsi que les portails carrières directs du Top 100 ESN et firmes technologiques.",
        "ArcApply's Radar aggregates and deduplicates job postings across 27 primary platforms in France and Tunisia: LinkedIn, Welcome to the Jungle, Indeed, HelloWork, Apec, Cadremploi, JobTeaser, L'Étudiant, 1 Jeune 1 Solution, Tanitjobs, Keejob, Emploi Tunisie, ANETI, Tunisie Travail, and direct career portals of Top 100 IT tech companies."
      ),
    },
    {
      q: t(
        "Comment fonctionne le calcul du score de compatibilité ATS ?",
        "How is the ATS compatibility score calculated?"
      ),
      a: t(
        "Notre moteur ATS analyse sémantiquement la description de chaque offre (mots-clés, exigences techniques, niveau d'études, responsabilités) et la compare à vos acquis. Il vous indique votre score de compatibilité (ex: 94%), met en valeur vos atouts correspondants et identifie les compétences requises manquantes.",
        "Our ATS engine performs semantic parsing of job descriptions (keywords, required tech stack, seniority, domain) and cross-checks them against your verified profile. You receive an instant match score (e.g. 94%), highlights of your matched strengths, and precise missing gaps."
      ),
    },
    {
      q: t(
        "Qu'est-ce que le mode BYOK (Bring Your Own Key) avec Groq ?",
        "What is BYOK (Bring Your Own Key) with Groq?"
      ),
      a: t(
        "Groq fournit une API d'inférence ultra-rapide avec un quota gratuit généreux. En renseignant votre propre clé API Groq gratuite dans vos paramètres ou lors de l'onboarding, vous bénéficiez d'un quota dédié de 200 000 tokens/jour sans dépendre des limites d'un serveur partagé.",
        "Groq offers an ultra-fast LLM inference API with a generous free tier. By providing your own free Groq API key in Settings or during onboarding, you get a dedicated private quota (200,000 tokens/day) completely isolated from platform server limits."
      ),
    },
    {
      q: t(
        "Mes données personnelles et mes candidatures sont-elles privées ?",
        "Are my personal data and applications private?"
      ),
      a: t(
        "Absolument. Vos données de Master Profile, vos CV générés et votre suivi Kanban restent strictement confinés à votre session locale. ArcApply ne partage ni ne revend aucune information à des plateformes tierces ou cabinets de recrutement sans votre action explicite.",
        "Absolutely. Your Master Profile data, generated CVs, and Kanban tracking are strictly private to your account. ArcApply never sells or shares your information with third-party aggregators or recruiters without your explicit action."
      ),
    },
    {
      q: t(
        "L'utilisation de la plateforme est-elle payante ?",
        "Is the platform free to use?"
      ),
      a: t(
        "L'accès de base et l'ensemble des modules d'ArcApply sont entièrement gratuits pour les étudiants ingénieurs. Vous pouvez connecter votre clé Groq gratuite pour profiter de l'assistance illimitée.",
        "Core access and all ArcApply features are completely free for student engineers. You can connect your free Groq key for unlimited daily copilot assistance."
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBF8F3] dark:bg-[#12100E] text-stone-900 dark:text-stone-100 font-sans selection:bg-orange-100 selection:text-orange-950 dark:selection:bg-orange-950 dark:selection:text-orange-200">
      
      {/* ── Top Floating Navigation ── */}
      <nav
        className={`sticky top-0 z-40 transition-all duration-300 ease-in-out ${
          isScrolled
            ? "py-2.5 bg-[#FBF8F3]/95 dark:bg-[#12100E]/95 backdrop-blur-xl border-b border-stone-200/80 dark:border-stone-800 shadow-sm shadow-stone-900/5"
            : "py-4 bg-[#FBF8F3]/85 dark:bg-[#12100E]/85 backdrop-blur-md border-b border-stone-200/40 dark:border-stone-800/40"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Logo & Brand: Strict clear space & vector brand symbol */}
          <Link href="/" className="flex items-center gap-3 group shrink-0 focus:outline-none" aria-label="ArcApply Accueil">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/brand/arcapply-symbol.svg"
                alt="ArcApply Monogram"
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-stone-900 dark:text-white leading-none">
                Arc<span className="text-[#EA580C]">Apply</span>
              </span>
              <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 tracking-wider uppercase mt-0.5 hidden sm:inline">
                Copilote Ingénieur
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-7 text-xs font-semibold text-stone-600 dark:text-stone-300">
            <a href="#sources" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <span>{t("Sources (27)", "Sources (27)")}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </a>
            <a href="#features" className="hover:text-primary transition-colors">
              {t("Services Proposés", "Services")}
            </a>
            <a href="#demo" className="hover:text-primary transition-colors">
              {t("Aperçu Cockpit", "Cockpit Demo")}
            </a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">
              {t("Comment ça marche", "How It Works")}
            </a>
            <a href="#comparison" className="hover:text-primary transition-colors">
              {t("Comparatif", "Comparison")}
            </a>
            <a href="#faq" className="hover:text-primary transition-colors">
              {t("FAQ", "FAQ")}
            </a>
          </div>

          {/* Actions & Controls (Desktop) */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              {t("Se connecter", "Sign In")}
            </button>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-[#C2410C] text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all hover:shadow-lg hover:shadow-orange-600/30 flex items-center gap-1.5 tactile-button cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t("Créer un compte", "Get Started")}</span>
            </button>
          </div>

          {/* Controls & NavTrigger on Mobile */}
          <div className="flex md:hidden items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`nav-trigger text-stone-800 dark:text-stone-100 ${mobileMenuOpen ? "active" : ""}`}
              aria-label={t("Menu de navigation", "Navigation menu")}
            >
              <i />
              <i />
              <i />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200/80 dark:border-stone-800 bg-[#FBF8F3]/98 dark:bg-[#12100E]/98 backdrop-blur-2xl px-6 py-6 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl">
            <div className="flex flex-col space-y-3 font-semibold text-sm text-stone-700 dark:text-stone-200">
              <a
                href="#sources"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-primary transition-colors flex items-center justify-between"
              >
                <span>{t("27 Sources d'Offres Indexées", "27 Indexed Job Boards")}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">FR & TN</span>
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-primary transition-colors"
              >
                {t("Services Proposés", "Services")}
              </a>
              <a
                href="#demo"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-primary transition-colors"
              >
                {t("Aperçu Cockpit Interactif", "Interactive Cockpit")}
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-primary transition-colors"
              >
                {t("Comment ça marche", "How It Works")}
              </a>
              <a
                href="#comparison"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-primary transition-colors"
              >
                {t("Comparatif Élite", "Comparison")}
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-primary transition-colors"
              >
                {t("FAQ", "FAQ")}
              </a>
            </div>

            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl text-center text-xs font-semibold text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                {t("Se connecter", "Sign In")}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t("Créer un compte", "Get Started")}</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section : "L'Arc Ascendant" ── */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">

            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 text-primary text-xs font-bold tracking-wide shadow-xs">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>{t("ZÉRO HALLUCINATION · COPILOTE D'INGÉNIEUR PFE & EMPLOI", "ZERO HALLUCINATION · PFE & ENGINEERING COPILOT")}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-stone-900 dark:text-white leading-[1.12]">
              {t(
                "Décrochez votre stage PFE d'ingénieur en France & Tunisie sans spam ni hallucination.",
                "Land your engineering internship in France & Tunisia without spam or hallucinations."
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
              {t(
                "Le premier copilote déterministe pour étudiants ingénieurs : veille continue sur 27 sources d'offres, score de compatibilité ATS en direct, studio CV vectoriel A4 et lettres chirurgicales basées strictement sur vos projets réels.",
                "The first deterministic copilot for student engineers: live monitoring across 27 job boards, instant ATS compatibility scoring, vector A4 CV studio, and cover letters strictly grounded in your verified projects."
              )}
            </p>

            {/* Hero CTAs */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-7 py-3.5 rounded-xl bg-primary hover:bg-[#C2410C] text-white text-sm font-bold shadow-lg shadow-orange-600/25 transition-all flex items-center gap-2 tactile-button cursor-pointer"
              >
                <span>{t("Commencer maintenant (Gratuit)", "Start Now (Free)")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#sources"
                className="px-6 py-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-900/80 hover:bg-white dark:hover:bg-stone-800 text-sm font-semibold text-stone-800 dark:text-stone-200 shadow-sm transition-all flex items-center gap-2"
              >
                <Radar className="w-4 h-4 text-primary" />
                <span>{t("Découvrir les 27 sources", "Explore 27 Sources")}</span>
              </a>
            </div>

            {/* Trust Proof Pills */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500 dark:text-stone-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t("Zéro Hallucination garanti", "Zero Hallucination Guarantee")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t("27 Sources officielles FR & TN", "27 Official FR & TN Boards")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t("Clé Groq dédiée (BYOK 200k/j)", "Dedicated Groq Key (BYOK)")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t("100% Gratuit pour étudiants", "100% Free for Students")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-orange-500/10 dark:bg-orange-500/5 blur-[130px] rounded-full pointer-events-none" />
      </section>

      {/* ── Section: 27 Sources d'Offres Indexées en Continu (France & Tunisie) ── */}
      <section id="sources" className="py-20 bg-stone-100/70 dark:bg-[#141210] border-y border-stone-200/80 dark:border-stone-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 shadow-xs">
              <Globe className="w-3.5 h-3.5" />
              <span>{t("Couverture Exhaustive", "Complete Market Coverage")}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-stone-900 dark:text-white">
              {t("27 Plateformes & Portails Scrutés en Continu", "27 Job Boards Monitored Continuously")}
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-2" />
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
              {t(
                "Le Radar ArcApply agrège, déduplique et filtre les opportunités de stages PFE et d'emploi tech en temps réel sur les meilleurs canaux de recrutement en France et en Tunisie.",
                "ArcApply Radar continuously aggregates, deduplicates, and filters engineering internship and tech offers from the leading channels in France and Tunisia."
              )}
            </p>

            {/* Filter Tabs */}
            <div className="pt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setSourceFilter("ALL")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  sourceFilter === "ALL"
                    ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm"
                    : "bg-white dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-primary"
                }`}
              >
                {t("Toutes les Sources (27)", "All Sources (27)")}
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter("FR")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  sourceFilter === "FR"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-primary"
                }`}
              >
                <span>France (18)</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-black/15 rounded">FR</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter("TN")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  sourceFilter === "TN"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-primary"
                }`}
              >
                <span>Tunisie (7)</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-black/15 rounded">TN</span>
              </button>
            </div>
          </div>

          {/* Sources Grid with Official Logos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {filteredSources.map((source) => (
              <div
                key={source.id}
                className="group p-3.5 rounded-2xl bg-white dark:bg-[#1a1714] border border-stone-200/90 dark:border-stone-800/90 shadow-xs hover:shadow-md hover:border-primary/40 hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center justify-between gap-3"
              >
                {/* Official Logo Container */}
                <div className="w-16 h-12 rounded-xl bg-white p-1.5 border border-stone-100 dark:border-stone-800 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                  <img
                    src={source.logo}
                    alt={`${source.name} logo`}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                </div>

                <div className="w-full min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 font-display truncate">
                    {source.name}
                  </h4>
                  <div className="mt-1 flex items-center justify-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                      {source.country === "ALL" ? "FR & TN" : source.country}
                    </span>
                    <span className="text-[9px] text-stone-400 dark:text-stone-500 truncate max-w-[80px]">
                      {source.tag}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Banner inside Sources */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCheck className="w-4 h-4" />
              </div>
              <p className="text-stone-600 dark:text-stone-300">
                <strong className="text-stone-900 dark:text-white font-semibold">
                  {t("Déduplication Sémantique Active :", "Active Semantic Deduplication:")}
                </strong>{" "}
                {t(
                  "Une même offre publiée simultanément sur LinkedIn, Welcome to the Jungle et Tanitjobs n'apparaît qu'une seule fois dans votre flux.",
                  "A role crossposted to LinkedIn, Welcome to the Jungle, and Tanitjobs is automatically merged into a single clean listing."
                )}
              </p>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              {t("Voir le Radar en direct", "View Live Radar")}
            </button>
          </div>
        </div>
      </section>

      {/* ── Section: Interactive Cockpit Showcase & Simulation ── */}
      <section id="demo" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 shadow-xs">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t("Démonstration Interactive", "Interactive Demonstration")}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-stone-900 dark:text-white">
              {t("Le Cockpit ArcApply en Action", "The ArcApply Cockpit in Action")}
            </h2>
            <div className="w-16 h-1 bg-emerald-600 rounded-full mx-auto mt-2" />
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
              {t(
                "Testez les 4 briques fondamentales du moteur : du scoring mathématique ATS à la lettre chirurgicale sans la moindre hallucination.",
                "Experience the 4 fundamental building blocks of the engine: from mathematical ATS scoring to hallucination-free cover letters."
              )}
            </p>
          </div>

          {/* Interactive Cockpit Container */}
          <div className="max-w-5xl mx-auto rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#161311] shadow-2xl overflow-hidden">
            
            {/* Cockpit Nav Tabs */}
            <div className="flex flex-wrap items-center border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#12100E] px-4 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoTab("ats")}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border-t-2 ${
                  demoTab === "ats"
                    ? "bg-white dark:bg-[#161311] text-primary border-primary shadow-xs"
                    : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <Target className="w-4 h-4" />
                <span>{t("1. Scoring ATS Déterministe", "1. Deterministic ATS Score")}</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoTab("cv")}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border-t-2 ${
                  demoTab === "cv"
                    ? "bg-white dark:bg-[#161311] text-primary border-primary shadow-xs"
                    : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{t("2. Studio CV Vectoriel A4", "2. Vector A4 CV Studio")}</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoTab("letter")}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border-t-2 ${
                  demoTab === "letter"
                    ? "bg-white dark:bg-[#161311] text-primary border-primary shadow-xs"
                    : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{t("3. Lettre Chirurgicale", "3. Surgical Cover Letter")}</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoTab("kanban")}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border-t-2 ${
                  demoTab === "kanban"
                    ? "bg-white dark:bg-[#161311] text-primary border-primary shadow-xs"
                    : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <KanbanSquare className="w-4 h-4" />
                <span>{t("4. Pipeline & Relances J+7", "4. Pipeline & Follow-ups")}</span>
              </button>
            </div>

            {/* Tab 1: ATS Scoring Content */}
            {demoTab === "ats" && (
              <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-primary flex items-center justify-center font-bold">
                      <Radar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">
                        Thales &bull; {t("Stage Ingénieur Cloud & DevOps Kubernetes", "Cloud & DevOps Kubernetes Engineering Intern")}
                      </h4>
                      <p className="text-xs text-stone-500">
                        Sophia Antipolis, France &bull; {t("Indexé depuis LinkedIn & Apec", "Indexed from LinkedIn & Apec")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-emerald-600" />
                      <span>{t("Match ATS : 94%", "ATS Match: 94%")}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-bold">
                      FR
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                  {/* Verified skills */}
                  <div className="p-4 rounded-xl bg-stone-50/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{t("Compétences Clés Certifiées", "Verified Key Skills")}</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold font-mono">5 / 5 MATCH</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {["Kubernetes", "Docker", "CI/CD GitHub Actions", "FastAPI", "Python"].map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      {t(
                        "Extraites de votre projet 'Plateforme Microservices ArcApply' et validées sans aucune hallucination.",
                        "Directly extracted from your documented project 'ArcApply Microservices' without any hallucination."
                      )}
                    </p>
                  </div>

                  {/* Missing gaps */}
                  <div className="p-4 rounded-xl bg-stone-50/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-amber-600" />
                        <span>{t("Mots-Clés Secondaires à Valoriser", "Secondary Keywords to Highlight")}</span>
                      </span>
                      <span className="text-[10px] text-amber-600 font-bold font-mono">1 SUGGESTION</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                        Terraform (IaC)
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      {t(
                        "Mentionné dans l'offre comme atout. ArcApply vous conseille d'activer votre TP d'infrastructure as code.",
                        "Mentioned in job specs as a bonus. ArcApply suggests referencing your lab IaC coursework."
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Vector CV Studio Content */}
            {demoTab === "cv" && (
              <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200 text-left">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">
                      {t("Studio CV Vectoriel A4 — 1 Page Calibrée", "Vector A4 CV Studio — Exactly 1 Page")}
                    </h4>
                    <p className="text-xs text-stone-500">
                      {t("Rendu natif Playwright • Aucune coupure de page intempestive • 100% Conforme ATS", "Native Playwright vector render • No page overflow • 100% ATS-compliant")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCvLangPreview(cvLangPreview === "fr" ? "en" : "fr")}
                      className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors cursor-pointer"
                    >
                      {cvLangPreview === "fr" ? "FR -> EN (1 Clic)" : "EN -> FR (1 Clic)"}
                    </button>
                    <span className="px-2.5 py-1 rounded bg-stone-200 dark:bg-stone-800 text-[11px] font-mono text-stone-700 dark:text-stone-300 font-semibold">
                      PDF Vectoriel
                    </span>
                  </div>
                </div>

                {/* Miniature CV Sheet Preview */}
                <div className="max-w-2xl mx-auto rounded-xl border border-stone-300 dark:border-stone-700 bg-white text-stone-900 p-6 shadow-sm space-y-4 font-sans text-xs">
                  <div className="border-b border-stone-200 pb-3 flex items-start justify-between">
                    <div>
                      <h5 className="text-base font-extrabold tracking-tight font-display text-stone-950">
                        Yassine Ben Salem
                      </h5>
                      <p className="text-xs font-semibold text-primary">
                        {cvLangPreview === "fr" ? "Élève-Ingénieur Logiciel & Cloud (ESPRIT)" : "Software & Cloud Engineering Student (ESPRIT)"}
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-stone-500 leading-tight">
                      <span>Tunis &bull; Paris (Mobilité)</span><br />
                      <span>contact@arcapply.com</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h6 className="text-[11px] font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200 pb-0.5">
                      {cvLangPreview === "fr" ? "Projets d'Ingénierie Clés" : "Key Engineering Projects"}
                    </h6>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between font-semibold text-stone-900">
                        <span>ArcApply — Microservices Copilot</span>
                        <span className="font-mono text-stone-500">2026</span>
                      </div>
                      <p className="text-stone-600 text-[10px] leading-relaxed">
                        {cvLangPreview === "fr"
                          ? "Architecture backend FastAPI, base SQLite SQLModel isolée, conteneurisation Docker & Kubernetes, pipelines CI/CD."
                          : "FastAPI microservices architecture, isolated SQLite SQLModel, Docker & Kubernetes containerization, CI/CD pipelines."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Cover Letter */}
            {demoTab === "letter" && (
              <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200 text-left">
                <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">
                    {t("Synthèse Chirurgicale — Comparatif Factualité", "Surgical Cover Letter — Factuality Comparison")}
                  </h4>
                  <p className="text-xs text-stone-500">
                    {t("Garantie absolue : aucun projet inventé, aucune extrapolation pompeuse.", "Absolute guarantee: zero synthetic projects, zero generic buzzwords.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 space-y-2">
                    <span className="text-[11px] font-bold text-red-600 flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5" />
                      <span>{t("Générateur Spam IA Classique (ChatGPT)", "Standard Bulk AI Spam")}</span>
                    </span>
                    <p className="text-stone-600 dark:text-stone-400 italic text-[11px] leading-relaxed">
                      &laquo; En tant que passionné d'intelligence artificielle avec une vaste expérience internationale chez des leaders de la tech, je suis convaincu que mes compétences révolutionneront vos équipes... &raquo;
                    </p>
                    <span className="text-[10px] text-red-500 font-semibold block">
                      {t("Rejeté immédiatement : mensonges évidents et blabla pompeux.", "Immediately rejected: obvious hallucinations & boilerplate.")}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ArcApply Deterministic Copilot</span>
                    </span>
                    <p className="text-stone-800 dark:text-stone-200 text-[11px] leading-relaxed">
                      &laquo; Lors de la conception d'ArcApply, j'ai déployé l'architecture microservices sous FastAPI et orchestré les clusters Kubernetes sur Docker. Votre recherche d'un stagiaire autonome sur l'automatisation CI/CD s'aligne directement avec ces réalisations... &raquo;
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      {t("Retenu : 100% vérifiable lors de l'entretien technique.", "Selected: 100% verified during technical interviews.")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Kanban */}
            {demoTab === "kanban" && (
              <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200 text-left">
                <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">
                    {t("Pipeline Kanban & Relances Intelligentes J+7", "Kanban Pipeline & Day+7 Follow-Up Reminders")}
                  </h4>
                  <p className="text-xs text-stone-500">
                    {t("Suivez vos démarches sans charge mentale et sachez exactement quand relancer.", "Track your journey with zero mental fatigue and perfect timing.")}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 space-y-2">
                    <span className="font-bold text-stone-800 dark:text-stone-200 text-[11px] block">
                      {t("À Postuler (3)", "To Apply (3)")}
                    </span>
                    <div className="p-2 rounded-lg bg-white dark:bg-stone-900 shadow-xs border border-stone-200 dark:border-stone-800">
                      <p className="font-bold text-[10px]">Airbus &bull; Toulouse</p>
                      <span className="text-[9px] text-stone-500">Match ATS 91%</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 space-y-2">
                    <span className="font-bold text-stone-800 dark:text-stone-200 text-[11px] block">
                      {t("Postulé (5)", "Applied (5)")}
                    </span>
                    <div className="p-2 rounded-lg bg-white dark:bg-stone-900 shadow-xs border border-stone-200 dark:border-stone-800">
                      <p className="font-bold text-[10px]">Sofrecom &bull; Tunis</p>
                      <span className="text-[9px] text-stone-500">J+3</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                    <span className="font-bold text-amber-800 dark:text-amber-300 text-[11px] flex items-center justify-between">
                      <span>{t("Relance J+7 (1)", "Follow-up (1)")}</span>
                      <Flame className="w-3 h-3 text-amber-600" />
                    </span>
                    <div className="p-2 rounded-lg bg-white dark:bg-stone-900 shadow-xs border border-amber-300 dark:border-amber-700">
                      <p className="font-bold text-[10px] text-amber-900 dark:text-amber-200">Thales &bull; Sophia</p>
                      <span className="text-[9px] text-amber-600 font-semibold">{t("Email prêt à envoyer", "Email ready")}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] block">
                      {t("Entretien (2)", "Interview (2)")}
                    </span>
                    <div className="p-2 rounded-lg bg-white dark:bg-stone-900 shadow-xs border border-emerald-300 dark:border-emerald-700">
                      <p className="font-bold text-[10px] text-emerald-900 dark:text-emerald-200">Amadeus &bull; Nice</p>
                      <span className="text-[9px] text-emerald-600 font-bold">{t("Fit RH validé", "HR call passed")}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Section: Services Proposés par la Plateforme ── */}
      <section id="features" className="py-24 bg-stone-100/70 dark:bg-[#141210] border-y border-stone-200/80 dark:border-stone-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 shadow-xs">
              <Zap className="w-3.5 h-3.5" />
              <span>{t("Services & Capacités Clés", "Services & Core Capabilities")}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-stone-900 dark:text-white">
              {t("Services Proposés par la Plateforme", "Services Offered by Our Platform")}
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-3" />
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto mt-2">
              {t(
                "Un écosystème d'ingénierie complet conçu pour les étudiants : précision déterministe, scoring ATS en direct et aucun spam générique.",
                "A complete engineering ecosystem built for students: deterministic accuracy, live ATS match scoring, and zero generic spam."
              )}
            </p>
          </div>

          {/* Service Cards Grid (Cluverse Style with Corner Badges) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {/* Service 1: Radar */}
            <div className="relative p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#181513] border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-primary flex items-center justify-center group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <Radar className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-primary border border-orange-200 dark:border-orange-800/60">
                    27 Sources
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-stone-900 dark:text-stone-100 group-hover:text-primary transition-colors">
                    {t("Radar des Offres Intelligent", "Intelligent Offer Radar")}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed mt-2.5">
                    {t(
                      "Veille continue sur 27 sources en France et Tunisie (LinkedIn, WTTJ, HelloWork, Tanitjobs, Keejob...). Déduplication par fingerprint sémantique et enrichissement des descriptions complètes.",
                      "Continuous tracking across 27 job sources in France and Tunisia. Semantic fingerprint deduplication and full description enrichment."
                    )}
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <div className="w-10 h-10 rounded-tl-2xl rounded-br-2xl bg-stone-100 dark:bg-stone-800/80 text-stone-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-300 ml-auto -mr-7 -mb-7">
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Service 2: ATS Engine */}
            <div className="relative p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#181513] border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-2xl hover:border-emerald-500/50 hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <Target className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    {t("Déterministe", "Deterministic")}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {t("Scoring ATS en Temps Réel", "Real-Time ATS Scoring")}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed mt-2.5">
                    {t(
                      "Algorithme comparant les prérequis réels de chaque poste à votre Master Profile vérifié. Identifiez votre pourcentage d'adéquation et comblez les compétences prioritaires.",
                      "Accurate algorithm weighing job requirements against your certified profile. View your exact match percentage and fill priority keywords."
                    )}
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <div className="w-10 h-10 rounded-tl-2xl rounded-br-2xl bg-stone-100 dark:bg-stone-800/80 text-stone-400 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all duration-300 ml-auto -mr-7 -mb-7">
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Service 3: CV Studio */}
            <div className="relative p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#181513] border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-2xl hover:border-blue-500/50 hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <FileText className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                    {t("Feuille A4", "A4 Sheet")}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-stone-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {t("Studio CV Vectoriel A4", "Vector A4 CV Studio")}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed mt-2.5">
                    {t(
                      "Édition directement sur la feuille A4 avec mise en page calibrée. Insertion de blocs structurés, bascule instantanée FR/EN et compilation PDF vectorielle fidèle à 100%.",
                      "Direct editing on calibrated A4 sheet. Modular section building, instant FR/EN language toggle, and 100% faithful vector PDF export."
                    )}
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <div className="w-10 h-10 rounded-tl-2xl rounded-br-2xl bg-stone-100 dark:bg-stone-800/80 text-stone-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all duration-300 ml-auto -mr-7 -mb-7">
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Service 4: Cover Letter */}
            <div className="relative p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#181513] border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-2xl hover:border-purple-500/50 hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                    {t("Zéro Hallucination", "Zero Fluff")}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-stone-900 dark:text-stone-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {t("Lettres de Motivation Chirurgicales", "Surgical Cover Letters")}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed mt-2.5">
                    {t(
                      "Fini les lettres génériques impersonnelles. Synthèse sobre et ciblée qui met en valeur vos réalisations prouvées, vos stacks réelles et vos projets d'école certifiés.",
                      "No more generic bulk emails. Clean, targeted letters highlighting your actual verified projects, technologies, and technical achievements."
                    )}
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <div className="w-10 h-10 rounded-tl-2xl rounded-br-2xl bg-stone-100 dark:bg-stone-800/80 text-stone-400 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-all duration-300 ml-auto -mr-7 -mb-7">
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Service 5: Kanban Pipeline */}
            <div className="relative p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#181513] border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-2xl hover:border-amber-500/50 hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                    <KanbanSquare className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                    {t("Pipeline Kanban", "Pipeline")}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {t("Suivi Kanban & Relances J+7", "Kanban Tracker & Day+7 Follow-ups")}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed mt-2.5">
                    {t(
                      "Pipeline visuel de vos candidatures (À postuler, Postulé, En attente, Entretien, Offre). Rappels automatiques quand une relance par email est recommandée à J+7.",
                      "Visual hiring pipeline across every stage with automated reminders when a follow-up email is optimal after 7 days."
                    )}
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <div className="w-10 h-10 rounded-tl-2xl rounded-br-2xl bg-stone-100 dark:bg-stone-800/80 text-stone-400 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-all duration-300 ml-auto -mr-7 -mb-7">
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Service 6: BYOK & Isolation */}
            <div className="relative p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#181513] border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-2xl hover:border-orange-500/50 hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-stone-500/10 border border-stone-500/20 text-stone-700 dark:text-stone-300 flex items-center justify-center group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <KeyRound className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    {t("BYOK Privé", "Private BYOK")}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-stone-900 dark:text-stone-100 group-hover:text-primary transition-colors">
                    {t("Mode BYOK Groq & Confidentialité", "BYOK Groq Mode & Data Privacy")}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed mt-2.5">
                    {t(
                      "Multi-tenant étanche : connectez votre propre clé API Groq gratuite pour profiter de 200 000 tokens/jour dédiés. Vos données et vos CVs restent strictement confidentiels.",
                      "Isolated multi-tenancy: connect your own free Groq API key for 200,000 dedicated tokens/day. Complete private ownership of your data."
                    )}
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <div className="w-10 h-10 rounded-tl-2xl rounded-br-2xl bg-stone-100 dark:bg-stone-800/80 text-stone-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-300 ml-auto -mr-7 -mb-7">
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Comment ça marche (3 étapes) ── */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t("Parcours Fluide & Simple", "Fluid & Seamless Journey")}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-stone-900 dark:text-white">
              {t("Comment ça marche en 3 étapes ?", "How Does It Work in 3 Steps?")}
            </h2>
            <div className="w-16 h-1 bg-emerald-600 rounded-full mx-auto mt-3" />
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto mt-2">
              {t(
                "De la configuration de votre profil à vos premiers entretiens, en moins de 10 minutes.",
                "From initial profile setup to recruiter interviews in under 10 minutes."
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-7 space-y-4 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-bold text-sm flex items-center justify-center font-display shadow-md shadow-orange-500/20">
                1
              </div>
              <h3 className="text-base font-bold font-display text-stone-900 dark:text-stone-100">
                {t("Renseignez votre Master Profile", "Complete Your Master Profile")}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                {t(
                  "À la création de votre compte, un guide pas-à-pas en 7 étapes fluides vous accompagne pour enregistrer vos coordonnées, formations, stages, projets clés et compétences techniques.",
                  "Upon account creation, a fluid 7-step wizard guides you to record your contact details, education, internships, key projects, and technical skills."
                )}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-7 space-y-4 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-sm flex items-center justify-center font-display shadow-md">
                2
              </div>
              <h3 className="text-base font-bold font-display text-stone-900 dark:text-stone-100">
                {t("Explorez le Radar & Scorez les Offres", "Explore Radar & Score Opportunities")}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                {t(
                  "Accédez aux offres de stages PFE fraîchement indexées sur 27 sources. Le moteur calcule instantanément votre score ATS et met en évidence la correspondance exacte avec vos compétences.",
                  "Access freshly indexed internship listings across 27 sources. The engine computes your ATS match score instantly and highlights exact matches with your engineering skillset."
                )}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-7 space-y-4 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center font-display shadow-md shadow-emerald-600/20">
                3
              </div>
              <h3 className="text-base font-bold font-display text-stone-900 dark:text-stone-100">
                {t("Générez et Candidatez en Confiance", "Generate & Apply With Confidence")}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                {t(
                  "Exportez votre CV A4 vectoriel et votre lettre sur-mesure zéro-hallucination. Suivez vos envois dans le Kanban et déclenchez des relances appropriées au bon moment.",
                  "Export your A4 vector CV and tailored zero-hallucination letter. Track your submissions on the Kanban board and trigger follow-ups at the optimal moment."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Comparatif Spam vs ArcApply ── */}
      <section id="comparison" className="py-24 bg-stone-100/70 dark:bg-stone-900/40 border-y border-stone-200/80 dark:border-stone-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 shadow-xs">
              <Target className="w-3.5 h-3.5 text-amber-600" />
              <span>{t("Comparatif Élite", "Elite Comparison")}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-stone-900 dark:text-white">
              {t("Pourquoi choisir ArcApply ?", "Why Choose ArcApply?")}
            </h2>
            <div className="w-16 h-1 bg-amber-600 rounded-full mx-auto mt-3" />
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto mt-2">
              {t(
                "La différence entre le mass-spam IA rejeté par les recruteurs et une candidature d'ingénieur d'élite.",
                "The difference between bulk AI spam rejected by recruiters and an elite engineering submission."
              )}
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50">
                  <th className="py-4 px-5 font-bold text-stone-700 dark:text-stone-300">
                    {t("Critère d'évaluation", "Evaluation Criterion")}
                  </th>
                  <th className="py-4 px-5 font-bold text-stone-400 dark:text-stone-500">
                    {t("Outils Spam IA Classiques", "Standard AI Spam Tools")}
                  </th>
                  <th className="py-4 px-5 font-bold text-primary dark:text-orange-400">
                    ArcApply Copilot
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-stone-800 dark:text-stone-200">
                    {t("Véracité des compétences", "Skill Veracity")}
                  </td>
                  <td className="py-3.5 px-5 text-stone-500">
                    {t("Hallucinations fréquentes, compétences inventées", "Frequent hallucinations, fabricated skills")}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{t("100% Master Profile Réel garanti", "100% Real Verified Profile")}</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-stone-800 dark:text-stone-200">
                    {t("Sources d'opportunités", "Opportunity Sources")}
                  </td>
                  <td className="py-3.5 px-5 text-stone-500">
                    {t("Limité à 1 ou 2 plateformes US", "Limited to 1-2 US job boards")}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-emerald-700 dark:text-emerald-400">
                    {t("27 Portails officiels France & Tunisie", "27 Official France & Tunisia Boards")}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-stone-800 dark:text-stone-200">
                    {t("Format du CV", "CV Layout Format")}
                  </td>
                  <td className="py-3.5 px-5 text-stone-500">
                    {t("Modèles Word désalignés, débordements de page", "Unaligned Word files, rejected by ATS")}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-emerald-700 dark:text-emerald-400">
                    {t("A4 Vectoriel pur & 100% Conforme ATS", "Pure A4 vector typography & ATS-compliant")}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-stone-800 dark:text-stone-200">
                    {t("Temps de préparation", "Preparation Time")}
                  </td>
                  <td className="py-3.5 px-5 text-stone-500">
                    {t("45 min de copier-coller manuel pénible", "45 min of tedious manual copying")}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-emerald-700 dark:text-emerald-400">
                    {t("Moins de 2 minutes par candidature ciblée", "Under 2 minutes per targeted role")}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-stone-800 dark:text-stone-200">
                    {t("Confidentialité & Quota", "Privacy & Daily Quota")}
                  </td>
                  <td className="py-3.5 px-5 text-stone-500">
                    {t("Serveurs partagés saturés, données stockées", "Saturated shared servers, data stored")}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-emerald-700 dark:text-emerald-400">
                    {t("BYOK Privé (200k tokens/jour) & Données isolées", "Private BYOK (200k tokens/day) & Isolated")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Section: FAQ ── */}
      <section id="faq" className="py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 shadow-xs">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t("Foire Aux Questions", "Frequently Asked Questions")}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-stone-900 dark:text-white">
              {t("Questions Fréquemment Posées", "Frequently Asked Questions")}
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-3" />
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto mt-2">
              {t(
                "Tout ce que vous devez savoir sur le fonctionnement déterministe d'ArcApply et la garantie zéro hallucination.",
                "Everything you need to know about ArcApply's deterministic application engine and zero hallucination guarantee."
              )}
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3.5">
            {faqItems.map((item, index) => {
              const isOpen = activeFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-stone-200/90 dark:border-stone-800/80 bg-white dark:bg-[#181513] overflow-hidden transition-all duration-300 shadow-xs hover:border-primary/40 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 font-display transition-all duration-300 hover:pl-6 hover:bg-primary/5 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-black flex items-center justify-center shrink-0 border border-primary/25">
                        {index + 1}
                      </span>
                      <span className="truncate sm:whitespace-normal">{item.q}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 transition-transform duration-300 shrink-0 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-5 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed border-t border-dashed border-stone-200 dark:border-stone-800/80 pt-4 bg-stone-50/50 dark:bg-[#141210]/50 animate-in fade-in duration-200">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Bottom Call To Action Banner ── */}
      <section className="py-20 bg-gradient-to-r from-[#0F172A] via-[#1E1B18] to-[#2B1308] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>{t("Stages PFE & Emploi Ingénieur 2027", "Engineering Internships & Jobs 2027")}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
            {t(
              "Prêt à multiplier par 3 vos retours d'entretiens ?",
              "Ready to Triple Your Recruiter Interview Callbacks?"
            )}
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed">
            {t(
              "Rejoignez les étudiants ingénieurs en France et Tunisie qui postulent plus intelligemment, sans stress et avec des dossiers irréprochables.",
              "Join engineering students in France and Tunisia applying smarter, without burnout, with verified dossiers."
            )}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-7 py-3.5 rounded-xl bg-primary hover:bg-[#C2410C] text-white text-xs font-bold shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 tactile-button cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t("Créer mon compte gratuitement", "Create Free Account")}</span>
            </button>
          </div>
        </div>
        
        {/* Glow */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-orange-500/10 blur-[100px] pointer-events-none" />
      </section>

      {/* ── Rich Footer (inspiré de test.html et du Guide de Marque) ── */}
      <footer className="bg-[#141210] dark:bg-[#0c0a09] text-stone-400 text-xs relative overflow-hidden border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top CTA Row */}
          <div className="py-8 sm:py-10 border-b border-stone-800/80">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Single CTA 1: Location */}
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-sm sm:text-base font-display">
                    {t("France & Tunisie", "France & Tunisia")}
                  </h4>
                  <p className="text-stone-400 text-xs mt-0.5">
                    {t("Hub de recrutement stages PFE & 1er emploi", "PFE internships & entry-level engineering hub")}
                  </p>
                </div>
              </div>

              {/* Single CTA 2: Availability */}
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-sm sm:text-base font-display">
                    {t("Copilote Déterministe", "Deterministic Copilot")}
                  </h4>
                  <p className="text-stone-400 text-xs mt-0.5">
                    {t("Assistance et ciblage disponible 24/7", "Targeting & copilot available 24/7")}
                  </p>
                </div>
              </div>

              {/* Single CTA 3: Email */}
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-sm sm:text-base font-display">
                    {t("Contact Direct", "Direct Email")}
                  </h4>
                  <a
                    href="mailto:contact@arcapply.com"
                    className="text-stone-400 hover:text-primary transition-colors text-xs mt-0.5 block truncate"
                  >
                    contact@arcapply.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Footer Content */}
          <div className="py-12 sm:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
              
              {/* Col 1: Brand & Bio & Socials (lg: 5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                <Link href="/" className="inline-flex items-center gap-3 group focus:outline-none">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
                    <img
                      src="/brand/arcapply-symbol.svg"
                      alt="ArcApply Monogram"
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <span className="font-extrabold text-xl tracking-tight text-white font-display">
                    Arc<span className="text-[#EA580C]">Apply</span>
                  </span>
                </Link>
                <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-sm">
                  {t(
                    "Le premier copilote d'application déterministe pour étudiants ingénieurs. Zéro hallucination, adaptation chirurgicale de CV et ciblage précis des meilleures firmes technologiques.",
                    "The first deterministic application copilot for engineering students. Zero hallucinations, surgical CV tailoring, and precise matching with top tech firms."
                  )}
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <span className="text-xs font-semibold text-white mr-1">
                    {t("Suivez-nous :", "Follow us:")}
                  </span>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    className="w-9 h-9 rounded-full bg-[#1e1b18] border border-stone-800 hover:border-primary flex items-center justify-center text-stone-300 hover:text-white transition-all hover:scale-110"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href="https://github.com/louaycodes/arcapply"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub"
                    className="w-9 h-9 rounded-full bg-[#1e1b18] border border-stone-800 hover:border-primary flex items-center justify-center text-stone-300 hover:text-white transition-all hover:scale-110"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <a
                    href="/"
                    aria-label="Website"
                    className="w-9 h-9 rounded-full bg-[#1e1b18] border border-stone-800 hover:border-primary flex items-center justify-center text-stone-300 hover:text-white transition-all hover:scale-110"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Col 2: Useful Links (lg: 4 cols) */}
              <div className="lg:col-span-4 space-y-5">
                <div>
                  <h3 className="text-white font-bold text-sm sm:text-base font-display relative pb-3 inline-block">
                    {t("Navigation Rapide", "Useful Links")}
                    <span className="absolute bottom-0 left-0 w-10 h-0.5 bg-primary rounded-full" />
                  </h3>
                </div>
                <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-medium">
                  <li>
                    <a href="#" className="text-stone-400 hover:text-primary transition-colors">
                      {t("Accueil", "Home")}
                    </a>
                  </li>
                  <li>
                    <a href="#sources" className="text-stone-400 hover:text-primary transition-colors">
                      {t("Sources (27)", "Sources (27)")}
                    </a>
                  </li>
                  <li>
                    <a href="#features" className="text-stone-400 hover:text-primary transition-colors">
                      {t("Services Proposés", "Our Services")}
                    </a>
                  </li>
                  <li>
                    <a href="#demo" className="text-stone-400 hover:text-primary transition-colors">
                      {t("Aperçu Cockpit", "Cockpit Demo")}
                    </a>
                  </li>
                  <li>
                    <a href="#how-it-works" className="text-stone-400 hover:text-primary transition-colors">
                      {t("Comment ça marche", "How It Works")}
                    </a>
                  </li>
                  <li>
                    <a href="#comparison" className="text-stone-400 hover:text-primary transition-colors">
                      {t("Comparatif", "Comparison")}
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="text-stone-400 hover:text-primary transition-colors">
                      {t("FAQ", "FAQ")}
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="text-stone-400 hover:text-primary transition-colors text-left cursor-pointer"
                    >
                      {t("Se connecter", "Sign In")}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Col 3: Subscribe / Veille (lg: 3 cols) */}
              <div className="lg:col-span-3 space-y-5">
                <div>
                  <h3 className="text-white font-bold text-sm sm:text-base font-display relative pb-3 inline-block">
                    {t("Veille Recrutement", "Subscribe")}
                    <span className="absolute bottom-0 left-0 w-10 h-0.5 bg-primary rounded-full" />
                  </h3>
                </div>
                <p className="text-stone-400 text-xs leading-relaxed">
                  {t(
                    "Recevez les nouvelles offres de stages PFE d'ingénieur et les alertes du Radar directement.",
                    "Never miss fresh engineering internship postings and radar notifications."
                  )}
                </p>
                {footerSubscribed ? (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t("Inscription confirmée avec succès !", "Subscribed successfully!")}</span>
                  </div>
                ) : (
                  <form onSubmit={handleFooterSubscribe} className="relative flex items-center">
                    <input
                      type="email"
                      required
                      value={footerEmail}
                      onChange={(e) => setFooterEmail(e.target.value)}
                      placeholder={t("Votre adresse email", "Your email address")}
                      className="w-full py-3 pl-3.5 pr-12 rounded-xl bg-[#221f1d] border border-stone-800 text-white placeholder-stone-500 text-xs focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="submit"
                      aria-label={t("S'abonner", "Subscribe")}
                      className="absolute right-1 top-1 bottom-1 px-3 bg-primary hover:bg-orange-600 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Area */}
        <div className="bg-[#0b0a09] border-t border-stone-900 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-stone-500 text-xs">
              &copy; {new Date().getFullYear()} ArcApply. {t("Tous droits réservés.", "All rights reserved.")}
            </p>
            <div className="flex items-center gap-5 text-xs text-stone-500">
              <a href="#" className="hover:text-primary transition-colors">
                {t("Mentions Légales", "Terms")}
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                {t("Confidentialité", "Privacy")}
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                {t("Politique Données", "Policy")}
              </a>
              <a href="mailto:contact@arcapply.com" className="hover:text-primary transition-colors">
                {t("Contact", "Contact")}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Auth Modal Popup ── */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <LoginForm />
          </div>
        </div>
      )}
    </div>
  );
}
