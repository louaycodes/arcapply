"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radar,
  ArrowRight,
  ChevronDown,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Send,
  Globe,
  Linkedin,
  Github,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { useAppLanguage } from "@/lib/language-context";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { LoginForm } from "@/components/auth/login-form";
import { WorldCoverageMap } from "@/components/landing/world-coverage-map";
import { BentoCapabilities } from "@/components/landing/bento-capabilities";
import { AscensionProtocol } from "@/components/landing/ascension-protocol";
import { ComparisonCockpit } from "@/components/landing/comparison-cockpit";

export function LandingPage() {
  const { t } = useAppLanguage();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              {t("Capacités Clés", "Capabilities")}
            </a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">
              {t("Protocole 3 Étapes", "3-Step Protocol")}
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
                {t("Capacités Clés", "Capabilities")}
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-primary transition-colors"
              >
                {t("Protocole 3 Étapes", "3-Step Protocol")}
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
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-7">

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
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
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
                <span>{t("Explorer les 27 sources", "Explore 27 Sources")}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-orange-500/10 dark:bg-orange-500/5 blur-[130px] rounded-full pointer-events-none" />
      </section>

      {/* ── Section: 27 Plateformes Scrutées en Continu (Carte Interactive FR & TN + Marquee Logos) ── */}
      <WorldCoverageMap />
      {/* ── Section: Capacités Clés (Bento Command Center 6 Modules) ── */}
      <BentoCapabilities />

      {/* ── Section: Parcours Ascensionnel (Protocole 3 Étapes Interactif) ── */}
      <AscensionProtocol />

      {/* ── Section: Comparatif Élite (Cockpit Side-by-Side Benchmark) ── */}
      <ComparisonCockpit />


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
                      {t("Capacités Clés", "Capabilities")}
                    </a>
                  </li>
                  <li>
                    <a href="#how-it-works" className="text-stone-400 hover:text-primary transition-colors">
                      {t("Protocole 3 Étapes", "3-Step Protocol")}
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
