"use client";

import React, { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/api";
import { useAppLanguage } from "@/lib/language-context";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const { t } = useAppLanguage();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await requestPasswordReset(email);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || t("Une erreur est survenue", "An error occurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-screen bg-[#F7F3EC] dark:bg-[#12100E] p-4 pt-16 sm:pt-4">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/brand/arcapply-symbol.svg"
            alt="ArcApply Logo"
            className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-extrabold text-stone-900 dark:text-white font-display text-base tracking-tight hidden sm:inline">
            Arc<span className="text-[#EA580C]">Apply</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-border dark:border-stone-800 shadow-artisan rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-orange-700 flex items-center justify-center text-white shadow-lg shadow-orange-600/25 border border-orange-400/30">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            {t("Mot de passe oublié", "Forgot password")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t(
              "Renseignez votre email pour recevoir les instructions de réinitialisation sécurisée.",
              "Enter your email to receive secure reset instructions."
            )}
          </p>
        </div>

        {successMessage ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs leading-relaxed">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                  {t("Demande transmise avec succès", "Request sent successfully")}
                </p>
                <p>{successMessage}</p>
                <p className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                  {t(
                    "(En mode développement local, le lien est également affiché dans les logs du serveur FastAPI).",
                    "(In local development mode, the link is also printed in the FastAPI server logs)."
                  )}
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium text-xs transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("Retour à la connexion", "Back to sign in")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                {t("Adresse Email", "Email address")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@domaine.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary hover:bg-orange-700 text-white font-medium text-sm transition-all shadow-sm shadow-orange-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("Génération du lien...", "Generating link...")}
                </>
              ) : (
                t("Envoyer le lien de réinitialisation", "Send reset link")
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t("Retour à la connexion", "Back to sign in")}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
