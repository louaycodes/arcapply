"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { ShieldCheck, LogIn, UserCheck, KeyRound, AlertCircle, Loader2, UserPlus, Mail, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppLanguage } from "@/lib/language-context";

export function LoginForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const { login, register, user, logout } = useAuth();
  const { t } = useAppLanguage();
  const router = useRouter();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [fullNameInput, setFullNameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return (
      <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-border dark:border-stone-800 shadow-artisan rounded-2xl p-6 sm:p-8 space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-600/25">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("Vous êtes déjà connecté", "You are already signed in")}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t("Connecté en tant que", "Signed in as")} <span className="font-semibold text-stone-800 dark:text-stone-200">{user.full_name || user.username}</span> (@{user.username})
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => router.push(redirectTo)}
            className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-orange-700 text-white font-medium text-sm transition-all shadow-sm"
          >
            {t("Accéder à l'application", "Go to the application")}
          </button>
          <button
            onClick={logout}
            className="w-full py-2 px-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium text-xs transition-all"
          >
            {t("Changer de compte (Déconnexion)", "Switch account (Sign out)")}
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (isRegisterMode) {
        await register(emailInput, passwordInput, fullNameInput);
        if (typeof window !== "undefined") {
          localStorage.setItem("arcapply_just_registered", "true");
          localStorage.removeItem("arcapply_onboarding_skipped");
        }
        router.push("/onboarding/step-1");
      } else {
        await login(emailInput, passwordInput);
        const hasSkipped = typeof window !== "undefined" && localStorage.getItem("arcapply_onboarding_skipped") === "true";
        const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("arcapply_user") : null;
        let isCompleted = false;
        if (savedUserStr) {
          try {
            isCompleted = !!JSON.parse(savedUserStr).onboarding_completed;
          } catch (_) {}
        }
        if (!isCompleted && !hasSkipped && (!redirectTo || redirectTo === "/" || redirectTo === "/login")) {
          router.push("/onboarding/step-1");
        } else {
          router.push(redirectTo);
        }
      }
    } catch (err: any) {
      setError(err.message || (isRegisterMode ? t("Échec de l'inscription", "Sign-up failed") : t("Échec de connexion", "Sign-in failed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-border dark:border-stone-800 shadow-artisan rounded-2xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-orange-700 flex items-center justify-center text-white shadow-lg shadow-orange-600/25 border border-orange-400/30">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display flex items-center gap-2">
          ArcApply
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-950/60 dark:to-amber-950/60 text-orange-900 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/60">
            {isRegisterMode ? t("Création Compte", "New Account") : t("Accès Sécurisé", "Secure Access")}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground">
          {isRegisterMode
            ? t("Créez votre compte en 10 secondes pour gérer vos candidatures.", "Create your account in 10 seconds to manage your applications.")
            : t("Connectez-vous pour accéder à vos candidatures et à votre profil ingénieur.", "Sign in to access your applications and your engineering profile.")}
        </p>
      </div>

      {/* Mode toggle tabs */}
      <div className="flex p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold">
        <button
          type="button"
          onClick={() => { setIsRegisterMode(false); setError(null); }}
          className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            !isRegisterMode
              ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
              : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          {t("Se connecter", "Sign in")}
        </button>
        <button
          type="button"
          onClick={() => { setIsRegisterMode(true); setError(null); }}
          className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            isRegisterMode
              ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
              : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          {t("Créer un compte", "Create an account")}
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegisterMode && (
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              {t("Nom complet (optionnel)", "Full name (optional)")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                placeholder={t("Ex. Louay Zorai", "e.g. Louay Zorai")}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            {isRegisterMode ? t("Adresse Email", "Email address") : t("Email ou Nom d'utilisateur", "Email or username")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              {isRegisterMode ? <Mail className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <input
              type={isRegisterMode ? "email" : "text"}
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={isRegisterMode ? t("votre.email@domaine.com", "your.email@domain.com") : t("Votre nom d'utilisateur ou email", "Your username or email")}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            {t("Mot de passe", "Password")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
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
              {isRegisterMode ? t("Création du compte...", "Creating account...") : t("Connexion...", "Signing in...")}
            </>
          ) : isRegisterMode ? (
            <>
              <UserPlus className="w-4 h-4" />
              {t("Créer mon compte", "Create my account")}
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              {t("Se connecter", "Sign in")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
