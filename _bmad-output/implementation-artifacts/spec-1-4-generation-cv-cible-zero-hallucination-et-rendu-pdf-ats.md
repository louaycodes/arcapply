---
title: "Story 1.4: Génération de CV ciblé zéro-hallucination et rendu PDF ATS-friendly 1 page"
type: 'feature'
created: '2026-09-27'
status: 'in-progress'
baseline_commit: '01d5f1c2eb0af1143fbbbdc595356527953e505f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-test-BMAD-2026-09-26/ARCHITECTURE-SPINE.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les étudiants ingénieurs passent un temps considérable à adapter manuellement leur CV pour chaque offre ou recourent à des outils d'IA générative qui inventent des compétences techniques (« hallucinations »), entraînant une disqualification immédiate lors des entretiens techniques, ou produisent des PDFs multi-colonnes rejetés par les parseurs ATS.

**Approach:** Développer un moteur d'adaptation et de compilation de CV haut de gamme (`CVGeneratorService`) qui sélectionne et réordonne de façon déterministe les expériences, projets et compétences réels du Master Profile en résonance avec l'offre cible, interdit rigoureusement toute compétence manquante isolée en quarantaine par le moteur ATS (AD-4 Étape 3), et compile un PDF vectoriel d'exactement 1 page A4 standardisée via Playwright (`page.pdf()`, AD-7) avec texte 100% sélectionnable.

## Boundaries & Constraints

**Always:**
- **Zéro-Hallucination Invariant (AD-4 Étape 3) :** Seules les données attestées dans le `MasterProfile` peuvent être insérées dans le CV. Les compétences classées dans `missing_skills` par l'`ATSMatchingEngine` sont formellement proscrites du CV final.
- **Rendu PDF vectoriel 1 page stricte (AD-7) :** Mise en page A4 compacte et élégante calibrée pour tenir rigoureusement sur une page unique, avec texte vectoriel sélectionnable, sans colonnes ou blocs de texte matriciels confus pour les ATS.
- **Compilation Headless Playwright :** Rendu HTML/CSS pur converti en PDF via l'instance Playwright du service backend, sans dépendances système C lourdes (WeasyPrint / Cairo / Pango).
- **Format ATS-friendly :** Structure sémantique claire : En-tête (Contact), Profil / Titre ciblé, Compétences clés (validées & transférables), Expériences professionnelles classées par pertinence, Projets majeurs, Formation.
- **Téléchargement & Prévisualisation Cockpit :** Mise à disposition d'une prévisualisation HTML immédiate et d'un bouton de téléchargement direct du PDF depuis le cockpit web.
- **Règle bloquante AGENTS.md :** Tests unitaires validés, commit conventionnel propre, et push distant `origin/main` obligatoire avant clôture.

**Never:**
- Aucune extrapolation ou synthèse de nouvelle compétence technique non présente dans le Master Profile.
- Aucun PDF dépassant 1 page (overflow A4 proscrit).
- Pas d'exécution de compilation PDF côté Next.js (Strict Decoupling AD-1).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Profil complet & offre avec matching fort | `MasterProfile` complet + `JobOffer` (Python, Docker, API) | CV généré ciblé : projets Python/Docker mis en tête, compétences ordonnées, PDF 1 page généré | Status HTTP 200 avec structure JSON et URL d'export PDF |
| Profil avec compétences manquantes | Offre exigeant Rust/Kubernetes, absents du profil | Compétences absentes strictement exclues du CV, seules les compétences validées/transférables apparaissent | Zéro mention de Rust/Kubernetes dans le CV généré |
| Expériences et projets volumineux | Candidat avec plus de 5 projets et 4 expériences | Algorithme de scoring de pertinence sélectionne les 2-3 expériences et 2-3 projets les plus alignés pour respecter le format 1 page | Tronquage intelligent sans dépassement vertical de la page A4 |
| Profil maître incomplet | `MasterProfile.is_complete == False` | Refus de génération avec blocage CAP-1 | Erreur HTTP 422 avec message explicite sur les champs manquants |
| Export PDF Playwright | Requête `GET /api/cv/pdf/{job_id}` | Flux binaire `application/pdf` téléchargeable avec nom de fichier formaté `CV_<Nom>_<Entreprise>.pdf` | Fallback avec log d'erreur précis si Playwright échoue |

</frozen-after-approval>

## Code Map

- `services/engine/app/domain/cv.py` -- Moteur métier `CVGeneratorService` : sélection de fragments, ordonnancement par pertinence, génération HTML A4
- `services/engine/app/adapters/pdf.py` -- Service de compilation PDF vectoriel `PDFCompilerService` via Playwright
- `services/engine/app/domain/models.py` -- Modèle `TargetedCV` et schémas de réponse de génération
- `services/engine/app/api/cv.py` -- Router REST `/api/cv/generate/{job_id}`, `/api/cv/preview/{job_id}`, `/api/cv/pdf/{job_id}`
- `services/engine/app/main.py` -- Enregistrement du router `cv`
- `services/engine/tests/test_cv.py` -- Tests unitaires : respect strict du zéro hallucination, sélection par pertinence, génération PDF
- `apps/web/lib/api.ts` -- Fonctions client `generateTargetedCV`, `getCVPreviewUrl`, `downloadCVPdf`
- `apps/web/components/radar/cv-preview-modal.tsx` -- Tiroir / Modal de prévisualisation du CV ciblé avec actions de téléchargement
- `apps/web/components/radar/job-card.tsx` -- Déclencheur direct "Générer CV" ouvrant la prévisualisation

## Tasks & Acceptance

**Execution:**
- [ ] `services/engine/app/domain/cv.py` -- Implémenter l'algorithme de ciblage déterministe et le template HTML A4 ATS-friendly -- Moteur CV AD-4
- [ ] `services/engine/app/adapters/pdf.py` -- Implémenter le compilateur Playwright `page.pdf()` pour l'export vectoriel 1 page -- Compilateur PDF AD-7
- [ ] `services/engine/app/domain/models.py` -- Définir le modèle `TargetedCV` et les structures de données associées -- Persistance CV
- [ ] `services/engine/app/api/cv.py` -- Créer les endpoints REST de génération, prévisualisation et téléchargement PDF -- API CV
- [ ] `services/engine/app/main.py` -- Connecter le router CV à l'application FastAPI -- Intégration backend
- [ ] `services/engine/tests/test_cv.py` -- Développer la suite de tests unitaires et d'intégration validant le zéro-hallucination et la compilation PDF -- Tests CV
- [ ] `apps/web/lib/api.ts` -- Déclarer les méthodes d'appel API de génération et téléchargement de CV -- Client Web
- [ ] `apps/web/components/radar/cv-preview-modal.tsx` -- Créer le composant de prévisualisation et téléchargement du CV ciblé -- Cockpit Web
- [ ] `apps/web/components/radar/job-card.tsx` -- Connecter le déclencheur de génération de CV sur chaque carte d'offre -- Surface Radar

**Acceptance Criteria:**
- Given une offre sélectionnée et un profil maître validé, when l'utilisateur clique sur "Générer CV", then un CV ciblé est généré en moins de 3 secondes avec mise en avant des compétences pertinentes.
- Given une offre avec des exigences non maîtrisées par le candidat, when le CV est généré, then aucune des compétences manquantes n'apparaît dans le document final (zéro hallucination).
- Given le CV généré, when le PDF est compilé, then le document PDF vectoriel fait rigoureusement 1 page et son texte est sélectionnable.
- Given le cockpit web, when la prévisualisation est ouverte, then l'étudiant peut relire le CV adapté et télécharger le PDF directement.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd services/engine && uv run pytest tests/test_cv.py` -- expected: Tous les tests de génération de CV et de compilation PDF passent.
- `cd apps/web && npm run build` -- expected: Compilation de production Next.js validée sans aucune erreur.
