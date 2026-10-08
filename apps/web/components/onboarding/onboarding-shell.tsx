"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  fetchProfile,
  updateProfile,
  fetchProfileStatus,
  completeOnboarding,
  MasterProfile,
  ProfileCompletenessStatus,
  SKILL_CATEGORIES,
} from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { useAppLanguage } from "@/lib/language-context";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import {
  User,
  Compass,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Code2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  Check,
  ShieldCheck,
  Zap,
  LogOut,
} from "lucide-react";

export const ONBOARDING_STEPS = [
  {
    step: 1,
    id: "contact",
    name: { fr: "Coordonnées", en: "Contact" },
    title: { fr: "Informations Personnelles & Contact", en: "Personal Information & Contact" },
    subtitle: { fr: "Renseignez vos coordonnées de contact pour figurer en haut de vos candidatures.", en: "Enter your contact details so they appear at the top of your applications." },
    icon: User,
    path: "/onboarding/step-1",
  },
  {
    step: 2,
    id: "objective",
    name: { fr: "Objectif & Bio", en: "Goal & Bio" },
    title: { fr: "Objectif de Recherche & Accroche", en: "Search Goal & Hook" },
    subtitle: { fr: "Définissez votre cible PFE et l'accroche qui attirera l'attention des recruteurs.", en: "Define your PFE target and the hook that will catch recruiters' attention." },
    icon: Compass,
    path: "/onboarding/step-2",
  },
  {
    step: 3,
    id: "education",
    name: { fr: "Formation", en: "Education" },
    title: { fr: "Écoles & Diplômes d'Ingénieur", en: "Engineering Schools & Degrees" },
    subtitle: { fr: "Ajoutez votre école d'ingénieurs et votre formation académique actuelle.", en: "Add your engineering school and your current academic program." },
    icon: GraduationCap,
    path: "/onboarding/step-3",
  },
  {
    step: 4,
    id: "experience",
    name: { fr: "Expériences", en: "Experience" },
    title: { fr: "Stages & Expériences Précédentes", en: "Internships & Previous Experience" },
    subtitle: { fr: "Mettez en valeur vos stages ouvrier, technicien ou développeur passés.", en: "Highlight your past worker, technician or developer internships." },
    icon: Briefcase,
    path: "/onboarding/step-4",
  },
  {
    step: 5,
    id: "projects",
    name: { fr: "Projets", en: "Projects" },
    title: { fr: "Projets Académiques & Personnels", en: "Academic & Personal Projects" },
    subtitle: { fr: "Illustrez vos compétences concrètes avec vos réalisations techniques clés.", en: "Show your hands-on skills with your key technical achievements." },
    icon: FolderGit2,
    path: "/onboarding/step-5",
  },
  {
    step: 6,
    id: "skills",
    name: { fr: "Compétences", en: "Skills" },
    title: { fr: "Compétences Techniques & Langues", en: "Technical Skills & Languages" },
    subtitle: { fr: "Listez votre stack technologique et vos niveaux de langues étrangères.", en: "List your tech stack and your foreign language levels." },
    icon: Code2,
    path: "/onboarding/step-6",
  },
  {
    step: 7,
    id: "ready",
    name: { fr: "Lancement", en: "Launch" },
    title: { fr: "Profil Prêt & Découverte du Cockpit", en: "Profile Ready & Cockpit Tour" },
    subtitle: { fr: "Votre profil est validé ! Découvrez comment ArcApply propulse votre recherche de stage.", en: "Your profile is validated! See how ArcApply boosts your internship search." },
    icon: ShieldCheck,
    path: "/onboarding/step-7",
  },
];

export const DEMO_PROFILE_DATA: Partial<MasterProfile> = {
  full_name: "Yassine Ben Salah",
  email: "yassine.bensalah@insat.ucar.tn",
  phone: "+33 6 42 18 95 30",
  location: "Paris, France / Tunis, Tunisie",
  headline: "Élève-Ingénieur Logiciel & Cloud | Recherche Stage PFE (Février - Juillet 2027)",
  headline_fr: "Élève-Ingénieur Logiciel & Cloud | Recherche Stage PFE (Février - Juillet 2027)",
  headline_en: "Software & Cloud Engineering Student | Seeking Final Year Internship (PFE 2027)",
  bio: "Étudiant ingénieur en dernière année à l'INSAT, passionné par les systèmes distribués, le cloud natif et l'automatisation backend. Rigoureux, autonome et habitué aux environnements agiles.",
  bio_fr: "Étudiant ingénieur en dernière année à l'INSAT, passionné par les systèmes distribués, le cloud natif et l'automatisation backend. Rigoureux, autonome et habitué aux environnements agiles.",
  bio_en: "Final-year software engineering student at INSAT, enthusiastic about distributed systems, cloud-native tech, and backend automation.",
  linkedin_url: "https://linkedin.com/in/yassine-bensalah",
  github_url: "https://github.com/yassine-bs",
  website_url: "https://yassine-portfolio.dev",
  search_mode: "PFE",
  educations: [
    {
      school: "INSAT — Institut National des Sciences Appliquées et de Technologie",
      degree: "Diplôme National d'Ingénieur",
      degree_fr: "Diplôme National d'Ingénieur",
      degree_en: "National Master's Degree in Software Engineering",
      field_of_study: "Génie Logiciel & Systèmes d'Information",
      field_of_study_fr: "Génie Logiciel & Systèmes d'Information",
      field_of_study_en: "Software Engineering & Distributed Systems",
      start_date: "Septembre 2022",
      end_date: "Juin 2027",
      description: "Cursus d'excellence d'ingénieur d'État : architecture logicielle avancée, cloud computing, sécurité et DevOps.",
      description_fr: "Cursus d'excellence d'ingénieur d'État : architecture logicielle avancée, cloud computing, sécurité et DevOps.",
      description_en: "Elite engineering curriculum: software architecture, cloud platforms, networks, and distributed databases.",
    },
  ],
  experiences: [
    {
      company: "Thales",
      role: "Stagiaire Ingénieur Cloud & Backend",
      role_fr: "Stagiaire Ingénieur Cloud & Backend",
      role_en: "Cloud & Backend Software Engineering Intern",
      location: "Vélizy-Villacoublay, France",
      start_date: "Juin 2024",
      end_date: "Août 2024",
      description: "Développement de microservices de télémétrie en FastAPI et conteneurisation Docker. Optimisation du pipeline CI/CD GitLab.",
      description_fr: "Développement de microservices de télémétrie en FastAPI et conteneurisation Docker. Optimisation du pipeline CI/CD GitLab.",
      description_en: "Built telemetry microservices in FastAPI with Docker. Streamlined GitLab CI/CD pipelines.",
      technologies: ["FastAPI", "Docker", "GitLab CI", "PostgreSQL"],
      experience_type: "stage",
    },
  ],
  projects: [
    {
      title: "ArcApply Copilote Candidatures",
      title_fr: "ArcApply Copilote Candidatures",
      title_en: "ArcApply Application Copilot",
      role: "Architecte & Développeur Full Stack",
      role_fr: "Architecte & Développeur Full Stack",
      role_en: "Lead Full Stack Developer",
      description: "Moteur intelligent de ciblage d'offres de stages et d'adaptation de CV déterministe sans hallucination.",
      description_fr: "Moteur intelligent de ciblage d'offres de stages et d'adaptation de CV déterministe sans hallucination.",
      description_en: "High-performance job matching engine and deterministic CV tailor without AI hallucinations.",
      url: "https://github.com/yassine-bs/arcapply",
      technologies: ["FastAPI", "SQLModel", "Next.js", "Tailwind CSS"],
    },
  ],
  skills: [
    { name: "Python", category: "Langages & Scripting", level: "Avancé" },
    { name: "TypeScript", category: "Langages & Scripting", level: "Intermédiaire" },
    { name: "FastAPI", category: "Frameworks", level: "Avancé" },
    { name: "Next.js", category: "Frameworks", level: "Avancé" },
    { name: "PostgreSQL", category: "Bases de données", level: "Avancé" },
    { name: "Docker", category: "Conteneurisation & Orchestration", level: "Avancé" },
    { name: "Git", category: "Versioning & Méthodes", level: "Avancé" },
  ],
  languages: [
    { name: "Français", level: "Courant / Bilingue (C2)" },
    { name: "Anglais", level: "Professionnel / Technique (C1)" },
    { name: "Arabe", level: "Langue maternelle" },
  ],
};

interface OnboardingContextType {
  profile: MasterProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<MasterProfile | null>>;
  status: ProfileCompletenessStatus | null;
  isLoading: boolean;
  isSaving: boolean;
  saveCurrentStep: (updatedData?: Partial<MasterProfile>) => Promise<boolean>;
  fillDemoData: (stepNumber?: number) => void;
  currentStepIndex: number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingShell");
  }
  return context;
}

export function OnboardingShell({
  children,
  stepNumber,
}: {
  children: React.ReactNode;
  stepNumber: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, language } = useAppLanguage();

  const handleSkip = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("arcapply_onboarding_skipped", "true");
    }
    router.push("/");
  };
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [status, setStatus] = useState<ProfileCompletenessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        setIsLoading(true);
        const [profData, statusData] = await Promise.all([
          fetchProfile(),
          fetchProfileStatus(),
        ]);
        if (isMounted) {
          // Pre-populate user name & email if profile is still empty
          const populated = {
            ...profData,
            full_name: profData.full_name || user?.full_name || "",
            email: profData.email || user?.username || "",
            search_mode: "PFE" as const,
          };
          setProfile(populated);
          setStatus(statusData);
        }
      } catch (err) {
        console.error("Failed to load profile for onboarding:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const saveCurrentStep = async (updatedData?: Partial<MasterProfile>): Promise<boolean> => {
    if (!profile) return false;
    try {
      setIsSaving(true);
      const merged = { ...profile, ...(updatedData || {}), search_mode: "PFE" as const };
      const saved = await updateProfile(merged);
      const updatedStatus = await fetchProfileStatus();
      setProfile(saved);
      setStatus(updatedStatus);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      return true;
    } catch (err: any) {
      alert(t(`Erreur d'enregistrement : ${err.message || "Problème serveur"}`, `Save error: ${err.message || "Server problem"}`));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const fillDemoData = (stepNum = stepNumber) => {
    if (!profile) return;
    let patch: Partial<MasterProfile> = {};

    switch (stepNum) {
      case 1:
        patch = {
          full_name: DEMO_PROFILE_DATA.full_name,
          email: DEMO_PROFILE_DATA.email,
          phone: DEMO_PROFILE_DATA.phone,
          location: DEMO_PROFILE_DATA.location,
          linkedin_url: DEMO_PROFILE_DATA.linkedin_url,
          github_url: DEMO_PROFILE_DATA.github_url,
          website_url: DEMO_PROFILE_DATA.website_url,
        };
        break;
      case 2:
        patch = {
          headline: DEMO_PROFILE_DATA.headline,
          headline_fr: DEMO_PROFILE_DATA.headline_fr,
          headline_en: DEMO_PROFILE_DATA.headline_en,
          bio: DEMO_PROFILE_DATA.bio,
          bio_fr: DEMO_PROFILE_DATA.bio_fr,
          bio_en: DEMO_PROFILE_DATA.bio_en,
        };
        break;
      case 3:
        patch = { educations: DEMO_PROFILE_DATA.educations || [] };
        break;
      case 4:
        patch = { experiences: DEMO_PROFILE_DATA.experiences || [] };
        break;
      case 5:
        patch = { projects: DEMO_PROFILE_DATA.projects || [] };
        break;
      case 6:
        patch = {
          skills: DEMO_PROFILE_DATA.skills || [],
          languages: DEMO_PROFILE_DATA.languages || [],
        };
        break;
      default:
        patch = { ...DEMO_PROFILE_DATA };
    }

    setProfile({ ...profile, ...patch });
  };

  const currentStep = ONBOARDING_STEPS[stepNumber - 1] || ONBOARDING_STEPS[0];
  const progressPct = Math.round((stepNumber / ONBOARDING_STEPS.length) * 100);

  // Garde l'étape courante visible dans la barre d'étapes défilante (mobile)
  const stepperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = stepperRef.current;
    const current = container?.querySelector<HTMLElement>('[data-current-step="true"]');
    if (!container || !current) return;
    container.scrollLeft = current.offsetLeft - container.clientWidth / 2 + current.clientWidth / 2;
  }, [stepNumber]);

  return (
    <OnboardingContext.Provider
      value={{
        profile,
        setProfile,
        status,
        isLoading,
        isSaving,
        saveCurrentStep,
        fillDemoData,
        currentStepIndex: stepNumber,
      }}
    >
      <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#12100E] flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900 pb-16">
        {/* Top Header */}
        <header className="border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md sticky top-0 z-20 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3">
            {/* Brand Logo & Context */}
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity">
                <img
                  src="/logo.png"
                  alt="ArcApply Logo"
                  className="w-8 h-8 object-contain drop-shadow-xs"
                />
                <div className="hidden sm:block">
                  <span className="text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 font-display block leading-none">
                    ArcApply
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium tracking-wide">
                    {t("Assistant Candidatures", "Application Assistant")}
                  </span>
                </div>
              </Link>

              <div className="h-5 w-px bg-stone-200 dark:bg-stone-700 hidden sm:block mx-1" />

              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-display truncate">
                  {t("Configuration Initiale", "Initial Setup")}
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 shrink-0">
                  {t(`Étape ${stepNumber}/${ONBOARDING_STEPS.length}`, `Step ${stepNumber}/${ONBOARDING_STEPS.length}`)}
                </span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Fill Demo Data (desktop) */}
              <button
                type="button"
                onClick={() => fillDemoData(stepNumber)}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800/60 bg-orange-50/80 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-800 dark:text-orange-300 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                title={t("Injecter un exemple d'étudiant ingénieur pour cette étape", "Fill in a sample engineering student for this step")}
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span>{t("Exemple PFE", "PFE Example")}</span>
              </button>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Skip and explore platform button */}
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700/80 text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-xs transition-all cursor-pointer"
                title={t("Ignorer l'onboarding et accéder directement au cockpit", "Skip onboarding and access the cockpit directly")}
              >
                <span className="hidden sm:inline">{t("Ignorer et explorer la plateforme", "Skip and explore the platform")}</span>
                <span className="sm:hidden">{t("Ignorer", "Skip")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Logout button */}
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title={t("Déconnexion", "Sign out")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </header>

        {/* Stepper Pipeline Navigation Bar */}
        <div className="bg-white dark:bg-stone-900 border-b border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div ref={stepperRef} className="relative max-w-6xl mx-auto px-4 sm:px-6 py-2.5 overflow-x-auto scrollbar-none">
            <nav className="flex items-center gap-2 min-w-max">
              {ONBOARDING_STEPS.map((s, idx) => {
                const Icon = s.icon;
                const isCurrent = s.step === stepNumber;
                const isPassed = s.step < stepNumber;

                return (
                  <React.Fragment key={s.id}>
                    {idx > 0 && (
                      <span className="text-stone-300 dark:text-stone-500 text-xs font-mono">→</span>
                    )}
                    <Link
                      href={s.path}
                      data-current-step={isCurrent ? "true" : undefined}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isCurrent
                          ? "bg-primary text-white shadow-xs font-semibold"
                          : isPassed
                          ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/60"
                          : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
                      }`}
                    >
                      {isPassed ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{s.step}. {s.name[language]}</span>
                    </Link>
                  </React.Fragment>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 flex-1">
          {/* Step Header Banner */}
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-artisan flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
                <span>{t(`Étape ${stepNumber} / ${ONBOARDING_STEPS.length}`, `Step ${stepNumber} / ${ONBOARDING_STEPS.length}`)}</span>
                <span>•</span>
                <span>{t(`${progressPct}% Complété`, `${progressPct}% Complete`)}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 font-display">
                {currentStep.title[language]}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
                {currentStep.subtitle[language]}
              </p>
            </div>

            <button
              type="button"
              onClick={() => fillDemoData(stepNumber)}
              className="sm:hidden self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>{t("Remplir exemple", "Fill example")}</span>
            </button>
          </div>

          {/* Form Content */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-medium">{t("Chargement de votre profil en cours...", "Loading your profile...")}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {children}
            </div>
          )}
        </main>
      </div>
    </OnboardingContext.Provider>
  );
}
