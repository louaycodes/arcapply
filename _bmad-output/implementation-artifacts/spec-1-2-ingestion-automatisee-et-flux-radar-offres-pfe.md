---
title: "Story 1.2: Ingestion automatisée et flux Radar d'offres de stage PFE"
type: 'feature'
created: '2026-09-26'
status: 'done'
baseline_commit: '2ac7494174f996f8e97c35a8ebb1786cd259e670'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La veille manuelle sur LinkedIn et Jobteaser pour trouver des stages PFE pertinents en France et Tunisie est chronophage (30 à 45 min par offre), répétitive et conduit à des doublons ou à manquer des opportunités urgentes.

**Approach:** Implémenter l'architecture de connecteurs d'offres modulaires (`BaseJobConnector`) avec adaptateurs Playwright résilients (jitter aléatoire, déduplication stricte en base SQLite), exposer un flux temps réel SSE (`/api/events`), et fournir dans le cockpit web Next.js une interface Radar vivante avec filtres, déclenchement de collecte et réception instantanée des nouvelles offres.

## Boundaries & Constraints

**Always:**
- Respecter le Strategy / Plugin pattern (AD-5) : Tous les connecteurs de scraping héritent de `BaseJobConnector` et encapsulent leurs sélecteurs et interactions Playwright dans `app/adapters/connectors/`.
- Résilience et discrétion de scraping : Intégrer un jitter aléatoire (délais entre requêtes) et une gestion des rate-limits pour éviter le bannissement de compte.
- Déduplication stricte : Unicité sur le couple `(platform, external_id)` dans la table SQLite des offres `job_offers`.
- Communication SSE (AD-3) : Le flux de télémétrie et les notifications de découverte d'offres transitent par SSE via `/api/events` avec enveloppe JSON stricte (`event`, `timestamp`, `payload`).
- Découplage strict (AD-1) : Next.js ne lance aucun scraper ; tout le scraping est orchestré par le moteur backend FastAPI.
- Commits conventionnels et push distant obligatoire après achèvement de la story (règle AGENTS.md).

**Never:**
- Pas d'accès direct du frontend à SQLite ni aux sessions de scraping.
- Pas de requêtes de scraping agressives sans intervalle de temporisation.
- Pas d'offres dupliquées visibles dans le Radar.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Collecte d'offres réussie | Requête `POST /api/jobs/collect` avec `keywords: ["PFE", "Ingénieur"]`, `platforms: ["linkedin", "jobteaser"]` | Télémétrie SSE émise, nouvelles offres persistées, HTTP 200 avec résumé `created_count` | Capture des exceptions réseau par connecteur |
| Offre déjà collectée (doublon) | L'offre existe déjà avec le même `(platform, external_id)` | L'offre existante est mise à jour ou ignorée sans doublon ; aucun événement dupliqué | Ignoré silencieusement ou mis à jour via `IntegrityError` |
| Connexion au flux SSE | Client web ouvre `EventSource('/api/events')` | Flux continu (header `text/event-stream`), émission d'un heartbeat initial et des événements temps réel | Reconnexion automatique côté client |
| Simulation / Environnement sans session active | Pas de cookies de session stockés sur la machine | Mode démonstration résilient avec scraping public / mock de données réalistes PFE d'excellence | Alerte non bloquante dans le stream SSE |
| Filtrage des offres dans le Radar | Filtre par pays (France / Tunisie) ou mot-clé dans l'UI | Affichage instantané des offres correspondantes avec badge plateforme et date | Message si aucun résultat |
| Archivage rapide d'une offre | Clic sur archiver ou touche `x` sur une offre | `PATCH /api/jobs/{id}/archive` -> statut `ARCHIVED`, retrait du flux actif | Notification visuelle réversible |

</frozen-after-approval>

## Code Map

- `services/engine/app/ports/connectors.py` -- Interface abstraite `BaseJobConnector` définissant le contrat des collecteurs
- `services/engine/app/adapters/connectors/linkedin.py` -- Adaptateur de collecte LinkedIn avec Playwright et jitter
- `services/engine/app/adapters/connectors/jobteaser.py` -- Adaptateur de collecte Jobteaser avec Playwright
- `services/engine/app/domain/models.py` -- Modèle `JobOffer` avec index d'unicité, statuts de cycle de vie et DTOs de lecture
- `services/engine/app/api/events.py` -- Gestionnaire et routeur SSE (`/api/events`) pour la diffusion d'événements
- `services/engine/app/api/jobs.py` -- Router REST `/api/jobs` pour la consultation, la collecte et l'archivage
- `services/engine/app/main.py` -- Enregistrement des routeurs `jobs` et `events`
- `services/engine/tests/test_jobs.py` -- Suite de tests pour la collecte, la déduplication et le flux SSE
- `apps/web/lib/api.ts` -- Fonctions client pour interroger les offres, lancer la collecte et écouter le SSE
- `apps/web/app/radar/page.tsx` -- Page Radar d'offres réactive avec filtres, déclencheur de collecte et écoute SSE
- `apps/web/components/radar/job-card.tsx` -- Carte d'offre stylisée avec badges pays/plateforme et actions rapides

## Tasks & Acceptance

**Execution:**
- [x] `services/engine/app/ports/connectors.py` -- Créer la classe abstraite `BaseJobConnector` définissant `search_jobs()` et `fetch_job_details()` -- Contrat AD-5
- [x] `services/engine/app/domain/models.py` -- Ajouter l'entité SQLModel `JobOffer` avec unicité et métadonnées complètes -- Modèle de persistance
- [x] `services/engine/app/adapters/connectors/linkedin.py` -- Implémenter le connecteur LinkedIn avec temporisation et mode résilient -- Adaptateur plateforme
- [x] `services/engine/app/adapters/connectors/jobteaser.py` -- Implémenter le connecteur Jobteaser avec temporisation et mode résilient -- Adaptateur plateforme
- [x] `services/engine/app/api/events.py` -- Implémenter le bus d'événements et l'endpoint SSE `/api/events` -- Télémétrie AD-3
- [x] `services/engine/app/api/jobs.py` -- Créer les endpoints REST `/api/jobs`, `/api/jobs/collect`, `/api/jobs/{id}/archive` -- API REST
- [x] `services/engine/app/main.py` -- Déclarer et brancher les routeurs `jobs` et `events` -- Intégration backend
- [x] `services/engine/tests/test_jobs.py` -- Écrire les tests de collecte, déduplication et filtrage des offres -- Validation backend
- [x] `apps/web/lib/api.ts` -- Ajouter les fonctions `fetchJobs`, `collectJobs`, `archiveJob` et hook/helper SSE -- Client API
- [x] `apps/web/components/radar/job-card.tsx` -- Créer le composant de carte d'offre responsive avec badges et raccourcis -- Composant UI
- [x] `apps/web/app/radar/page.tsx` -- Réaliser l'interface Radar complète avec flux live SSE, filtres par pays/mots-clés et modal de collecte -- Surface Radar

**Acceptance Criteria:**
- Given des critères de recherche (ex: France/Tunisie, PFE), when l'utilisateur ou le système déclenche la collecte, then les offres sont collectées sans doublon et persistées en base SQLite.
- Given une offre déjà existante en base, when une nouvelle session de collecte la rencontre, then elle n'est pas dupliquée.
- Given le cockpit web ouvert sur le Radar, when de nouvelles offres sont collectées par le moteur, then elles apparaissent en direct dans l'interface via le flux SSE sans rechargement de page.
- Given une offre dans le Radar, when l'utilisateur clique sur archiver, then son statut passe à `ARCHIVED` et elle disparaît du flux actif.

## Implementation Notes

- Architecture modulaire de connecteurs `BaseJobConnector` respectant le pattern Strategy (AD-5) avec adaptateurs dédiés pour LinkedIn et Jobteaser.
- Jitter aléatoire intégré pour simuler le comportement de navigation humaine et protéger l'utilisateur.
- Table `job_offers` avec déduplication stricte sur `(platform, external_id)` et filtrage multicritères (pays, plateforme, recherche textuelle).
- Bus d'événements SSE temps réel (`/api/events`) diffusant `JOB_DISCOVERED` et `SCRAPE_PROGRESS`.
- Interface Radar cockpit Next.js avec affichage instantané des nouvelles opportunités, filtres par pays (France 🇫🇷 / Tunisie 🇹🇳), modal de scan et action d'archivage.
- 9 tests unitaires et d'intégration validés sous pytest ; compilation production Next.js 100% conforme.

## Spec Change Log

## Review Triage Log

| Verdict | Emplacement | Preuve / Rationale |
|---|---|---|
| `patch` | `services/engine/tests/conftest.py` | Centralisation de l'instance TestClient et de l'engine de test en mémoire partagée (`StaticPool`) pour éviter les collisions de tables SQLite inter-fichiers de tests. |
| `low` | `services/engine/app/api/events.py:11` | Gestion du set d'abonnés SSE en mémoire locale ; adapté pour le modèle monopoint local-first ArcApply (MVP). |

## Design Notes

- Modèle d'événement SSE : `data: {"event": "JOB_DISCOVERED", "timestamp": "ISO8601", "payload": { "id": "...", "title": "...", "company": "..." }}\n\n`
- Jitter : `asyncio.sleep(random.uniform(1.2, 3.5))` entre les requêtes de scraping pour reproduire un comportement humain naturel.
- UI Radar : Disposition en grille moderne, filtres par boutons pills (Tous, France, Tunisie, LinkedIn, Jobteaser), badges visuels discrets et raccourci clavier `x` pour archiver.

## Verification

**Commands:**
- `cd services/engine && uv run pytest tests/test_jobs.py` -- expected: Tous les tests d'ingestion et de déduplication passent.
- `cd apps/web && npm run build` -- expected: Compilation Next.js réussie sans erreur TypeScript ni de lint.
