---
title: "Story 1.5: Rédaction de lettre de motivation sur-mesure au ton sobre d'élève-ingénieur"
type: 'feature'
created: '2026-09-27'
status: 'in-progress'
baseline_commit: 'b53973178f712e324ee81434e199d537602a3ef1'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-test-BMAD-2026-09-26/ARCHITECTURE-SPINE.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les lettres de motivation produites par les LLMs standards sont saturées de flatteries artificielles, d'expressions pompeuses (« vivement intéressé », « candidat idéal », « dynamique et motivé ») et d'extrapolations non vérifiées, qui détruisent la crédibilité d'un élève-ingénieur auprès des équipes techniques.

**Approach:** Développer un moteur de synthèse de lettre de motivation sur-mesure (`CoverLetterService`) fondé sur le pipeline anti-hallucination contraint (AD-4 Étape 3), qui n'injecte que les réalisations factuelles et projets pertinents du Master Profile, applique un filtre strict anti-clichés d'IA détectant et éradiquant les expressions stéréotypées, et adopte un style d'élève-ingénieur concis, direct et technique.

## Boundaries & Constraints

**Always:**
- **Zéro-Hallucination Invariant (AD-4) :** Aucune compétence, formation ou responsabilité inventée. Le contexte de génération ne contient que les données vérifiées du `MasterProfile` et les compétences validées par le matching ATS (Story 1.3).
- **Filtre Anti-Clichés Déterministe :** Application systématique d'une liste noire d'expressions d'IA bannies (ex: « dynamique et motivé », « enthousiaste à l'idée de », « opportunité rêvée », « synergie », « candidat idéal », « passionné depuis toujours »).
- **Structure sobre d'ingénieur en 4 parties :**
  1. Accroche directe liant la recherche de PFE aux enjeux techniques de l'offre.
  2. Illustration factuelle par un projet / expérience réelle utilisant la stack requise.
  3. Contribution technique concrète apportée à l'équipe.
  4. Appel à l'échange technique direct et formule de politesse sobre.
- **Édition en ligne :** La lettre générée est entièrement éditable par l'étudiant dans le cockpit avant toute soumission.
- **Règle bloquante AGENTS.md :** Tests unitaires validés, commit conventionnel propre, et push distant `origin/main` obligatoire avant clôture.

**Never:**
- Pas de jargon marketing creux ni de superlatifs grandiloquents.
- Pas d'envoi automatique de lettre sans validation humaine.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Génération lettre sur offre technique | Offre FastAPI/Cloud + profil complet avec projet ArcApply | Lettre générée citant factuellement le projet ArcApply et les défis d'architecture de l'offre | Score de cliché 0/100, texte concis (200-280 mots) |
| Détection d'un cliché d'IA | Présence d'une phrase bannie dans le brouillon LLM | Détection immédiate par le filtre d'audit et substitution déterministe par une formulation sobre | Nettoyage automatique avec signalement dans le rapport de synthèse |
| Profil maître incomplet | `MasterProfile.is_complete == False` | Refus de génération avec blocage CAP-1 | Erreur HTTP 422 avec message d'action requis |
| Offre sans stack technique explicite | Description d'offre générique ou axée gestion de projet | Articulation autour des projets d'ingénierie majeurs de l'étudiant sans inventer de stack | Cadrage sur la rigueur d'ingénierie et l'apprentissage rapide |
| Édition manuelle par l'utilisateur | Requête `PUT /api/letter/{job_id}` avec modifications | Sauvegarde de la version personnalisée dans SQLite avec mise à jour du filtre de clichés | Statut HTTP 200 avec contenu mis à jour |

</frozen-after-approval>

## Code Map

- `services/engine/app/domain/models.py` -- Modèle `CoverLetter` (table `cover_letters`) et DTOs Pydantic
- `services/engine/app/domain/letter.py` -- Moteur métier `CoverLetterService` : filtre anti-clichés, prompt structuré, synthèse sobre
- `services/engine/app/api/letter.py` -- Router REST `/api/letter/generate/{job_id}`, `/api/letter/{job_id}` (GET, PUT)
- `services/engine/app/main.py` -- Enregistrement du router `letter`
- `services/engine/tests/test_letter.py` -- Tests unitaires : éradication des clichés, respect du profil, API REST
- `apps/web/lib/api.ts` -- Interfaces `CoverLetter` et fonctions client `generateCoverLetter`, `fetchCoverLetter`, `updateCoverLetter`
- `apps/web/components/radar/letter-preview-modal.tsx` -- Modal d'édition et de relecture avec audit anti-clichés et copie rapide
- `apps/web/components/radar/job-card.tsx` -- Déclencheur direct "Rédiger Lettre" sur les offres du Radar

## Tasks & Acceptance

**Execution:**
- [ ] `services/engine/app/domain/models.py` -- Définir le modèle SQLModel `CoverLetter` et ses schémas DTO -- Modèle de persistance
- [ ] `services/engine/app/domain/letter.py` -- Implémenter le moteur `CoverLetterService` avec filtre anti-clichés et synthèse sobre -- Domaine IA AD-4
- [ ] `services/engine/app/api/letter.py` -- Créer les endpoints REST de génération, consultation et mise à jour de lettre -- API Lettre
- [ ] `services/engine/app/main.py` -- Connecter le router `letter` à l'application FastAPI -- Intégration backend
- [ ] `services/engine/tests/test_letter.py` -- Développer la suite de tests validant l'absence de clichés et le respect strict du profil -- Tests unitaires
- [ ] `apps/web/lib/api.ts` -- Déclarer les méthodes d'appel API de génération et mise à jour de lettre -- Typage client
- [ ] `apps/web/components/radar/letter-preview-modal.tsx` -- Créer le composant de prévisualisation et édition de la lettre avec audit anti-clichés -- Cockpit Web
- [ ] `apps/web/components/radar/job-card.tsx` -- Intégrer le bouton d'accès à la lettre de motivation sur chaque carte d'offre -- Surface Radar

**Acceptance Criteria:**
- Given une offre cible et un profil maître validé, when la lettre est générée, then elle ne contient aucune expression issue de la liste noire de clichés IA.
- Given une lettre générée, when le texte est analysé, then les arguments s'appuient exclusivement sur les projets et compétences réels de l'étudiant.
- Given le cockpit web, when l'utilisateur ouvre la modale de lettre, then il peut lire, éditer en ligne et copier le texte final.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd services/engine && uv run pytest tests/test_letter.py` -- expected: Tous les tests de la lettre et du filtre anti-clichés passent.
- `cd apps/web && npm run build` -- expected: Compilation de production Next.js validée sans aucune erreur.
