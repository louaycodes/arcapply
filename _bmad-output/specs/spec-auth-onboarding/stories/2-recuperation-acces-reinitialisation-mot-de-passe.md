---
title: "Story 2: Récupération d'accès et réinitialisation sécurisée de mot de passe"
type: 'feature'
created: '2026-10-12'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/specs/spec-auth-onboarding/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-auth-onboarding/auth-security-architecture.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** En cas d'oubli de mot de passe, un utilisateur est actuellement bloqué sans moyen autonome de récupérer son compte, ce qui nécessite une intervention manuelle directe dans la base de données.

**Approach:** Implémenter les points de terminaison `forgot-password` et `reset-password` avec protection anti-énumération de comptes, jetons horodatés à usage unique (TTL 15 min), table `PasswordResetToken` avec migration additive idempotente dans `_migrate_db`, notifications par email (journalisées en dev), et interfaces utilisateur dédiées sous Next.js.

</frozen-after-approval>

## Implementation Notes

- **Modèle de données & Migration (`services/engine/app/domain/models.py`, `app/adapters/database.py`) :** Ajout de l'entité `PasswordResetToken` (`id`, `user_id`, `token_hash`, `expires_at`, `used`, `created_at`), des schémas `ForgotPasswordRequest`, `ResetPasswordRequest`, `MessageResponse` et de la migration SQLite idempotente dans `_migrate_db` avec indexation.
- **Endpoints FastAPI (`services/engine/app/api/auth.py`) :**
  - `POST /api/auth/forgot-password` : Réponse générique anti-énumération, jeton hexadécimal 24 octets haché en SHA-256 avec TTL 15 minutes, invalidation atomique des jetons antérieurs, journalisation console du lien en mode dev.
  - `POST /api/auth/reset-password` : Contrôle d'expiration et de non-consommation, hachage sécurisé du nouveau mot de passe, consommation atomique immédiate du jeton.
- **Interface Next.js (`apps/web/`) :**
  - Ajout des routes publiques `/forgot-password` et `/reset-password` dans `auth-context.tsx`.
  - Pages dédiées `apps/web/app/forgot-password/page.tsx` et `apps/web/app/reset-password/page.tsx` respectant la charte esthétique (mode clair/sombre, zéro emoji, bilingue FR/EN, composants Lucide React).
  - Intégration du lien "Mot de passe oublié ?" dans `login-form.tsx`.
  - Client API mis à jour dans `apps/web/lib/api.ts` (`requestPasswordReset`, `resetPassword`).
- **Tests & Vérification (`services/engine/tests/test_auth.py`) :** Tests complets de cycle de vie (anti-énumération, réinitialisation réussie, rejet des jetons expirés ou rejoués). 21/21 tests passants. Validation TypeScript `tsc --noEmit` à 100%.

## Review Triage Log

- `findings` : 0 régression, conformité stricte aux 8 lois Spec Law et aux règles de sécurité.


