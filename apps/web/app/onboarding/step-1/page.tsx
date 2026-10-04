"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function Step1Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t } = useAppLanguage();
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profile.full_name?.trim()) {
      setError(t("Veuillez renseigner votre nom complet.", "Please enter your full name."));
      return;
    }
    if (!profile.email?.trim() || !profile.email.includes("@")) {
      setError(t("Veuillez renseigner une adresse email valide.", "Please enter a valid email address."));
      return;
    }

    const success = await saveCurrentStep();
    if (success) {
      router.push("/onboarding/step-2");
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-artisan p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-200/60 dark:border-stone-800">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-center text-primary">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
              {t("Identité & Coordonnées Principales", "Identity & Main Contact Details")}
            </h3>
            <p className="text-xs text-stone-500">
              {t("Ces informations apparaîtront dans l'en-tête de votre CV et sur vos lettres de motivation.", "This information will appear in the header of your CV and on your cover letters.")}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
              <span>{t("Nom complet *", "Full name *")}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder={t("Ex. Alexandre Dupont", "e.g. Alex Johnson")}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
              <span>{t("Email de contact *", "Contact email *")}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={profile.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder={t("Ex. alexandre.dupont@ecole.fr", "e.g. alex.johnson@school.edu")}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
              <span>{t("Numéro de téléphone", "Phone number")}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder={t("Ex. +33 6 12 34 56 78", "e.g. +33 6 12 34 56 78")}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
              <span>{t("Localisation cible (Stage PFE) *", "Target location (PFE internship) *")}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={profile.location || ""}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder={t("Ex. Paris, France / Tunis, Tunisie", "e.g. Paris, France / Tunis, Tunisia")}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400"
              />
            </div>
          </div>
        </div>

        {/* Liens professionnels */}
        <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800 space-y-4">
          <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
            {t("Présence en ligne & Portfolios", "Online Presence & Portfolios")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                {t("Profil LinkedIn", "LinkedIn profile")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Linkedin className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={profile.linkedin_url || ""}
                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:bg-white focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                {t("Profil GitHub", "GitHub profile")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Github className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={profile.github_url || ""}
                  onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:bg-white focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                {t("Site Web / Portfolio", "Website / Portfolio")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={profile.website_url || ""}
                  onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                  placeholder={t("https://mon-portfolio.dev", "https://my-portfolio.dev")}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:bg-white focus:outline-none focus:border-primary text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-stone-500">
          {t("* Champs obligatoires pour la conformité ATS", "* Required fields for ATS compliance")}
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-orange-700 text-white font-semibold text-sm transition-all shadow-md shadow-orange-600/25 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("Enregistrement...", "Saving...")}</span>
            </>
          ) : (
            <>
              <span>{t("Étape suivante : Objectif & Bio", "Next step: Goal & Bio")}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function OnboardingStep1Page() {
  return (
    <OnboardingShell stepNumber={1}>
      <Step1Content />
    </OnboardingShell>
  );
}
