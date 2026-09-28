"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, loginUser, fetchCurrentUser } from "@/lib/api";
import { ShieldCheck, LogIn, UserCheck, KeyRound, AlertCircle, Loader2 } from "lucide-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for login
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("arcapply_token");
    const savedUser = localStorage.getItem("arcapply_user");

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        // Silently verify session with backend
        fetchCurrentUser(savedToken)
          .then((updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem("arcapply_user", JSON.stringify(updatedUser));
          })
          .catch(() => {
            // Keep local user if network glitch or clear if expired
          });
      } catch (e) {
        localStorage.removeItem("arcapply_token");
        localStorage.removeItem("arcapply_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (uname: string, pwd: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await loginUser(uname, pwd);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem("arcapply_token", response.token);
      localStorage.setItem("arcapply_user", JSON.stringify(response.user));
    } catch (err: any) {
      setError(err.message || "Échec de connexion");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("arcapply_token");
    localStorage.removeItem("arcapply_user");
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#FBF9F5]">
        <div className="flex flex-col items-center gap-3 text-stone-600">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Chargement d'ArcApply...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F3EC] p-4 font-sans selection:bg-orange-100">
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
              Comptes autorisés :
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsernameInput("louay");
                  setPasswordInput("louay");
                  login("louay", "louay").catch(() => {});
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
                  login("chaima", "chaima").catch(() => {});
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
              try {
                await login(usernameInput, passwordInput);
              } catch (_) {}
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
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
