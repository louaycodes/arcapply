"use client";

import { Shield, Sparkles, Bell, Lock, CheckCircle2 } from "lucide-react";
import { useAppLanguage } from "@/lib/language-context";

export default function SettingsPage() {
  const { t } = useAppLanguage();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
          {t("Paramètres & Préférences", "Settings & Preferences")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("Gestion de vos préférences de compte, confidentialité et synchronisation.", "Manage your account preferences, privacy and synchronization.")}
        </p>
      </div>

      <div className="space-y-4">
        {/* Card 1: Confidentialité & Données */}
        <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-artisan space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-primary">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">
                  {t("Confidentialité & Données Personnelles", "Privacy & Personal Data")}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {t("Protection intégrale de votre identité et de votre historique de candidatures.", "Full protection of your identity and your application history.")}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              {t("Chiffrement actif", "Encryption enabled")}
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
            {t("Vos données de profil et vos candidatures sont strictement privées. ArcApply ne partage ni ne revend aucune de vos informations à des tiers ou recruteurs sans votre accord explicite.", "Your profile data and applications are strictly private. ArcApply never shares or sells any of your information to third parties or recruiters without your explicit consent.")}
          </p>
        </div>

        {/* Card 2: Assistant IA & Synchronisation */}
        <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-artisan space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">
                  {t("Assistant Intelligent & Connecteurs", "Smart Assistant & Connectors")}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {t("Génération assistée de CV et lettres, et synchronisation des emails.", "Assisted CV and cover letter generation, plus email synchronization.")}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              {t("Opérationnel", "Operational")}
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
            {t("Le modèle d'assistance fonctionne en continu pour analyser les offres d'emploi, évaluer la compatibilité de votre profil et formater vos candidatures.", "The assistant model runs continuously to analyze job offers, assess how well your profile matches and format your applications.")}
          </p>
        </div>

        {/* Card 3: Notifications & Alertes */}
        <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-artisan space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-700 dark:text-blue-300">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">
                  {t("Alertes Recruteurs & Relances", "Recruiter Alerts & Follow-ups")}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {t("Rappels automatiques lorsqu'une candidature reste sans réponse après 7 jours.", "Automatic reminders when an application gets no reply after 7 days.")}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {t("Actif", "Active")}
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
            {t("Vous recevez des alertes discrètes directement dans votre tableau de bord dès qu'un recruteur vous répond ou lorsqu'une relance opportune est conseillée.", "You get discreet alerts right in your dashboard as soon as a recruiter replies or when a timely follow-up is recommended.")}
          </p>
        </div>
      </div>
    </div>
  );
}
