"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { ShieldCheck, LogIn, UserCheck, KeyRound, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function LoginForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const { login, user, logout } = useAuth();
  const router = useRouter();
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return (
      <div className="w-full max-w-md bg-white border border-border shadow-artisan rounded-2xl p-6 sm:p-8 space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-600/25">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Vous êtes déjà connecté</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Connecté en tant que <span className="font-semibold text-stone-800">{user.full_name || user.username}</span> (@{user.username})
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => router.push(redirectTo)}
            className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-orange-700 text-white font-medium text-sm transition-all shadow-sm"
          >
            Accéder à l'application
          </button>
          <button
            onClick={logout}
            className="w-full py-2 px-4 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium text-xs transition-all"
          >
            Changer de compte (Déconnexion)
          </button>
        </div>
      </div>
    );
  }

  const handleLogin = async (uname: string, pwd: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await login(uname, pwd);
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Échec de connexion");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-border shadow-artisan rounded-2xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-orange-700 flex items-center justify-center text-white shadow-lg shadow-orange-600/25 border border-orange-400/30">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display flex items-center gap-2">
          ArcApply
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-900 border border-orange-200/80">
            Accès Sécurisé
          </span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Connectez-vous pour accéder à vos candidatures et à votre profil ingénieur.
        </p>
      </div>

      {/* Quick Preset Buttons */}
      <div className="bg-[#FAF7F2] rounded-xl p-3 border border-border/80">
        <span className="text-[11px] font-semibold text-stone-600 block mb-2">
          Comptes de test autorisés :
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setUsernameInput("louay");
              setPasswordInput("louay");
              handleLogin("louay", "louay");
            }}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-800 hover:border-primary hover:text-primary transition-all shadow-2xs"
          >
            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-[10px]">
              LZ
            </div>
            <div className="text-left">
              <div className="font-semibold leading-tight">Louay</div>
              <div className="text-[9px] text-muted-foreground">louay</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setUsernameInput("chaima");
              setPasswordInput("chaima");
              handleLogin("chaima", "chaima");
            }}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-800 hover:border-primary hover:text-primary transition-all shadow-2xs"
          >
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-[10px]">
              CH
            </div>
            <div className="text-left">
              <div className="font-semibold leading-tight">Chaima</div>
              <div className="text-[9px] text-muted-foreground">chaima</div>
            </div>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await handleLogin(usernameInput, passwordInput);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Nom d'utilisateur
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Ex: louay ou chaima"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-stone-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Mot de passe
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
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-stone-900"
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
              Connexion...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Se connecter
            </>
          )}
        </button>
      </form>
    </div>
  );
}
