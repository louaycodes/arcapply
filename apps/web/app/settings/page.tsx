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
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-artisan space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-primary">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-display">
                  Confidentialité & Données Personnelles
                </h3>
                <p className="text-xs text-stone-500">
                  Protection intégrale de votre identité et de votre historique de candidatures.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              Chiffrement actif
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pt-1">
            Vos données de profil et vos candidatures sont strictement privées. ArcApply ne partage ni ne revend aucune de vos informations à des tiers ou recruteurs sans votre accord explicite.
          </p>
        </div>

        {/* Card 2: Assistant IA & Synchronisation */}
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-artisan space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-display">
                  Assistant Intelligent & Connecteurs
                </h3>
                <p className="text-xs text-stone-500">
                  Génération assistée de CV et lettres, et synchronisation des emails.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              Opérationnel
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pt-1">
            Le modèle d'assistance fonctionne en continu pour analyser les offres d'emploi, évaluer la compatibilité de votre profil et formater vos candidatures.
          </p>
        </div>

        {/* Card 3: Notifications & Alertes */}
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-artisan space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-display">
                  Alertes Recruteurs & Relances
                </h3>
                <p className="text-xs text-stone-500">
                  Rappels automatiques lorsqu'une candidature reste sans réponse après 7 jours.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
              Actif
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pt-1">
            Vous recevez des alertes discrètes directement dans votre tableau de bord dès qu'un recruteur vous répond ou lorsqu'une relance opportune est conseillée.
          </p>
        </div>
      </div>
    </div>
  );
}
