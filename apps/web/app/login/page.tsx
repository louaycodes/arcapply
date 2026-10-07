import { LoginForm } from "@/components/auth/login-form";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion & Inscription — ArcApply",
  description: "Connectez-vous ou créez votre compte sur ArcApply",
};

export default function LoginPage() {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-screen bg-[#F7F3EC] dark:bg-[#12100E] p-4 pt-16 sm:pt-4">
      {/* Top Bar with Home Link, Language & Theme Controls */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="ArcApply Logo"
            className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-bold text-stone-900 dark:text-stone-100 font-display text-sm hidden sm:inline">
            ArcApply
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <LoginForm />
    </div>
  );
}
