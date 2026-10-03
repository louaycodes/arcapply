import { Shield, Sparkles, Bell, Lock, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
          Paramètres & Préférences
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion de vos préférences de compte, confidentialité et synchronisation.
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
                  Confidentialité & Données Personnelles
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Protection intégrale de votre identité et de votre historique de candidatures.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              Chiffrement actif
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
            Vos données de profil et vos candidatures sont strictement privées. ArcApply ne partage ni ne revend aucune de vos informations à des tiers ou recruteurs sans votre accord explicite.
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
                  Assistant Intelligent & Connecteurs
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Génération assistée de CV et lettres, et synchronisation des emails.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              Opérationnel
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
            Le modèle d'assistance fonctionne en continu pour analyser les offres d'emploi, évaluer la compatibilité de votre profil et formater vos candidatures.
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
                  Alertes Recruteurs & Relances
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Rappels automatiques lorsqu'une candidature reste sans réponse après 7 jours.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Actif
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
            Vous recevez des alertes discrètes directement dans votre tableau de bord dès qu'un recruteur vous répond ou lorsqu'une relance opportune est conseillée.
          </p>
        </div>
      </div>
    </div>
  );
}
