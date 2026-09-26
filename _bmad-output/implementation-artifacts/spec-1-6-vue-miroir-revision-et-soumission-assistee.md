---
title: "Story 1.6: Vue miroir de révision et déclencheur de soumission assistée sous contrôle humain"
type: 'feature'
created: '2026-09-27'
status: 'in-progress'
baseline_commit: '9200426b1f4ee61a6cfec8b33e294c48a3d30f19'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-test-BMAD-2026-09-26/ARCHITECTURE-SPINE.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le risque d'un envoi accidentel ou d'une candidature non relue est rédhibitoire pour des stages d'excellence PFE, et les outils d'automatisation sans sas humain exposent l'étudiant à des soumissions prématurées ou inadaptées.

**Approach:** Construire un sas d'inspection et de révision miroir côte à côte (`MirrorReviewDrawer`) confrontant l'offre cible, le CV 1 page et la lettre de motivation avec édition en direct, adossé à une machine à états finis stricte backend (`ApplicationFSM`, AD-6 : `DISCOVERED` $\rightarrow$ `REVIEWING` $\rightarrow$ `READY` $\rightarrow$ `SUBMITTED`) et à un compte à rebours d'annulation de 5 secondes (« Human-in-the-Loop ») garantissant le contrôle souverain de l'étudiant.

## Boundaries & Constraints

**Always:**
- **Machine à états finis formelle (AD-6) :** Les transitions autorisées sont strictement :
  `DISCOVERED` $\rightarrow$ `REVIEWING` $\rightarrow$ `READY` $\rightarrow$ `SUBMITTED` $\rightarrow$ `INTERVIEW` $\rightarrow$ `OFFER` (ou `REJECTED`).
  Toute transition illégale (ex: saut direct de `DISCOVERED` à `SUBMITTED` sans passer par `READY`) est rejetée avec une erreur HTTP 422 Unprocessable Entity.
- **Sas de validation humaine & Délai de grâce de 5 secondes :** Lorsque l'étudiant clique sur « Valider et postuler », un compte à rebours visuel de 5 secondes s'enclenche, permettant l'annulation instantanée à tout moment avant l'envoi de la requête définitive.
- **Vue Miroir côte à côte :** Présentation synchrone de :
  1. Panneau gauche : Détails de l'offre (Entreprise, Localisation, Description brute, Compétences requises).
  2. Panneau droit : Pièces de candidature avec onglets interchangeables (CV A4 vectoriel et Lettre de motivation éditable).
- **Règle bloquante AGENTS.md :** Tests unitaires validés, commit conventionnel propre, et push distant `origin/main` obligatoire avant clôture.

**Never:**
- Pas de soumission automatique silencieuse sans clic explicite et confirmation humaine.
- Pas de transition d'état arbitraire contournant la machine à états finis.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ouverture du tiroir miroir | Clic sur « Examiner / Miroir » sur une offre `DISCOVERED` | Transition vers `REVIEWING`, ouverture de la vue miroir côte à côte avec pré-chargement du CV et de la lettre | Status HTTP 200, état mis à jour |
| Validation du dossier complet | Clic sur « Marquer Prêt » depuis l'état `REVIEWING` | Transition vers `READY`, activation du bouton de soumission assistée | Transition autorisée |
| Déclenchement de soumission avec compte à rebours | Clic sur « Soumettre la candidature » | Compte à rebours 5s actif avec bouton « Annuler ». Si non annulé au terme des 5s, transition vers `SUBMITTED` | Annulation immédiate en cas de clic sur « Annuler » |
| Tentative de transition invalide | Requête directe `PATCH /api/jobs/{id}/status` vers `SUBMITTED` alors que l'offre est `DISCOVERED` | Rejet avec HTTP 422 Unprocessable Entity et message explicite | Préservation de l'état d'origine |
| Édition de dernière minute dans le miroir | Modification de la lettre directement dans le tiroir miroir | Sauvegarde en direct et recalcul de l'audit de qualité | Synchronisation immédiate |

</frozen-after-approval>

## Code Map

- `services/engine/app/domain/models.py` -- Définition des états de candidature et constantes FSM
- `services/engine/app/domain/fsm.py` -- Machine à états finis `ApplicationFSM` régissant les transitions légales et vérifications de prérequis
- `services/engine/app/api/jobs.py` -- Endpoints de transition d'état et de soumission assistée `/api/jobs/{id}/transition`
- `services/engine/tests/test_fsm.py` -- Tests unitaires de la machine à états finis, transitions valides et rejets des transitions interdites
- `apps/web/lib/api.ts` -- Fonctions client `transitionJobStatus(jobId, newStatus)`
- `apps/web/components/radar/mirror-review-drawer.tsx` -- Tiroir d'inspection miroir côte à côte avec compte à rebours 5s
- `apps/web/components/radar/job-card.tsx` -- Bouton d'accès direct au sas miroir

## Tasks & Acceptance

**Execution:**
- [ ] `services/engine/app/domain/fsm.py` -- Développer le moteur `ApplicationFSM` validant rigoureusement les transitions d'états -- Machine à états AD-6
- [ ] `services/engine/app/api/jobs.py` -- Implémenter l'endpoint REST de transition d'état `/api/jobs/{id}/transition` avec gestion RFC 7807 -- API FSM
- [ ] `services/engine/tests/test_fsm.py` -- Développer la suite de tests unitaires validant l'interdiction des sauts d'états sauvages -- Tests FSM
- [ ] `apps/web/lib/api.ts` -- Déclarer la méthode `transitionJobStatus` et les statuts autorisés -- Client Web
- [ ] `apps/web/components/radar/mirror-review-drawer.tsx` -- Développer le tiroir miroir côte à côte avec compte à rebours 5s et annulation -- Cockpit Web
- [ ] `apps/web/components/radar/job-card.tsx` -- Connecter le déclencheur d'inspection miroir sur chaque carte -- Surface Radar

**Acceptance Criteria:**
- Given une offre à l'état `DISCOVERED`, when l'étudiant tente de la passer directement à `SUBMITTED`, then le backend rejette avec HTTP 422.
- Given une offre inspectée dans la vue miroir, when elle est validée, then elle transite légalement par `REVIEWING` puis `READY`.
- Given une offre à l'état `READY`, when l'étudiant déclenche la soumission, then un compte à rebours de 5 secondes se lance avec possibilité d'annulation immédiate.
- Given le cockpit web, when le tiroir miroir est ouvert, then l'offre, le CV et la lettre sont confrontés côte à côte de façon ergonomique.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd services/engine && uv run pytest tests/test_fsm.py` -- expected: Tous les tests de la machine à états finis passent.
- `cd apps/web && npm run build` -- expected: Compilation de production Next.js validée sans aucune erreur.
