"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchProfile,
  updateProfile,
  fetchProfileStatus,
  MasterProfile,
  ProfileCompletenessStatus,
} from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { useAppLanguage } from "@/lib/language-context";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ArrowRight, Loader2, LogOut } from "lucide-react";

export const ONBOARDING_STEPS = [
  {
    step: 1,
    id: "identity",
    title: { fr: "Nom et Prénom", en: "Full Name" },
    subtitle: { fr: "Renseignez votre prénom et votre nom de famille.", en: "Enter your first name and last name." },
    path: "/onboarding/step-1",
  },
  {
    step: 2,
    id: "contact",
    title: { fr: "Coordonnées de contact", en: "Contact Details" },
    subtitle: { fr: "Renseignez votre email, numéro de téléphone et ville.", en: "Enter your email, phone number and city." },
    path: "/onboarding/step-2",
  },
  {
    step: 3,
    id: "links",
    title: { fr: "Présence en ligne", en: "Online Profiles" },
    subtitle: { fr: "Ajoutez vos liens professionnels (LinkedIn, GitHub, portfolio).", en: "Add your professional links (LinkedIn, GitHub, portfolio)." },
    path: "/onboarding/step-3",
  },
  {
    step: 4,
    id: "groq",
    title: { fr: "Clé d'API Groq", en: "Groq API Key" },
    subtitle: { fr: "Renseignez votre clé d'API personnelle si vous le souhaitez.", en: "Enter your personal API key if you wish." },
    path: "/onboarding/step-4",
  },
  {
    step: 5,
    id: "headline",
    title: { fr: "Titre professionnel", en: "Professional Headline" },
    subtitle: { fr: "Définissez votre titre d'accroche pour vos candidatures.", en: "Define your professional headline for applications." },
    path: "/onboarding/step-5",
  },
  {
    step: 6,
    id: "bio",
    title: { fr: "Bio & Présentation", en: "Bio & Presentation" },
    subtitle: { fr: "Présentez brièvement votre parcours et vos aspirations.", en: "Briefly present your background and goals." },
    path: "/onboarding/step-6",
  },
  {
    step: 7,
    id: "education",
    title: { fr: "Formations & Diplômes", en: "Education & Degrees" },
    subtitle: { fr: "Ajoutez votre école d'ingénieurs et votre diplôme préparé.", en: "Add your engineering school and degree." },
    path: "/onboarding/step-7",
  },
  {
    step: 8,
    id: "experience",
    title: { fr: "Expériences professionnelles", en: "Work Experience" },
    subtitle: { fr: "Renseignez vos stages ou expériences précédentes.", en: "Enter your previous internships or work experience." },
    path: "/onboarding/step-8",
  },
  {
    step: 9,
    id: "projects",
    title: { fr: "Projets académiques & personnels", en: "Academic & Personal Projects" },
    subtitle: { fr: "Mettez en valeur vos réalisations techniques clés.", en: "Highlight your key technical projects." },
    path: "/onboarding/step-9",
  },
  {
    step: 10,
    id: "skills",
    title: { fr: "Compétences techniques", en: "Technical Skills" },
    subtitle: { fr: "Listez les compétences techniques maîtrisées.", en: "List the technical skills you have mastered." },
    path: "/onboarding/step-10",
  },
  {
    step: 11,
    id: "languages",
    title: { fr: "Langues", en: "Languages" },
    subtitle: { fr: "Indiquez les langues que vous pratiquez.", en: "Specify the languages you speak." },
    path: "/onboarding/step-11",
  },
  {
    step: 12,
    id: "ready",
    title: { fr: "Profil configuré", en: "Profile Ready" },
    subtitle: { fr: "Vos informations sont enregistrées avec succès.", en: "Your profile has been saved successfully." },
    path: "/onboarding/step-12",
  },
];

interface OnboardingContextType {
  profile: MasterProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<MasterProfile | null>>;
  status: ProfileCompletenessStatus | null;
  isLoading: boolean;
  isSaving: boolean;
  saveCurrentStep: (updatedData?: Partial<MasterProfile>) => Promise<boolean>;
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
  const { logout } = useAuth();
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
          // No prefilled dummy values
          setProfile({
            ...profData,
            search_mode: "PFE" as const,
          });
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
  }, []);

  const saveCurrentStep = async (updatedData?: Partial<MasterProfile>): Promise<boolean> => {
    if (!profile) return false;
    try {
      setIsSaving(true);
      const merged = { ...profile, ...(updatedData || {}), search_mode: "PFE" as const };
      const saved = await updateProfile(merged);
      const updatedStatus = await fetchProfileStatus();
      setProfile(saved);
      setStatus(updatedStatus);
      return true;
    } catch (err: any) {
      alert(t(`Erreur d'enregistrement : ${err.message || "Problème serveur"}`, `Save error: ${err.message || "Server problem"}`));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const currentStep = ONBOARDING_STEPS[stepNumber - 1] || ONBOARDING_STEPS[0];

  return (
    <OnboardingContext.Provider
      value={{
        profile,
        setProfile,
        status,
        isLoading,
        isSaving,
        saveCurrentStep,
        currentStepIndex: stepNumber,
      }}
    >
      <div className="min-h-screen bg-[#EA580C] flex flex-col font-sans selection:bg-orange-200 selection:text-orange-950">
        {/* Top Header */}
        <header className="border-b border-orange-600/40 bg-[#EA580C] sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity">
              <img
                src="/brand/arcapply-symbol-white.svg"
                alt="ArcApply Logo"
                className="w-7 h-7 object-contain"
              />
              <span className="text-base font-extrabold tracking-tight text-white font-display">
                ArcApply
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher className="bg-white/15 border-white/20 text-white" />

              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all cursor-pointer"
                title={t("Ignorer l'onboarding et accéder au cockpit", "Skip onboarding and access cockpit")}
              >
                <span>{t("Ignorer", "Skip")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={t("Déconnexion", "Sign out")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center">
          <div className="bg-[#FAF6F0] rounded-2xl border border-[#E8DEC8] p-6 sm:p-8 shadow-xl text-stone-900">
            {/* Current Step Title Only */}
            <div className="mb-6 pb-4 border-b border-[#EADFCE]">
              <p className="text-xs font-semibold text-[#EA580C] uppercase tracking-wider mb-1">
                {t(`Étape ${stepNumber} sur ${ONBOARDING_STEPS.length}`, `Step ${stepNumber} of ${ONBOARDING_STEPS.length}`)}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-display">
                {currentStep.title[language]}
              </h1>
              {currentStep.subtitle && (
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  {currentStep.subtitle[language]}
                </p>
              )}
            </div>

            {/* Form Content */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#EA580C]" />
                <p className="text-xs font-medium">{t("Chargement...", "Loading...")}</p>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </OnboardingContext.Provider>
  );
}
