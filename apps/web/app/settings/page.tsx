"use client";

import { useEffect, useState } from "react";
import {
  Key,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Cpu,
  Sliders,
} from "lucide-react";
import { useAppLanguage } from "@/lib/language-context";
import { fetchProfile, updateProfile, testGroqKey, MasterProfile } from "@/lib/api";
import { localizeServerMessage } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useAppLanguage();
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestResult, setGroqTestResult] = useState<{
    status: "idle" | "success" | "error";
    message?: string;
  }>({ status: "idle" });
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        const data = await fetchProfile();
        setProfile(data);
      } catch (err: any) {
        setNotification({
          type: "error",
          message: err.message || t("Impossible de charger les paramètres", "Unable to load settings"),
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);
      setNotification(null);
      const updated = await updateProfile({
        groq_api_key: profile.groq_api_key,
        groq_model: profile.groq_model,
      });
      setProfile(updated);
      setNotification({
        type: "success",
        message: t("Paramètres enregistrés avec succès.", "Settings saved successfully."),
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || t("Échec de l'enregistrement", "Failed to save settings"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestKey = async () => {
    if (!profile?.groq_api_key?.trim()) {
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-stone-600 dark:text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-medium">{t("Chargement des paramètres...", "Loading settings...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            {t("Paramètres & Préférences", "Settings & Preferences")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "Configurez vos quotas d'IA dédiés (BYOK), votre modèle LLM et vos préférences système.",
              "Configure your dedicated AI quotas (BYOK), LLM model, and system preferences."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-orange-700 text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? t("Enregistrement...", "Saving...") : t("Enregistrer les modifications", "Save changes")}</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-3 transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Section BYOK: Moteur IA & Clé d'API Groq Personnelle */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-artisan p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/60 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-center text-primary shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display">
                  {t("Clé d'API Groq Personnelle (BYOK)", "Personal Groq API Key (BYOK)")}
                </h2>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                value={profile?.groq_api_key || ""}
                onChange={(e) => {
                  if (profile) setProfile({ ...profile, groq_api_key: e.target.value });
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
              value={profile?.groq_model || "openai/gpt-oss-120b"}
              onChange={(e) => {
                if (profile) setProfile({ ...profile, groq_model: e.target.value });
              }}
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-stone-200/60 dark:border-stone-800">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testingGroq || !profile?.groq_api_key?.trim()}
              className="px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-primary text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
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
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>{groqTestResult.message}</span>
              </span>
            )}

            {groqTestResult.status === "error" && (
              <span className="text-xs font-medium text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span>{groqTestResult.message}</span>
              </span>
            )}
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t("Cliquez sur « Enregistrer les modifications » en haut pour sauvegarder la clé.", "Click 'Save changes' at the top to save the key.")}
          </p>
        </div>
      </div>
    </div>
  );
}
