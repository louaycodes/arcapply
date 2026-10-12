"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/lib/api";
import { useAppLanguage } from "@/lib/language-context";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const { t } = useAppLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            {t(
              "Aucun jeton de réinitialisation détecté dans l'URL. Veuillez cliquer sur le lien reçu ou faire une nouvelle demande.",
              "No reset token detected in the URL. Please click the link received or make a new request."
            )}
          </span>
        </div>
        <Link
          href="/forgot-password"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary hover:bg-orange-700 text-white font-medium text-xs transition-all"
        >
          {t("Demander un nouveau lien", "Request a new link")}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 4) {
      setErrorMessage(t("Le mot de passe doit comporter au moins 4 caractères.", "The password must be at least 4 characters long."));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t("Les mots de passe ne correspondent pas.", "Passwords do not match."));
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || t("Échec de la réinitialisation", "Reset failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs text-left">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
              {t("Mot de passe mis à jour", "Password updated")}
            </p>
            <p>{t("Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.", "Your password was updated successfully. You can now sign in.")}</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/login")}
          className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-orange-700 text-white font-medium text-sm transition-all shadow-sm"
        >
          {t("Se connecter maintenant", "Sign in now")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
          {t("Nouveau mot de passe", "New password")}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            <KeyRound className="w-4 h-4" />
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
          {t("Confirmer le mot de passe", "Confirm password")}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            <KeyRound className="w-4 h-4" />
          </div>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
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
            {t("Mise à jour en cours...", "Updating...")}
          </>
        ) : (
          t("Enregistrer le nouveau mot de passe", "Save new password")
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
  );
}

export default function ResetPasswordPage() {
  const { t } = useAppLanguage();

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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            {t("Réinitialisation du mot de passe", "Reset password")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t(
              "Définissez votre nouveau mot de passe pour sécuriser votre compte.",
              "Set your new password to secure your account."
            )}
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center p-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
