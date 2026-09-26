---
title: "Story 1.8: Ingestion automatique des emails recruteurs et mise à jour de statut"
type: 'feature'
created: '2026-09-27'
status: 'in-progress'
baseline_commit: '21fa0ef6c9e0ff5b8eb512c1b184f479d2ee316d'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-test-BMAD-2026-09-26/ARCHITECTURE-SPINE.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le suivi manuel des retours recruteurs reçus par email (convocations d'entretien, accusés de réception, réponses négatives) est fastidieux, chronophage et source d'oublis critiques pour l'étudiant ingénieur en pleine campagne de recherche de stage PFE.

**Approach:** Développer un connecteur d'ingestion et de classification automatique des emails recruteurs (`EmailClassifier` & `EmailConnector`) capable de parser les messages entrants, d'associer chaque retour à la candidature correspondante par rapprochement contextuel (nom d'entreprise, intitulé de poste, références), de classifier déterministement l'intention (`INTERVIEW`, `REJECTION`, `ACKNOWLEDGEMENT`, `OTHER`), et d'actualiser automatiquement l'état FSM de la carte dans le Kanban tout en archivant l'extrait pertinent.

## Boundaries & Constraints

**Always:**
- **Classification déterministe & transparente :**
  - Moteur d'analyse basé sur des motifs linguistiques et sémantiques robustes (FR/EN) pour repérer :
    - `INTERVIEW` : convocation à un entretien technique/RH, créneaux Calendly/Teams/Meet, invitation à un échange.
    - `REJECTION` : réponse négative, profil non retenu pour ce stage, poursuite avec d'autres candidats.
    - `ACKNOWLEDGEMENT` : accusé de réception de dossier, transmission à l'équipe recrutement.
- **Rapprochement contextuel fiable :**
  - Association de l'email à une offre `JobOffer` existante par recherche de l'entreprise (ou variantes) et du titre de poste.
- **Transition d'état FSM sécurisée (AD-6) :**
  - Un email classé `INTERVIEW` fait basculer la candidature de `SUBMITTED` vers `INTERVIEW`.
  - Un email classé `REJECTION` fait basculer la candidature vers `REJECTED`.
  - Si la transition viole la machine à états (ex: offre encore à l'état `DISCOVERED`), l'email est consigné comme note sans transition illégale.
- **Diffusion SSE en temps réel :**
  - Émission de l'événement SSE `EMAIL_RECEIVED` et `JOB_STATUS_CHANGED` pour synchroniser le cockpit web sans rechargement.
- **Règle bloquante AGENTS.md :** Tests unitaires validés, commit conventionnel propre, et push distant `origin/main` obligatoire avant clôture.

**Never:**
- Pas d'envoi d'email sortant non sollicité ou non supervisé (in-scope uniquement pour l'ingestion entrante).
- Pas de transition sauvage violant AD-6.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Convocation entretien reçue | Email d'Airbus : "Entretien pour votre candidature Stage Ingénieur PFE" | Classification `INTERVIEW`, association à l'offre Airbus, transition vers `INTERVIEW`, diffusion SSE | Statut 200, log de l'extrait |
| Refus recruteur reçu | Email de Thales : "Nous ne donnons pas suite à votre candidature" | Classification `REJECTION`, association à l'offre Thales, transition vers `REJECTED` | Statut 200, archive du motif |
| Accusé de réception | Email de Jobteaser / Entreprise : "Votre candidature a bien été reçue" | Classification `ACKNOWLEDGEMENT`, association à l'offre, horodatage consigné sans changement d'état majeur | Statut 200 |
| Email sans correspondance | Email d'un expéditeur inconnu ne matchant aucune entreprise en base | Consigné dans l'historique avec `job_id = None` et statut `UNMATCHED` | Pas de plantage, conservé pour audit |

</frozen-after-approval>

## Code Map

- `services/engine/app/domain/models.py` -- Modèle `EmailInteraction` stockant l'expéditeur, le sujet, le snippet, la catégorie et l'offre associée
- `services/engine/app/domain/email_classifier.py` -- Moteur de classification déterministe d'emails recruteurs et de réconciliation avec les offres
- `services/engine/app/api/emails.py` -- Endpoints REST `/api/emails/ingest`, `/api/emails/recent`, `/api/emails/simulate`
- `services/engine/tests/test_email.py` -- Suite de tests unitaires pour la classification, le matching d'offres et les transitions automatiques
- `apps/web/lib/api.ts` -- Interfaces `EmailInteraction` et fonctions client `fetchRecentEmails`, `simulateEmailInteraction`
- `apps/web/components/kanban/email-inbox-modal.tsx` -- Modal / tiroir d'inspection de la boîte de réception recruteurs et de simulation
- `apps/web/app/kanban/page.tsx` -- Bouton d'accès rapide et notification en direct des emails recruteurs reçus

## Tasks & Acceptance

**Execution:**
- [ ] `services/engine/app/domain/models.py` -- Ajouter le modèle `EmailInteraction` et ses schémas de lecture -- Base de données
- [ ] `services/engine/app/domain/email_classifier.py` -- Développer le classifieur d'emails et l'algorithme de réconciliation d'offres -- Moteur IA & Regex
- [ ] `services/engine/app/api/emails.py` -- Implémenter le routeur FastAPI des emails avec simulation et diffusion SSE -- API Backend
- [ ] `services/engine/tests/test_email.py` -- Développer la suite de tests complète (détection entretien, refus, accusé, FSM) -- Tests Engine
- [ ] `apps/web/lib/api.ts` -- Déclarer les types et méthodes API pour la boîte de réception recruteurs -- Client Web
- [ ] `apps/web/components/kanban/email-inbox-modal.tsx` -- Développer l'interface de consultation des emails et de simulation de retours -- Composant Cockpit
- [ ] `apps/web/app/kanban/page.tsx` -- Intégrer l'inbox recruteur dans le cockpit Kanban avec badge dynamique -- Surface Kanban

**Acceptance Criteria:**
- Given un email recruteur contenant des mots-clés de convocation d'entretien pour une entreprise postulée, when l'email est ingéré, then il est classé `INTERVIEW`, associé à l'offre et celle-ci bascule automatiquement dans la colonne `INTERVIEW`.
- Given un email contenant une formule de rejet, when analysé, then la carte associée bascule en `REJECTED`.
- Given le cockpit Kanban, when un retour recruteur est simulé ou reçu, then l'interface se met à jour en temps réel via SSE et affiche l'extrait du message.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd services/engine && uv run pytest tests/test_email.py` -- expected: Tous les tests d'ingestion et de classification d'emails passent.
- `cd apps/web && npm run build` -- expected: Compilation de production Next.js validée sans aucune erreur.
