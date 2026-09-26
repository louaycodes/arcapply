---
title: "Story 1.3: Calcul d'alignement ATS déterministe et inventaire des écarts de compétences"
type: 'feature'
created: '2026-09-26'
status: 'in-progress'
baseline_commit: '476a0994500ce86c1fa4d38d7e48b09cc42a0922'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'étudiant ingénieur ne dispose pas d'évaluation objective et transparente de l'adéquation de son profil avec une offre, risquant soit de postuler à des offres inadaptées, soit de subir des rejets silencieux par les parseurs ATS en raison de mots-clés absents.

**Approach:** Implémenter un moteur de matching déterministe pur en Python (`ATSMatchingEngine`) qui extrait les compétences et prérequis d'une offre, les confronte rigoureusement au Master Profile immuable, calcule un score d'alignement mathématique de 0 à 100%, et ventile les compétences en 3 catégories strictes (correspondances exactes, compétences transférables, lacunes réelles) sans aucune hallucination, exposé via l'API et rendu dans le composant visuel `AtsScoreBadge` du cockpit web.

## Boundaries & Constraints

**Always:**
- Algorithme déterministe hors-LLM (AD-4 Étape 2) : Le calcul d'intersection, la pondération et la ventilation sont exécutés par du code Python pur auditable, mathématiquement reproductible.
- Règle de zéro-hallucination : Ne jamais déduire ou supposer acquise une compétence qui ne figure pas explicitement dans le Master Profile (formations, projets, expériences, compétences).
- Ventilation en 3 catégories fermées :
  1. `matched_skills` (Vert / exact) : Compétence explicitement présente dans le Master Profile.
  2. `transferable_skills` (Ambre / transférable) : Technologie liée ou équivalente (ex: React ↔ Next.js, FastAPI ↔ Flask/Python).
  3. `missing_skills` (Rouge / lacune) : Compétence requise absente du profil maître.
- Persistance et association : Stocker le score et la ventilation associés à chaque offre d'emploi.
- Double encodage visuel (EXPERIENCE.md) : Icônes (`✓`, `⚠`, `✕`) + couleurs conformes aux tokens de DESIGN.md (`#10B981`, `#F59E0B`, `#EF4444`).
- Règle bloquante AGENTS.md : Tests verts + commit atomique + push distant vers `origin/main` obligatoire avant clôture.

**Never:**
- Pas d'estimation probabiliste opaque par le LLM pour le score final.
- Pas d'auto-remplissage des compétences manquantes dans le profil sans action explicite de l'utilisateur.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Calcul alignement offre & profil complet | Offre avec prérequis (ex: Python, Docker, React) et Master Profile contenant Python, Docker, Next.js | Score calculé (ex: 82%), `matched: [Python, Docker]`, `transferable: [React via Next.js]`, `missing: []` | Score borné entre 0 et 100 |
| Offre avec prérequis totalement absents | Offre exigeant Kubernetes, Rust, C++ et profil sans ces compétences | Score faible (ex: 0-15%), `missing: [Kubernetes, Rust, C++]`, `can_generate: false` ou alerte | Isolation formelle des lacunes |
| Offre brute non structurée | Texte brut contenant description et missions en langage naturel | Extraction normalisée des technologies et compétences requises via taxonomie technique | Fallback par extraction lexicale insensible à la casse |
| Profil maître incomplet | Tentative de calcul avec Master Profile vide ou sans compétences | Retourne score calculé avec avertissement de complétude invitant à renseigner le profil | Réponse HTTP 200 avec mention `profile_incomplete: true` |
| Consultation de l'alignement sur le Radar | Clic ou survol du badge ATS sur une carte d'offre | Affichage immédiat de l'infobulle détaillée avec ventilation des 3 listes | UI fluide sans latence réseau |

</frozen-after-approval>

## Code Map

- `services/engine/app/domain/ats.py` -- Moteur métier `ATSMatchingEngine`, taxonomie technique et calcul déterministe
- `services/engine/app/domain/models.py` -- Modèle `ATSMatchResult` (score, matched, transferable, missing) lié à `JobOffer`
- `services/engine/app/api/ats.py` -- Router REST `/api/ats/match/{job_id}` et `/api/ats/batch-match`
- `services/engine/app/main.py` -- Enregistrement du router `ats`
- `services/engine/tests/test_ats.py` -- Tests unitaires du calcul mathématique, cas limites et taxonomie transférable
- `apps/web/lib/api.ts` -- Fonctions client `fetchJobATSScore(jobId)` et types `ATSMatchResult`
- `apps/web/components/radar/ats-score-badge.tsx` -- Badge ATS interactif avec infobulle et code couleur conforme à DESIGN.md
- `apps/web/components/radar/job-card.tsx` -- Intégration du badge ATS dans chaque carte du flux Radar

## Tasks & Acceptance

**Execution:**
- [ ] `services/engine/app/domain/ats.py` -- Implémenter l'extracteur de prérequis et l'algorithme mathématique de matching déterministe -- Cœur ATS AD-4
- [ ] `services/engine/app/domain/models.py` -- Définir le modèle SQLModel `ATSMatchResult` et ses DTOs Pydantic -- Modèle de persistance ATS
- [ ] `services/engine/app/api/ats.py` -- Créer les endpoints REST `/api/ats/match/{job_id}` et calcul batch pour le radar -- API ATS
- [ ] `services/engine/app/main.py` -- Déclarer et connecter le router ATS à l'application FastAPI -- Intégration backend
- [ ] `services/engine/tests/test_ats.py` -- Valider par tests unitaires le calcul du score (0 à 100%), la classification des 3 listes et l'anti-hallucination -- Suite de tests ATS
- [ ] `apps/web/lib/api.ts` -- Déclarer les interfaces `ATSMatchResult` et l'appel API `fetchJobATSScore` -- Typage client
- [ ] `apps/web/components/radar/ats-score-badge.tsx` -- Développer le badge interactif avec jauge circulaire ou pill et infobulle détaillée -- Composant ATS DESIGN.md
- [ ] `apps/web/components/radar/job-card.tsx` -- Intégrer le badge ATS directement sur chaque carte d'offre du Radar -- Surface Radar

**Acceptance Criteria:**
- Given une offre de stage sélectionnée et le Master Profile validé, when le calcul d'alignement est exécuté, then un score d'alignement ATS (0 à 100%) déterministe et reproductible est retourné.
- Given le résultat du calcul d'alignement, when l'utilisateur examine la ventilation, then les compétences sont rigoureusement catégorisées en correspondances directes (`✓`), transférables (`⚠`) et manquantes (`✕`).
- Given une compétence absente du Master Profile, when le matching est calculé, then cette compétence apparaît obligatoirement dans `missing_skills` et n'est jamais extrapolée.
- Given le cockpit web ouvert sur le Radar, when les offres s'affichent, then chaque carte présente son score ATS avec accès au détail des compétences.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

- Formule de score :
  $Score = \min\left(100, \text{round}\left( \frac{N_{\text{matched}} \times 1.0 + N_{\text{transferable}} \times 0.6}{N_{\text{total\_required}}} \times 100 \right)\right)$
- Taxonomie transférable : règles de proximité sémantique (ex: Next.js ↔ React, FastAPI ↔ Flask/Python, Docker ↔ Kubernetes/Conteneurs, PostgreSQL ↔ SQL/SQLite).
- Palette de couleurs WCAG AA : `match-high` (`#10B981`), `match-medium` (`#F59E0B`), `match-low` (`#EF4444`).

## Verification

**Commands:**
- `cd services/engine && uv run pytest tests/test_ats.py` -- expected: Tous les tests du moteur ATS passent.
- `cd apps/web && npm run build` -- expected: Compilation de production Next.js validée sans aucune erreur.
