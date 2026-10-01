"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, loginUser, registerUser, fetchCurrentUser } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
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
    const response = await loginUser(uname, pwd);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem("arcapply_token", response.token);
    localStorage.setItem("arcapply_user", JSON.stringify(response.user));
  };

  const register = async (email: string, pwd: string, fullName?: string) => {
    const response = await registerUser(email, pwd, fullName);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem("arcapply_token", response.token);
    localStorage.setItem("arcapply_user", JSON.stringify(response.user));
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
      <AuthContext.Provider value={{ user, token, isLoading, login, logout, register }}>
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F3EC] p-4 font-sans selection:bg-orange-100">
          <LoginForm />
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

