---
title: 'Story 1.1: Initialiser le socle découplé et la gestion immuable du Master Profile'
type: 'feature'
created: '2026-09-26'
status: 'done'
baseline_commit: 'e0063433704363a6dcc381f8158ef757c3e6dde7'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'étudiant ingénieur ne dispose d'aucun environnement d'exécution local découplé ni de référentiel souverain immuable pour ses données personnelles, risquant des hallucinations IA et des conflits de concurrence sur la persistance.

**Approach:** Initialiser l'architecture monorepo découplée (`apps/web` en Next.js 15+ et `services/engine` en FastAPI Python 3.12+), configurer la base de données locale souveraine SQLite (`~/.arcapply/arcapply.db`) via SQLModel, et implémenter la gestion complète du Master Profile avec garde-fous stricts de complétude interdisant toute génération ultérieure si le profil est incomplet.

## Boundaries & Constraints

**Always:**
- Respecter le découplage strict (AD-1) : Next.js dans `apps/web/` et FastAPI dans `services/engine/` tournent dans des processus distincts ; Next.js n'accède jamais directement à SQLite ni à Playwright.
- Persistance exclusive moteur (AD-2) : L'engine FastAPI est l'unique propriétaire du fichier `~/.arcapply/arcapply.db`. Le frontend communique exclusivement par API REST.
- Règle de zéro-hallucination : Le Master Profile constitue la source de vérité unique et souveraine de l'étudiant.
- Règle de complétude (CAP-1) : Un profil sans identité, contact, au moins 1 formation, 1 expérience/projet et compétences techniques bloque toute génération avec un statut `is_complete: false` et code d'erreur explicite.
- Conformité des commits Git : Commits atomiques au format conventionnel (`engine`, `web`, `bmad`) selon AGENTS.md.

**Never:**
- Pas d'accès direct de Next.js à SQLite ou aux fichiers de sessions.
- Pas de persistance cloud multi-tenant ou d'envoi non chiffré de données personnelles.
- Pas de contournement des validations obligatoires du Master Profile.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Création / MàJ profil complet | Payload JSON valide avec identité, formations, expériences, compétences | HTTP 200/201, profil persisté dans SQLite, `is_complete: true` | Validation Pydantic stricte |
| Sauvegarde profil partiel / brouillon | Payload avec sections obligatoires incomplètes | HTTP 200 (sauvegardé), `is_complete: false` avec inventaire précis des champs manquants | Retourne la liste des champs requis manquants |
| Vérification éligibilité génération | Appel GET `/api/profile/status` avec profil incomplet | HTTP 200 avec `{ "can_generate": false, "missing_fields": [...] }` ; blocage sur tentative de génération (HTTP 422 `PROFILE_INCOMPLETE`) | Message d'erreur clair et actionnable |
| Démarrage sur machine vierge | Aucun dossier ni base `~/.arcapply/arcapply.db` existant | Création automatique du répertoire et initialisation idempotente du schéma SQLite | Capture et gestion des droits d'accès fichiers |
| Cockpit web hors-ligne du moteur | Requête du cockpit web alors que FastAPI est arrêté | Affichage d'un état dégradé propre (bannière de connexion) sans crash de l'interface | Gestion d'erreur TanStack Query avec retry modéré |

</frozen-after-approval>

## Code Map

- `services/engine/pyproject.toml` -- Configuration du moteur FastAPI, dépendances uv (`fastapi`, `sqlmodel`, `pydantic`, `uvicorn`, `pytest`)
- `services/engine/app/config.py` -- Paramètres de configuration (chemins `~/.arcapply/arcapply.db`, CORS, etc.)
- `services/engine/app/domain/models.py` -- Modèles SQLModel / Pydantic du `MasterProfile`, `Education`, `Experience`, `Skill`, `Project`
- `services/engine/app/domain/validation.py` -- Règles métier de validation de complétude du Master Profile (CAP-1)
- `services/engine/app/adapters/database.py` -- Initialisation du moteur SQLite et gestion des sessions SQLModel
- `services/engine/app/api/profile.py` -- Router FastAPI des endpoints CRUD et vérification `/api/profile`
- `services/engine/app/main.py` -- Point d'entrée FastAPI, middlewares CORS, gestionnaire d'exceptions
- `services/engine/tests/test_profile.py` -- Tests unitaires et d'intégration de la complétude du Master Profile
- `apps/web/package.json` -- Configuration du cockpit Next.js avec Tailwind CSS, Lucide icons, TanStack Query
- `apps/web/app/layout.tsx` -- Shell de navigation persistante conforme aux tokens de DESIGN.md et EXPERIENCE.md
- `apps/web/lib/api.ts` -- Client HTTP typé consommant l'API `/api/profile` du moteur
- `apps/web/app/profile/page.tsx` -- Page de gestion du Master Profile avec indicateur de complétude et formulaires

## Tasks & Acceptance

**Execution:**
- [x] `services/engine/pyproject.toml` -- Initialiser le projet backend avec uv, FastAPI, SQLModel et pytest -- Socle backend AD-1
- [x] `services/engine/app/config.py` -- Définir la configuration et le chemin souverain `~/.arcapply/arcapply.db` -- AD-2, AD-8
- [x] `services/engine/app/domain/models.py` -- Définir les modèles de données `MasterProfile`, `Education`, `Experience`, `Skill`, `Project` -- Schéma du profil de vérité
- [x] `services/engine/app/domain/validation.py` -- Implémenter le validateur de complétude du profil et la règle de garde-fou CAP-1 -- Blocage anti-hallucination
- [x] `services/engine/app/adapters/database.py` -- Implémenter l'adaptateur de persistance SQLite avec initialisation automatique -- Isolation locale AD-2
- [x] `services/engine/app/api/profile.py` -- Créer les endpoints REST GET/PUT `/api/profile` et GET `/api/profile/status` -- Contrat API REST
- [x] `services/engine/app/main.py` -- Assembler l'application FastAPI avec configuration CORS et gestion des erreurs -- Point d'entrée de l'engine
- [x] `services/engine/tests/test_profile.py` -- Écrire la suite de tests pour la persistance et les garde-fous de complétude -- Validation des critères d'acceptation
- [x] `apps/web/package.json` -- Initialiser le projet Next.js avec TypeScript, Tailwind CSS et dépendances de base -- Socle frontend AD-1
- [x] `apps/web/app/layout.tsx` -- Mettre en place le layout avec thème sombre (DESIGN.md) et navigation persistante (EXPERIENCE.md) -- Architecture de l'information
- [x] `apps/web/lib/api.ts` -- Écrire le client API typé pour la communication avec FastAPI -- Protocole REST découplé
- [x] `apps/web/app/profile/page.tsx` -- Développer l'interface de gestion du Master Profile avec jauge de complétude et formulaires d'édition -- Surface fonctionnelle Master Profile

**Acceptance Criteria:**
- Given un environnement sans base préalable, when le moteur FastAPI démarre, then le dossier `~/.arcapply` et la base `arcapply.db` sont créés avec le schéma relationnel valide.
- Given un Master Profile avec des sections obligatoires manquantes, when l'utilisateur ou un service vérifie l'éligibilité de génération via `/api/profile/status`, then le système retourne `is_complete: false` et liste précisément les sections manquantes.
- Given un Master Profile dont toutes les sections obligatoires sont renseignées (identité, au moins 1 formation, 1 expérience/projet, compétences), when le profil est sauvegardé, then le système confirme la validité (`is_complete: true`).
- Given le frontend Next.js lancé, when l'utilisateur consulte la page `/profile`, then les données du profil s'affichent avec l'indicateur d'état de complétude synchronisé en temps réel depuis le backend.

## Implementation Notes

- Backend FastAPI configuré avec uv, SQLModel et persistance locale SQLite dans `~/.arcapply/arcapply.db`.
- Implémentation du garde-fou CAP-1 bloquant la génération si le profil n'est pas exhaustif (HTTP 422 avec code `PROFILE_INCOMPLETE`).
- Suite de tests complète pytest (5 tests passés avec succès couvrant création de base, brouillons, blocage et déblocage).
- Frontend Next.js 15 App Router avec TypeScript, Tailwind CSS (palette DESIGN.md), navigation latérale persistante et page Master Profile responsive avec jauge de complétude et injection de profil exemple.
- Compilation de production Next.js validée sans aucune erreur de typage ou de lint.

## Spec Change Log

## Review Triage Log

| Verdict | Emplacement | Preuve / Rationale |
|---|---|---|
| `patch` | `services/engine/app/main.py:36` | Ajout d'un handler HTTPException au format RFC 7807 (Problem Details) pour standardiser les retours d'erreurs (notamment 422). |
| `patch` | `services/engine/app/domain/validation.py:21` | Renforcement de la validation de complétude d'email pour exiger un nom de domaine avec extension valide. |
| `low` | `services/engine/app/domain/models.py:16` | Utilisation de uuid4 standard satisfaisant l'unicité locale du MVP ; passage à uuid7 différé à l'intégration du pipeline d'ingestion d'offres. |
| `low` | `services/engine/app/adapters/database.py:27` | Appel `create_all` au lifespan sans verrou inter-processus ; acceptable pour l'architecture locale monopoint d'ArcApply. |

## Design Notes

- Modélisation du Master Profile : Entité racine `MasterProfile` associée aux sous-entités `Education`, `Experience`, `Skill`, `Project` avec identifiants UUID et horodatages ISO 8601 UTC.
- Garde-fou CAP-1 : La fonction métier `validate_master_profile_completeness(profile)` analyse la présence de champs non vides : nom, prénom, email, téléphone, au moins 1 formation avec diplôme/école, au moins 1 expérience ou projet avec description, et au moins 3 compétences techniques.
- Thème graphique : Dark mode strict `#0B0F19`, bordures `#334155`, accent `#3B82F6` (DESIGN.md).

## Verification

**Commands:**
- `cd services/engine && uv run pytest` -- expected: Tous les tests unitaires et de validation du Master Profile passent avec succès.
- `cd services/engine && uv run uvicorn app.main:app --port 8000` -- expected: Le serveur démarre sans erreur et répond sur `http://localhost:8000/docs`.
- `cd apps/web && npm run build` -- expected: Compilation TypeScript et bundling Next.js réussis sans erreur.
