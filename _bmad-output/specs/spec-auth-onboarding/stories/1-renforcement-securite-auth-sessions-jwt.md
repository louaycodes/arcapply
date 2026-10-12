---
title: "Story 1: Renforcement de la sécurité d'authentification et sessions JWT"
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

**Problem:** Le moteur d'authentification utilise actuellement des pseudo-tokens non signés (`arcapply-token-<id>`) sans expiration ni vérification d'intégrité cryptographique, exposant les sessions à des risques d'usurpation locale et ne répondant pas aux standards de sécurité JWT.

**Approach:** Implémenter la génération et la vérification de jetons JWT signés cryptographiquement en HMAC-SHA256 (`HS256`) avec secret d'environnement (`ARCAPPLY_JWT_SECRET`), validité configurable (7 jours par défaut) et revendications standard (`sub`, `username`, `exp`, `iat`), tout en préservant la rétrocompatibilité des tests et de l'environnement local.

</frozen-after-approval>

## Implementation Notes

- **Configuration JWT (`services/engine/app/config.py`) :** Ajout des paramètres `jwt_secret`, `jwt_algorithm` et `jwt_expiration_days` (7 jours par défaut), surchargeables via la variable d'environnement `ARCAPPLY_JWT_SECRET`.
- **Module Cryptographique (`services/engine/app/domain/auth.py`) :** Fonctions standardisées `create_jwt_token` et `decode_jwt_token` en HMAC-SHA256 pur (sans dépendance externe superflue), validation d'expiration et encodage Base64URL conforme RFC 7519.
- **Points de terminaison (`services/engine/app/api/auth.py`) :** Émission systématique de jetons JWT signés sur `/api/auth/register` et `/api/auth/login`. Résolution sécurisée dans `_resolve_user_from_token` et `get_current_username` avec maintien du fallback hérité (`arcapply-token-<id>`) et mono-utilisateur (`louay`) pour les tests existants.
- **Flux temps réel SSE (`services/engine/app/api/events.py`) :** Prise en charge transparente des jetons JWT via query params et headers HTTP pour le canal Server-Sent Events.
- **Validation & Tests (`services/engine/tests/test_auth.py`) :** 13/13 tests passants, incluant des scénarios de falsification de signature, d'expiration de jeton et de routage SSE. Zéro erreur TypeScript (`npx tsc --noEmit`).

## Review Triage Log

- `findings` : 0 régression détectée, rétrocompatibilité préservée à 100%.


