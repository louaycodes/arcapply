---
title: "Story 1.7: Suivi Kanban du cycle de vie des candidatures et métriques de conversion"
type: 'feature'
created: '2026-09-27'
status: 'in-progress'
baseline_commit: '23e6fe34d8ef849ce391696dbfb4bfa4c7b65342'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-test-BMAD-2026-09-26/ARCHITECTURE-SPINE.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'étudiant ingénieur postulant à des dizaines d'offres ciblées perd le fil de ses démarches, ignore son taux de transformation en entretien, et manque de visibilité sur les candidatures nécessitant une relance ou un suivi immédiat.

**Approach:** Développer un cockpit Kanban interactif à 7 colonnes sous Next.js (`apps/web/app/kanban/page.tsx`) synchronisé avec la machine à états finis (`services/engine/app/domain/fsm.py`), avec widgets d'analyse de conversion en temps réel (taux d'entretien, candidatures actives, alertes de relance J+7), et transition fluide des cartes d'étape en étape respectant les règles AD-6.

## Boundaries & Constraints

**Always:**
- **Pipeline Kanban à 7 étapes:**
  1. `DISCOVERED` (Découvertes)
  2. `REVIEWING` (En cours de révision)
  3. `READY` (Prêtes pour envoi)
  4. `SUBMITTED` (Postulées / Transmises)
  5. `INTERVIEW` (Entretiens obtenus)
  6. `OFFER` (Offres reçues)
  7. `REJECTED` (Non retenu / Archivé)
- **Métriques analytiques souveraines :**
  - Taux de conversion en entretien (`INTERVIEW` / Total postulé * 100, cible > 15%).
  - Taux de réponse global (`(INTERVIEW + OFFER + REJECTED) / SUBMITTED`).
  - Détection des alertes de relance (candidatures à l'état `SUBMITTED` depuis plus de 7 jours).
- **Cartes Kanban interactives :**
  - Affichage de l'entreprise, du titre du poste, du badge ATS et de la date horodatée.
  - Actions contextuelles autorisées par la machine à états (ex: marquer entretien, consigner refus, rouvrir le miroir).
- **Règle bloquante AGENTS.md :** Tests unitaires validés, commit conventionnel propre, et push distant `origin/main` obligatoire avant clôture.

**Never:**
- Pas de saut d'état illégal contournant la machine à états finis.
- Pas de calcul de métriques basé sur des données fictives : calcul déterministe depuis la base SQLite.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Consultation du Kanban | Navigation sur `/kanban` | Affichage des 7 colonnes avec compteurs d'offres et cartes ordonnées par date | Chargement fluide et gestion état vide |
| Métriques de conversion | Requête `GET /api/jobs/metrics` | Retour JSON avec répartition par état, taux d'entretien, relances dues | Statut HTTP 200 |
| Avancement d'une candidature | Clic sur « Décroché en entretien » sur une carte `SUBMITTED` | Appel `PATCH /api/jobs/{id}/transition` vers `INTERVIEW`, carte déplacée immédiatement dans la colonne Entretien | Gestion d'erreur et notification |
| Relance due | Candidature soumise depuis > 7 jours | Badge d'alerte « Relance recommandée » avec calcul du délai écoulé | Affichage visuel distinctif |

</frozen-after-approval>

## Code Map

- `services/engine/app/api/jobs.py` -- Endpoint `GET /api/jobs/metrics` calculant les compteurs et taux de conversion
- `services/engine/tests/test_jobs.py` -- Tests unitaires pour l'endpoint de métriques du pipeline
- `apps/web/lib/api.ts` -- Interface `PipelineMetrics` et fonction client `fetchPipelineMetrics()`
- `apps/web/app/kanban/page.tsx` -- Page principale du Kanban avec en-tête analytique et colonnes d'étapes
- `apps/web/components/kanban/kanban-column.tsx` -- Composant de colonne Kanban responsive avec compteur
- `apps/web/components/kanban/kanban-card.tsx` -- Carte de candidature Kanban avec badges, actions rapides et alerte relance

## Tasks & Acceptance

**Execution:**
- [x] `services/engine/app/api/jobs.py` -- Implémenter l'endpoint `GET /api/jobs/metrics` avec compteurs et taux de conversion -- Backend Metrics
- [x] `services/engine/tests/test_jobs.py` -- Ajouter les tests unitaires pour l'endpoint de métriques du pipeline -- Tests Engine
- [x] `apps/web/lib/api.ts` -- Déclarer le modèle `PipelineMetrics` et la fonction client `fetchPipelineMetrics` -- API Client
- [x] `apps/web/components/kanban/kanban-card.tsx` -- Développer la carte Kanban avec badges ATS, alerte relance et boutons d'action -- Composant UI
- [x] `apps/web/components/kanban/kanban-column.tsx` -- Développer la colonne Kanban avec compteur et conteneur déroulant -- Composant UI
- [x] `apps/web/app/kanban/page.tsx` -- Assembler le cockpit Kanban complet avec barre de métriques analytiques -- Page Cockpit

**Acceptance Criteria:**
- Given le cockpit `/kanban`, when l'étudiant accède à la page, then les 7 colonnes affichent les candidatures réparties selon leur état FSM.
- Given une candidature `SUBMITTED`, when elle est marquée comme « Entretien », then son statut passe à `INTERVIEW` et les métriques se recalculent instantanément.
- Given une offre `SUBMITTED` depuis plus de 7 jours, when affichée dans le Kanban, then elle comporte un indicateur d'alerte de relance.
- Given la barre de métriques, when consultée, then le taux de conversion en entretien et le total actif sont fidèlement calculés.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd services/engine && uv run pytest tests/test_jobs.py` -- expected: Tous les tests de l'API jobs et des métriques passent.
- `cd apps/web && npm run build` -- expected: Compilation de production Next.js validée sans aucune erreur.
