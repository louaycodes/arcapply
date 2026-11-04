"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { ShieldCheck, LogIn, UserCheck, KeyRound, AlertCircle, Loader2, UserPlus, Mail, User as UserIcon, X, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppLanguage } from "@/lib/language-context";
import { fetchGoogleConfig } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (notification?: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
        oauth2?: {
          initCodeClient: (config: any) => { requestCode: () => void };
          initTokenClient: (config: any) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

export function LoginForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const { login, register, loginWithGoogle, user, logout } = useAuth();
  const { t } = useAppLanguage();
  const router = useRouter();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [fullNameInput, setFullNameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration Google OAuth
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [isGoogleConfigured, setIsGoogleConfigured] = useState<boolean>(false);
  const [showConfigHelperModal, setShowConfigHelperModal] = useState<boolean>(false);
  const [demoGoogleEmail, setDemoGoogleEmail] = useState<string>("candidat.ingenieur@gmail.com");

  const googleButtonContainerRef = useRef<HTMLDivElement>(null);

  const handleGoogleSuccess = useCallback(
    async (payload: { credential?: string; code?: string; redirect_uri?: string; email?: string; full_name?: string }) => {
      setIsGoogleLoading(true);
      setError(null);
      try {
        const res = await loginWithGoogle(payload);
        const isNew = res.isNewUser;
        const hasSkipped = typeof window !== "undefined" && localStorage.getItem("arcapply_onboarding_skipped") === "true";
        const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("arcapply_user") : null;
        let isCompleted = false;
        if (savedUserStr) {
          try {
            isCompleted = !!JSON.parse(savedUserStr).onboarding_completed;
          } catch (_) {}
        }

        if (isNew) {
          if (typeof window !== "undefined") {
            localStorage.setItem("arcapply_just_registered", "true");
            localStorage.removeItem("arcapply_onboarding_skipped");
          }
          router.push("/onboarding/step-1");
        } else if (!isCompleted && !hasSkipped && (!redirectTo || redirectTo === "/" || redirectTo === "/login")) {
          router.push("/onboarding/step-1");
        } else {
          router.push(redirectTo);
        }
      } catch (err: any) {
        setError(err.message || t("Échec de l'authentification avec Google", "Google authentication failed"));
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [loginWithGoogle, redirectTo, router, t]
  );

  // Charger la configuration Google OAuth au montage
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const cfg = await fetchGoogleConfig();
        if (!isMounted) return;
        const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
        const effectiveId = cfg.client_id || envClientId;
        setGoogleClientId(effectiveId);
        setIsGoogleConfigured(cfg.enabled || !!effectiveId);

        if (effectiveId && typeof window !== "undefined") {
          // Charger le script Google Identity Services si pas encore présent
          if (!document.getElementById("google-gsi-client")) {
            const script = document.createElement("script");
            script.id = "google-gsi-client";
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = () => {
              if (window.google?.accounts?.id) {
                window.google.accounts.id.initialize({
                  client_id: effectiveId,
                  callback: (response: any) => {
                    if (response?.credential) {
                      handleGoogleSuccess({ credential: response.credential });
                    }
                  },
                });
              }
            };
            document.head.appendChild(script);
          } else if (window.google?.accounts?.id) {
            window.google.accounts.id.initialize({
              client_id: effectiveId,
              callback: (response: any) => {
                if (response?.credential) {
                  handleGoogleSuccess({ credential: response.credential });
                }
              },
            });
          }
        }
      } catch (err) {
        console.warn("Échec de chargement de la configuration Google OAuth:", err);
      }
    }
    loadConfig();
    return () => {
      isMounted = false;
    };
  }, [handleGoogleSuccess]);

  const handleGoogleClick = () => {
    setError(null);

    // Si Google Client ID est configuré, déclencher le flux officiel
    if (googleClientId && window.google?.accounts) {
      setIsGoogleLoading(true);
      try {
        if (window.google.accounts.oauth2) {
          const client = window.google.accounts.oauth2.initCodeClient({
            client_id: googleClientId,
            scope: "openid email profile",
            ux_mode: "popup",
            callback: (response: any) => {
              if (response.code) {
                handleGoogleSuccess({ code: response.code });
              } else {
                setIsGoogleLoading(false);
              }
            },
          });
          client.requestCode();
        } else if (window.google.accounts.id) {
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              setIsGoogleLoading(false);
            }
          });
        }
      } catch (e: any) {
        setIsGoogleLoading(false);
        setError(e.message || t("Impossible d'ouvrir Google Sign-In", "Unable to open Google Sign-In"));
      }
      return;
    }

    // Si Google Client ID n'est pas encore configuré dans l'environnement, ouvrir la modale d'assistance/démo
    setShowConfigHelperModal(true);
  };

  const handleDemoGoogleAuth = () => {
    setShowConfigHelperModal(false);
    handleGoogleSuccess({
      credential: `mock-google-${demoGoogleEmail}`,
    });
  };

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
            ? t("Créez votre compte pour piloter vos candidatures avec précision.", "Create your account to manage your engineering applications.")
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

      {/* Google Provider Button */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={isSubmitting || isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium text-xs sm:text-sm transition-all shadow-xs hover:border-stone-300 dark:hover:border-stone-600 disabled:opacity-50 cursor-pointer"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>
            {isRegisterMode
              ? t("S'inscrire avec Google", "Sign up with Google")
              : t("Continuer avec Google", "Continue with Google")}
          </span>
        </button>

        {/* Hidden container for Google GSI iframe if rendered */}
        <div ref={googleButtonContainerRef} className="hidden" />

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200 dark:border-stone-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
            <span className="bg-white dark:bg-stone-900 px-2.5 text-stone-400 dark:text-stone-500">
              {t("ou par email", "or with email")}
            </span>
          </div>
        </div>
      </div>

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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              {t("Mot de passe", "Password")}
            </label>
            {!isRegisterMode && (
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                {t("Mot de passe oublié ?", "Forgot password?")}
              </button>
            )}
          </div>
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
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary hover:bg-orange-700 text-white font-medium text-sm transition-all shadow-sm shadow-orange-600/30 disabled:opacity-50 cursor-pointer"
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

      {/* Configuration Helper & Test Modal for Google Provider */}
      {showConfigHelperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 border border-border dark:border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
            <button
              type="button"
              onClick={() => setShowConfigHelperModal(false)}
              aria-label={t("Fermer", "Close")}
              className="absolute top-4 right-4 p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-850 flex items-center justify-center text-primary shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t("Fournisseur Google Auth", "Google Auth Provider")}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {t("Paramétrage & Test Immédiat", "Configuration & Instant Test")}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 text-xs text-stone-600 dark:text-stone-300 space-y-2">
              <p>
                {t(
                  "Pour activer la connexion Google en production, renseignez la variable d'environnement :",
                  "To activate Google Sign-In in production, define the environment variable:"
                )}
              </p>
              <code className="block p-1.5 rounded bg-stone-200/80 dark:bg-stone-800 font-mono text-[11px] text-stone-800 dark:text-stone-200 break-all select-all">
                GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
              </code>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                {t("Email du compte de test Google :", "Test Google account email:")}
              </label>
              <input
                type="email"
                value={demoGoogleEmail}
                onChange={(e) => setDemoGoogleEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleDemoGoogleAuth}
                className="w-full py-2 px-3 rounded-lg bg-primary hover:bg-orange-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>{t("Tester la connexion Google", "Test Google Sign-In")}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowConfigHelperModal(false)}
                className="w-full py-2 px-3 rounded-lg border border-stone-200 dark:border-stone-750 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-xs transition-colors cursor-pointer"
              >
                {t("Annuler", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
