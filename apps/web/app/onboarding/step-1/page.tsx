"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, useOnboarding } from "@/components/onboarding/onboarding-shell";
import { useAppLanguage } from "@/lib/language-context";
import { testGroqKey } from "@/lib/api";
import { localizeServerMessage } from "@/lib/i18n";
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
  Key,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

function Step1Content() {
  const router = useRouter();
  const { profile, setProfile, saveCurrentStep, isSaving } = useOnboarding();
  const { t } = useAppLanguage();
  const [error, setError] = useState<string | null>(null);

  const [showGroqKey, setShowGroqKey] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestResult, setGroqTestResult] = useState<{
    status: "idle" | "success" | "error";
    message?: string;
  }>({ status: "idle" });

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

  const handleTestKey = async () => {
    if (!profile.groq_api_key?.trim()) {
      setGroqTestResult({
        status: "error",
        message: t("Veuillez d'abord saisir une clé d'API Groq (gsk_...).", "Please enter a Groq API key first (gsk_...)."),
      });
      return;
    }
    try {
      setTestingGroq(true);
      setGroqTestResult({ status: "idle" });
      const res = await testGroqKey(profile.groq_api_key, profile.groq_model || undefined);
      setGroqTestResult({
        status: "success",
        message: localizeServerMessage(res.message) || t("Clé Groq validée avec succès !", "Groq key validated successfully!"),
      });
    } catch (err: any) {
      setGroqTestResult({
        status: "error",
        message: err.message || t("Échec de validation de la clé Groq.", "Groq key validation failed."),
      });
    } finally {
      setTestingGroq(false);
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      {/* ── Coordonnées & Identité ── */}
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

      {/* ── Section BYOK : Clé d'API Groq Personnelle ── */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-artisan p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/60 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-center text-primary shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
                  {t("Clé d'API Groq Personnelle (BYOK)", "Personal Groq API Key (BYOK)")}
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-900 dark:text-orange-300 font-semibold border border-orange-200/80 dark:border-orange-800/60">
                  {t("Multi-Tenant Isolé", "Isolated Multi-Tenant")}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {t(
                  "Chaque utilisateur peut renseigner sa propre clé Groq pour disposer de son quota journalier dédié (200 000 tokens/jour) sans dépendre du serveur.",
                  "Each user can enter their own Groq key to get a dedicated daily quota (200,000 tokens/day) without depending on the server."
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                {t("Clé d'API Groq (gsk_...)", "Groq API key (gsk_...)")}
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <span>{t("Obtenir une clé gratuite sur console.groq.com", "Get a free key on console.groq.com")}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="relative flex items-center">
              <input
                type={showGroqKey ? "text" : "password"}
                value={profile.groq_api_key || ""}
                onChange={(e) => {
                  setProfile({ ...profile, groq_api_key: e.target.value });
                  setGroqTestResult({ status: "idle" });
                }}
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full pr-12 pl-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowGroqKey(!showGroqKey)}
                className="absolute right-2.5 p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                title={showGroqKey ? t("Masquer la clé", "Hide key") : t("Afficher la clé", "Show key")}
              >
                {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              {t(
                "Si laissé vide, le serveur utilise la clé par défaut de la plateforme. Vos clés sont strictement privées à votre session.",
                "If left empty, the server uses the platform's default key. Your keys are strictly private to your session."
              )}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span>{t("Modèle LLM Groq", "Groq LLM model")}</span>
            </label>
            <select
              value={profile.groq_model || "openai/gpt-oss-120b"}
              onChange={(e) => setProfile({ ...profile, groq_model: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs text-stone-900 dark:text-stone-100 shadow-xs cursor-pointer transition-all"
            >
              <option value="openai/gpt-oss-120b">
                {t("GPT OSS 120B (openai/gpt-oss-120b) [Recommandé — Quota élevé & Rapide]", "GPT OSS 120B (openai/gpt-oss-120b) [Recommended — High quota & Fast]")}
              </option>
              <option value="openai/gpt-oss-20b">
                {t("GPT OSS 20B (openai/gpt-oss-20b) [Ultra-rapide]", "GPT OSS 20B (openai/gpt-oss-20b) [Ultra-fast]")}
              </option>
              <option value="qwen/qwen3.8-27b">
                {t("Qwen 2.5 27B (qwen/qwen3.8-27b) [Plafond 1000 OTPM]", "Qwen 2.5 27B (qwen/qwen3.8-27b) [1000 OTPM cap]")}
              </option>
            </select>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {t(
                "Modèle de raisonnement haute vitesse pour la rédaction du CV et de la lettre.",
                "High-speed reasoning model for writing the CV and the letter."
              )}
            </p>
          </div>
        </div>

        {/* Action Bar for BYOK */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-stone-200/60 dark:border-stone-800">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testingGroq || !profile.groq_api_key?.trim()}
              className="px-3.5 py-1.5 rounded-xl border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-primary text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
            >
              {testingGroq ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t("Test de connexion en cours...", "Testing connection...")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t("Tester la clé Groq", "Test the Groq key")}</span>
                </>
              )}
            </button>

            {groqTestResult.status === "success" && (
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>{groqTestResult.message}</span>
              </span>
            )}

            {groqTestResult.status === "error" && (
              <span className="text-xs font-medium text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span>{groqTestResult.message}</span>
              </span>
            )}
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t("Vous pourrez modifier cette clé à tout moment dans les Paramètres.", "You can modify this key at any time in Settings.")}
          </p>
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
