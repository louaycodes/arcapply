---
id: SPEC-auth-onboarding
companions:
  - auth-security-architecture.md
  - onboarding-steps-catalog.md
sources:
  - ../../implementation-artifacts/spec-isolated-onboarding-flow.md
  - ../../implementation-artifacts/spec-1-1-initialiser-le-socle-decouple-et-master-profile.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Spécification : Authentification Sécurisée et Onboarding Candidat en 12 Étapes

## Why

L'entrée dans ArcApply conditionne toute la chaîne de valeur du copilote de candidature : un élève-ingénieur doit pouvoir créer son compte en toute confidentialité, sécuriser l'accès à ses données personnelles et à sa clé d'inférence LLM, puis configurer son Master Profile sans friction grâce à un parcours autonome isolé du cockpit principal. L'absence de sessions JWT sécurisées, l'absence de récupération de mot de passe et l'exposition prématurée de la navigation du cockpit nuisent à la confiance de l'utilisateur, créent des risques d'usurpation de session locale et augmentent l'abandon avant que le profil ne contienne les données indispensables au calcul ATS déterministe et à la génération zéro-hallucination.

## Capabilities

- **CAP-1**
  - **intent:** Le candidat s'inscrit avec une adresse email unique et un mot de passe conforme, initialisant de manière atomique son compte utilisateur et un Master Profile vierge isolé.
  - **success:** Une requête d'inscription avec un email valide et un mot de passe conforme crée les entrées `User` et `MasterProfile` associées en base SQLite et retourne un jeton de session valide sans révéler d'informations sensibles.

- **CAP-2**
  - **intent:** Le candidat s'authentifie avec ses identifiants pour obtenir une session chiffrée par jeton JWT persistant et peut révoquer sa session à tout moment.
  - **success:** Une tentative de connexion avec identifiants corrects délivre un jeton JWT valide (HS256) permettant d'accéder aux routes protégées pendant sa durée de vie, et la déconnexion purge les informations de session côté client et refuse les requêtes non authentifiées.

- **CAP-3**
  - **intent:** L'utilisateur ayant égaré son mot de passe réinitialise son accès de manière autonome et sécurisée sans divulgation d'existence de compte.
  - **success:** Une demande de réinitialisation génère un jeton temporaire à usage unique (TTL 15 minutes) horodaté en base sans confirmer l'existence de l'adresse à des tiers non autorisés, et la soumission d'un nouveau mot de passe avec ce jeton met à jour le hachage et invalide le jeton utilisé.

- **CAP-4**
  - **intent:** Le candidat configure son profil à travers un parcours guidé autonome en 12 étapes dans une interface dédiée isolée des barres de navigation du cockpit, chaque étape sauvegardant ses modifications incrémentales.
  - **success:** Durant toute la navigation entre `/onboarding/step-1` et `/onboarding/step-12`, les éléments `Sidebar` et `TopNavbar` du cockpit sont masqués, et chaque validation d'étape persiste les données saisies dans SQLite sans perte d'état en cas d'interruption ou de rafraîchissement.

- **CAP-5**
  - **intent:** Le candidat valide en temps réel ses paramètres de recherche et peut tester la connectivité de sa clé d'inférence LLM personnelle sans bloquer son avancée en mode déterministe de secours.
  - **success:** Le test de clé d'API Groq retourne un statut immédiat de validité ou d'erreur exploitable sans persister de clé non fonctionnelle, et le candidat peut poursuivre le parcours même si la clé n'est pas fournie.

- **CAP-6**
  - **intent:** Le système évalue déterministement la complétude du Master Profile à la dernière étape, synchronise les projections du profil miroir et finalise le statut d'onboarding avant d'ouvrir l'accès au cockpit.
  - **success:** La complétion de l'étape 12 marque `User.onboarding_completed = true`, synchronise le miroir de profil et redirige l'utilisateur vers le cockpit avec les fonctionnalités ATS et radar débloquées.

## Constraints

- Respect absolu des invariants architecturaux AD-1 (séparation stricte Next.js / FastAPI) et AD-2 (FastAPI détient l'accès exclusif à `~/.arcapply/arcapply.db`).
- Masquage systématique des composants de navigation globale (`Sidebar`, `TopNavbar`) sur l'ensemble des routes sous `/onboarding/**`.
- Toute modification du schéma SQLite (`User`, `MasterProfile`, table des jetons de réinitialisation) doit intégrer des migrations additives idempotentes dans `_migrate_db(engine)`.
- Règle de zéro-emoji dans l'ensemble des interfaces, messages et composants (usage exclusif des icônes Lucide React et de codes ISO textuels).
- Rétrocompatibilité du mode local : repli automatique sur le profil par défaut (`louay`) pour les tests et exécutions automatisées sans header d'authentification.

## Non-goals

- Délégation d'authentification tierce via fournisseurs OAuth (Google, GitHub, LinkedIn) dans ce périmètre initial.
- Mécanisme d'authentification multi-facteurs (MFA / 2FA par SMS ou TOTP).
- Partage de profil ou collaboration multi-utilisateurs sur un même compte candidat.

## Success signal

- Un parcours complet de bout en bout (inscription avec validation d'email, connexion JWT, franchissement des 12 étapes d'onboarding avec sauvegarde incrémentale et test de clé Groq, puis finalisation et réinitialisation de mot de passe) s'exécute avec succès sans aucune régression ni fuite de navigation cockpit, validé par la suite de tests automatisés.

## Assumptions

- La clé secrète JWT est fournie via `ARCAPPLY_JWT_SECRET` ou une valeur cryptographique locale persistante générée à l'initialisation de l'instance.
- Les emails de réinitialisation et de validation sont journalisés dans la console en environnement local de développement et relayés via SMTP en production.

## Open Questions

- Faut-il forcer l'activation de compte par email avant d'autoriser l'accès à l'onboarding, ou permettre un accès direct en mode "non vérifié" avec avertissement non bloquant ?
