---
title: "Isolation de la Séquence d'Onboarding et Parcours d'Inscription"
type: 'feature'
created: '2026-10-08'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** À la création de compte depuis la page d'authentification (`/login`), l'utilisateur est actuellement redirigé dans un environnement où la barre latérale du cockpit (Sidebar) et la barre supérieure (TopNavbar) s'affichent, donnant l'impression d'être directement à l'intérieur de la plateforme au lieu d'une expérience d'onboarding fluide, dédiée et épurée.

**Approach:** Isoler totalement la séquence d'onboarding (les 7 étapes du profil) du cockpit principal en masquant la Sidebar et la TopNavbar sur toutes les routes `/onboarding/**`. Offrir dans l'onboarding une barre supérieure dédiée avec logo, progression, bascule de langue, bascule de thème, et un bouton clair "Ignorer et explorer la plateforme" redirigeant vers le cockpit sans bloquer l'utilisateur.

</frozen-after-approval>

## Implementation Notes

- `apps/web/components/navigation/sidebar.tsx` : condition d'affichage mise à jour pour masquer complètement la barre latérale sur toutes les routes commençant par `/onboarding`.
- `apps/web/components/navigation/top-navbar.tsx` : condition d'affichage mise à jour pour masquer la barre supérieure du cockpit sur `/onboarding/**`.
- `apps/web/components/onboarding/onboarding-shell.tsx` : en-tête d'onboarding autonome avec logo ArcApply, fil d'Ariane d'étape, sélection de langue, thème clair/sombre, bouton "Ignorer et explorer la plateforme" enregistrant l'état `arcapply_onboarding_skipped` et redirection vers `/`, et bouton de déconnexion.
- `apps/web/components/auth/login-form.tsx` : réinitialisation de `arcapply_onboarding_skipped` lors de la création d'un compte, redirection automatique des profils non finalisés vers `/onboarding/step-1`.
- `apps/web/app/onboarding/step-7/page.tsx` : nettoyage du flag `arcapply_onboarding_skipped` et finalisation du statut onboarding.
- `apps/web/app/page.tsx` : bannière d'invitation non bloquante sur le tableau de bord invitant à reprendre l'onboarding si le profil n'est pas encore finalisé.
- `apps/web/app/login/page.tsx` : intégration des contrôles de langue et de thème dans la page de connexion/inscription.

## Review Triage Log

- Vérification de conformité : zéro emoji dans le code (Lucide React uniquement), conformité TypeScript validée via `tsc --noEmit`.
