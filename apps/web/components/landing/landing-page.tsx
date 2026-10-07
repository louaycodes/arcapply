"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { useAppLanguage } from "@/lib/language-context";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { LoginForm } from "@/components/auth/login-form";

export function LandingPage() {
  const { t, language } = useAppLanguage();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("question");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setTimeout(() => {
      setContactSubmitting(false);
      setContactSubmitted(true);
    }, 800);
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
        "Comment fonctionne le calcul du score ATS ?",
        "How is the ATS compatibility score calculated?"
      ),
      a: t(
        "Notre moteur ATS analyse sémantiquement la description de chaque offre (mots-clés, exigences techniques, niveau d'études, responsabilités) et la compare à vos acquis. Il vous indique votre score de compatibilité (ex: 88%), met en valeur vos atouts correspondants et identifie les compétences requises manquantes.",
        "Our ATS engine performs semantic parsing of job descriptions (keywords, required tech stack, seniority, domain) and cross-checks them against your verified profile. You receive an instant match score (e.g. 88%), highlights of your matched strengths, and precise missing gaps."
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
        "Quelles sources d'offres le Radar scrute-t-il ?",
        "Which job boards does Radar monitor?"
      ),
      a: t(
        "Le Radar ArcApply agrège et déduplique automatiquement les offres provenant de LinkedIn, Welcome to the Jungle, HelloWork et Tanitjobs, spécifiquement ciblées sur la France et la Tunisie, avec filtres par technologie, ville et date de parution.",
        "ArcApply's Radar aggregates and deduplicates job postings from LinkedIn, Welcome to the Jungle, HelloWork, and Tanitjobs, specifically targeted at France and Tunisia, with filters for tech stack, city, and publication date."
      ),
    },
    {
      q: t(
        "Mes données personnelles et mes candidatures sont-elles privées ?",
        "Are my personal data and applications private?"
      ),
      a: t(
        "Absolument. Vos données de Master Profile, vos CV générés et votre suivi Kanban restent strictement confinés à votre session. ArcApply ne partage ni ne revend aucune information à des plateformes tierces ou cabinets de recrutement sans votre action explicite.",
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
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#12100E] text-stone-900 dark:text-stone-100 font-sans selection:bg-orange-100 selection:text-orange-950 dark:selection:bg-orange-950 dark:selection:text-orange-200">
      {/* ── Top Floating Navigation ── */}
      <nav className="sticky top-0 z-40 bg-[#FBF9F5]/85 dark:bg-[#12100E]/85 backdrop-blur-xl border-b border-stone-200/80 dark:border-stone-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-orange-700 flex items-center justify-center text-white shadow-md shadow-orange-600/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-stone-900 dark:text-white">
                ArcApply
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                PFE 2027
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-600 dark:text-stone-300">
            <a href="#features" className="hover:text-primary transition-colors">
              {t("Que offre la plateforme ?", "What We Offer")}
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
            <a href="#contact" className="hover:text-primary transition-colors">
              {t("Contact", "Contact")}
            </a>
          </div>

          {/* Actions & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {t("Se connecter", "Sign In")}
            </button>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all hover:shadow-lg hover:shadow-orange-600/30 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t("Créer un compte", "Get Started")}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100/90 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-300 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>
                {t(
                  "France & Tunisie &bull; Stages PFE & Premier Emploi Ingénieur",
                  "France & Tunisia &bull; PFE Internships & Junior Engineering Jobs"
                )}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-stone-900 dark:text-white leading-[1.12]">
              {t(
                "Décrochez votre stage PFE d'ingénieur sans spam ni hallucinations IA.",
                "Land your engineering internship without spam or AI hallucinations."
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
              {t(
                "Le premier copilote d'application déterministe : il scrute les meilleures opportunités, aligne vos compétences réelles avec chaque offre et génère des CV vectoriels A4 et lettres chirurgicales.",
                "The first deterministic application copilot: it monitors top opportunities, aligns your verified skills with each role, and crafts ATS-compliant vector CVs and surgical cover letters."
              )}
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-6 py-3.5 rounded-xl bg-primary hover:bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-600/25 transition-all flex items-center gap-2"
              >
                <span>{t("Commencer maintenant (Gratuit)", "Start Now (Free)")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#features"
                className="px-6 py-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-900/80 hover:bg-white dark:hover:bg-stone-800 text-sm font-semibold text-stone-800 dark:text-stone-200 shadow-sm transition-all"
              >
                {t("Explorer les fonctionnalités", "Explore Features")}
              </a>
            </div>

            {/* Trust Pill Bar */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500 dark:text-stone-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t("Zéro Hallucination garanti", "Zero Hallucination Guarantee")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t("Scoring ATS en temps réel", "Real-Time ATS Scoring")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t("Clé Groq dédiée (BYOK)", "Dedicated Groq Key (BYOK)")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t("100% Gratuit pour étudiants", "100% Free for Students")}</span>
              </div>
            </div>
          </div>

          {/* ── Visual Demo Cockpit Mockup ── */}
          <div className="mt-14 max-w-5xl mx-auto rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-[#FAF7F2] dark:bg-stone-950 p-5 sm:p-7 space-y-6">
              {/* Cockpit Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 text-primary flex items-center justify-center font-bold">
                    <Radar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">
                      {t("Radar Intelligent — Analyse Déterministe d'Offre", "Intelligent Radar — Deterministic Job Analysis")}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Thales &bull; Stage Ingénieur DevOps & Cloud Kubernetes &bull; Sophia Antipolis, FR
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t("Match ATS : 94%", "ATS Match: 94%")}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-stone-200 dark:bg-stone-800 text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                    FR
                  </span>
                </div>
              </div>

              {/* 3 Interactive Showcase Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                {/* 1: ATS Analysis */}
                <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      {t("Compétences Clés Validées", "Verified Key Skills")}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">5 / 5</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Kubernetes", "Docker", "Terraform", "CI/CD GitHub Actions", "FastAPI"].map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-500 pt-1">
                    {t("Toutes extraites de vos projets réels enregistrés.", "All extracted from your documented real projects.")}
                  </p>
                </div>

                {/* 2: Vector CV */}
                <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      {t("Studio CV Vectoriel A4", "Vector A4 CV Studio")}
                    </span>
                    <span className="text-[10px] text-primary font-bold">{t("1 Page Exacte", "Exact 1 Page")}</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-stone-600 dark:text-stone-300">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span>{t("Mise en page typographique calibrée", "Calibrated typographic layout")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span>{t("Bascule FR / EN en 1 clic", "1-click FR / EN toggle")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span>{t("Compilation PDF vectoriel fidèle", "High-fidelity vector PDF export")}</span>
                    </div>
                  </div>
                </div>

                {/* 3: Directives & Letter */}
                <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      {t("Lettre Chirurgicale", "Surgical Cover Letter")}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">{t("Sobre & Réel", "Clean & Factual")}</span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 italic leading-relaxed line-clamp-3">
                    &laquo; Lors du déploiement de l'architecture microservices d'ArcApply, j'ai configuré les clusters Kubernetes et automatisé les pipelines CI/CD... &raquo;
                  </p>
                  <p className="text-[10px] text-stone-500">
                    {t("Zéro blabla générique, arguments prouvés.", "No generic fluff, proven arguments.")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
      </section>

      {/* ── Section: Que offre la plateforme ? ── */}
      <section id="features" className="py-20 bg-stone-100/70 dark:bg-stone-900/40 border-y border-stone-200/80 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>{t("Architecture & Fonctionnalités", "Architecture & Features")}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-stone-900 dark:text-white">
              {t("Que offre la plateforme ArcApply ?", "What Does ArcApply Offer?")}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {t(
                "Un écosystème complet conçu par des ingénieurs pour des ingénieurs, axé sur la précision, la personnalisation réelle et le gain de temps.",
                "A complete suite engineered for engineers, focused on high precision, authentic customization, and maximum efficiency."
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Radar */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm hover:border-orange-300 dark:hover:border-orange-600 transition-all">
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-primary flex items-center justify-center">
                <Radar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-display text-stone-900 dark:text-stone-100">
                {t("Radar Multi-Plateformes Intelligent", "Smart Multi-Board Job Radar")}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                {t(
                  "Scrutateur automatique sur LinkedIn, Welcome to the Jungle, HelloWork et Tanitjobs. Déduplication d'offres par fingerprint sémantique, pagination continue et filtres multi-villes France & Tunisie.",
                  "Automated radar across LinkedIn, Welcome to the Jungle, HelloWork, and Tanitjobs. Deduplication by semantic fingerprint, continuous pagination, and multi-location filters."
                )}
              </p>
            </div>

            {/* Feature 2: ATS Engine */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm hover:border-orange-300 dark:hover:border-orange-600 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-display text-stone-900 dark:text-stone-100">
                {t("Scoring ATS Déterministe", "Deterministic ATS Match Scoring")}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                {t(
                  "Algorithme précis comparant les prérequis de l'offre à vos compétences attestées. Visualisez votre pourcentage d'adéquation avant de postuler et comblez les mots-clés prioritaires.",
                  "Accurate comparison engine weighing job requirements against your certified competencies. View your match score before applying and cover priority keywords."
                )}
              </p>
            </div>

            {/* Feature 3: Studio CV */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm hover:border-orange-300 dark:hover:border-orange-600 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-display text-stone-900 dark:text-stone-100">
                {t("Studio CV Vectoriel A4 Direct", "Direct Vector A4 CV Studio")}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                {t(
                  "Édition directe au format A4 sur une feuille dynamique. Insertion de blocs (+ Stage, + Formation, + Projet, + Compétences), bascule instantanée FR/EN et compilation PDF vectorielle.",
                  "In-place editing directly on a calibrated A4 sheet. Single-click insertion of stages, education, projects, skills, instant FR/EN language toggle, and identical PDF download."
                )}
              </p>
            </div>

            {/* Feature 4: Cover Letter */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm hover:border-orange-300 dark:hover:border-orange-600 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-display text-stone-900 dark:text-stone-100">
                {t("Rédacteur Sobre Zéro-Hallucination", "Zero-Hallucination Letter Synthesis")}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                {t(
                  "Fini les lettres génériques qui débutent par « Passionné depuis mon plus jeune âge ». Des lettres sobres, percutantes, qui citent vos vraies réalisations et vos projets techniques.",
                  "No more fluff starting with cliches. Clean, professional letters that specifically quote your actual projects, real technical stack, and problem-solving experience."
                )}
              </p>
            </div>

            {/* Feature 5: Kanban Pipeline */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm hover:border-orange-300 dark:hover:border-orange-600 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <KanbanSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-display text-stone-900 dark:text-stone-100">
                {t("Pipeline Kanban & Relances J+7", "Kanban Pipeline & Day+7 Follow-ups")}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                {t(
                  "Suivi d'avancement de toutes vos candidatures (À postuler, Postulé, En attente, Entretien, Offre). Alertes discrètes lorsqu'une relance opportune est conseillée à 7 jours.",
                  "Stage-by-stage pipeline tracking (To Apply, Applied, Pending, Interview, Offer). Subtle reminders when a well-timed follow-up email is recommended after 7 days."
                )}
              </p>
            </div>

            {/* Feature 6: BYOK & Isolation */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm hover:border-orange-300 dark:hover:border-orange-600 transition-all">
              <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-display text-stone-900 dark:text-stone-100">
                {t("BYOK Groq Gratuit & Confidentialité", "Free BYOK Groq & Complete Privacy")}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                {t(
                  "Multi-tenant étanche : renseignez votre propre clé Groq gratuite pour obtenir 200 000 tokens/jour dédiés. Vos données de profil et vos candidatures restent strictement privées.",
                  "Isolated multi-tenancy: attach your personal free Groq key for 200,000 private tokens/day. Your profile data and application history remain 100% confidential."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Comment ça marche (Workflow en 3 étapes) ── */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t("Parcours Fluide & Simple", "Fluid & Seamless Journey")}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-stone-900 dark:text-white">
              {t("Comment ça marche en 3 étapes ?", "How Does It Work in 3 Steps?")}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {t(
                "De la création de votre compte jusqu'à l'entretien, en moins de 10 minutes.",
                "From initial account setup to recruiter interviews in under 10 minutes."
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
                  "Accédez aux offres de stages PFE fraîchement indexées. Le moteur calcule instantanément votre score ATS et met en évidence la correspondance exacte avec vos compétences.",
                  "Access freshly indexed internship listings. The engine computes your ATS match score instantly and highlights exact matches with your engineering skillset."
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
      <section id="comparison" className="py-20 bg-stone-100/70 dark:bg-stone-900/40 border-y border-stone-200/80 dark:border-stone-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-stone-900 dark:text-white">
              {t("Pourquoi choisir ArcApply ?", "Why Choose ArcApply?")}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300">
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
                    {t("Format du CV", "CV Layout Format")}
                  </td>
                  <td className="py-3.5 px-5 text-stone-500">
                    {t("Modèles Word désalignés, rejetés par l'ATS", "Unaligned Word files, rejected by ATS")}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-emerald-700 dark:text-emerald-400">
                    {t("A4 Vectoriel typographique pur & ATS-friendly", "Pure A4 vector typography & ATS-friendly")}
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
                    {t("Périmètre géographique", "Geographic Scope")}
                  </td>
                  <td className="py-3.5 px-5 text-stone-500">
                    {t("Générique US/anglophone sans filtres PFE", "Generic US boards without PFE filters")}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-emerald-700 dark:text-emerald-400">
                    {t("Spécialisé France & Tunisie (PFE Ingénieur)", "Specialized France & Tunisia (PFE)")}
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
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-primary text-xs font-bold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t("Foire Aux Questions", "Frequently Asked Questions")}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-stone-900 dark:text-white">
              {t("Questions Fréquemment Posées", "Got Questions? We Have Answers.")}
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = activeFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden transition-all shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 font-display hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 transition-transform shrink-0 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-100 dark:border-stone-800/60 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section: Contact & Support ── */}
      <section id="contact" className="py-20 bg-stone-100/70 dark:bg-stone-900/40 border-t border-stone-200/80 dark:border-stone-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold">
              <Mail className="w-3.5 h-3.5" />
              <span>{t("Contact & Échange", "Contact & Inquiries")}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-stone-900 dark:text-white">
              {t("Une question ? Écrivez-nous", "Have a Question? Reach Out")}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {t(
                "Partenariat école, suggestion de fonctionnalité ou assistance : nous répondons sous 24h.",
                "University partnership, feature feedback or support: we reply within 24h."
              )}
            </p>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-10 shadow-sm max-w-2xl mx-auto">
            {contactSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
                  {t("Message transmis avec succès !", "Message sent successfully!")}
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  {t(
                    "Merci de nous avoir contactés. Notre équipe d'ingénierie reviendra vers vous très rapidement.",
                    "Thank you for contacting us. Our engineering team will get back to you shortly."
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setContactSubmitted(false);
                    setContactMessage("");
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors"
                >
                  {t("Envoyer un autre message", "Send another message")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      {t("Votre Nom", "Your Name")}
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder={t("Ex. Louay Zorai", "e.g. Louay Zorai")}
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 dark:text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      {t("Votre Email", "Your Email")}
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="nom@universite.tn"
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 dark:text-stone-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    {t("Sujet", "Subject")}
                  </label>
                  <select
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 dark:text-stone-100 cursor-pointer"
                  >
                    <option value="question">{t("Question générale sur ArcApply", "General question about ArcApply")}</option>
                    <option value="pfe">{t("Accompagnement Stage PFE France / TN", "PFE Internship support France / TN")}</option>
                    <option value="partnership">{t("Partenariat École / Université", "University / School Partnership")}</option>
                    <option value="feature">{t("Suggestion d'amélioration", "Feature feedback")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    {t("Message", "Message")}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={t(
                      "Expliquez-nous votre besoin ou posez votre question en détail...",
                      "Explain your request or share your question..."
                    )}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-stone-900 dark:text-stone-100 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {contactSubmitting
                      ? t("Envoi en cours...", "Sending...")
                      : t("Envoyer mon message", "Send Message")}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Bottom Call To Action Banner ── */}
      <section className="py-16 bg-gradient-to-r from-stone-900 via-stone-800 to-orange-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-stone-100">
            {t(
              "Prêt à multiplier par 3 vos retours d'entretiens ?",
              "Ready to Triple Your Recruiter Interview Callbacks?"
            )}
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed">
            {t(
              "Rejoignez les étudiants ingénieurs qui postulent plus intelligemment, sans stress et avec des dossiers irréprochables.",
              "Join engineering students who apply smarter, without burnout and with impeccable dossiers."
            )}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-3.5 rounded-xl bg-primary hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t("Créer mon compte gratuitement", "Create Free Account")}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-stone-900 dark:text-stone-100 font-display">ArcApply</span>
            <span>&bull; {t("Copilote d'application ingénieur", "Engineering application copilot")}</span>
          </div>
          <div className="flex items-center gap-4 text-stone-600 dark:text-stone-400">
            <a href="#features" className="hover:text-primary transition-colors">{t("Fonctionnalités", "Features")}</a>
            <a href="#faq" className="hover:text-primary transition-colors">{t("FAQ", "FAQ")}</a>
            <a href="#contact" className="hover:text-primary transition-colors">{t("Contact", "Contact")}</a>
          </div>
          <p className="text-[11px] text-stone-400">
            &copy; {new Date().getFullYear()} ArcApply. {t("Tous droits réservés.", "All rights reserved.")}
          </p>
        </div>
      </footer>

      {/* ── Auth Modal Popup ── */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors"
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
