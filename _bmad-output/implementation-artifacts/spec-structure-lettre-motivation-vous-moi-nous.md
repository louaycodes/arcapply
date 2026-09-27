---
title: "Optimisation de la Structure de Génération des Lettres de Motivation (Standard Vous-Moi-Nous & Adaptation PFE/JOB)"
type: 'feature'
created: '2026-09-27'
status: 'done'
route: 'dispatch'
baseline_commit: 'd98dc6085a3cff9d71c8ee9bb527c3ff50e2060e'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem :**
1. La structure actuelle de génération de lettre dans `letter.py` est figée sur le statut d'étudiant en recherche de stage PFE de 6 mois, y compris lorsque l'utilisateur a configuré son mode sur `JOB` (CDI / CDD / Premier Emploi).
2. L'enchaînement des paragraphes ne capitalise pas pleinement sur la structure canonique de recrutement la plus valorisée pour les profils ingénieurs (méthode **« VOUS – MOI – NOUS »** recommandée par l'Apec et les Career Services internationaux type Harvard), ce qui affaiblit l'impact de l'accroche et la projection du recruteur.

**Approach :**
Refondre le moteur de synthèse textuelle de `CoverLetterService.generate_cover_letter()` dans `services/engine/app/domain/letter.py` en s'appuyant sur les standards de référence :
1. **Structure en 4 actes "VOUS - MOI - NOUS - DEMAIN" :**
   - **VOUS (L'Accroche & Les Enjeux de l'Entreprise)** : Citer l'entreprise `{company}`, l'intitulé du poste `{job_title}` et les enjeux techniques cibles identifiés dans l'offre.
   - **MOI (La Preuve par les Réalisations)** : Injection des projets et expériences concrets scorés par pertinence ATS, illustrant la maîtrise de la stack et la méthodologie de développement.
   - **NOUS (La Synergie & Valeur Ajoutée)** : Projection concrète sur ce que le candidat apporte dès son intégration sur les compétences matchées.
   - **DEMAIN (Call-to-Action & Disponibilité)** : Formulation sobre proposant un échange technique, disponibilité contextualisée (PFE vs Emploi immédiat).
2. **Adaptation dynamique au `search_mode` (PFE vs JOB) :**
   - Si `search_mode == "JOB"` ou `offer_type == "JOB"` : posture d'ingénieur diplômé / jeune diplômé disponible pour un poste en CDI/CDD, valorisant l'autonomie et l'opérationnalité immédiate.
   - Si `search_mode == "PFE"` : posture d'élève-ingénieur en quête de son projet de fin d'études (4 à 6 mois).
3. **Respect strict de l'invariant Zéro-Hallucination :**
   - Aucune extrapolation sur les compétences non listées (`missing_skills` bannis).
   - Maintien et enrichissement du filtre déterministe anti-clichés IA (`CLICHE_RULES`).

## Boundaries & Constraints

**Always:**
- Respect absolu de l'invariant **Zéro-Hallucination** : seules les technologies et réalisations factuelles du `MasterProfile` sont injectées.
- Concision stricte : la lettre générée doit tenir sur une page standard (entre 250 et 380 mots).
- Ton d'ingénieur sobre, factuel et précis (éradication des adjectifs pompeux ou verbeux).
- Disponibilité contextualisée selon le statut : PFE (durée 4-6 mois, dates scolaires) ou Emploi (disponibilité immédiate ou préavis).
- Tests automatisés validant la distinction PFE/JOB, le zéro-hallucination, la présence des sections Vous/Moi/Nous et le filtre anti-clichés.

**Never:**
- Ne jamais mentionner un stage PFE si le profil ou l'offre cible est un Emploi (`JOB`).
- Ne jamais inventer de métriques ou de projets absents du profil.
- Ne pas introduire de clichés d'IA générative bannis.

## I/O & Edge-Case Matrix

| Scenario | Input / Contexte | Sortie / Comportement attendu |
|----------|------------------|-------------------------------|
| Mode PFE | Profil `search_mode="PFE"`, offre PFE | Accroche élève-ingénieur, stage de fin d'études (PFE), disponibilité adaptée |
| Mode Emploi | Profil `search_mode="JOB"`, offre CDI | Accroche jeune ingénieur diplômé, poste en CDI/CDD, disponibilité immédiate |
| Aucun projet pertinent (score 0) | Profil avec projets non alignés | Repli élégant sur la formation académique et les compétences clés sans halluciner de faux projets |
| Clichés IA dans les descriptions | Phrases types du profil | Détection et assainissement automatique via `CLICHE_RULES` |
| Surcharge par type d'offre | Profil PFE mais offre classée JOB | La lettre s'adapte en priorité à la nature de l'offre ciblée |

</frozen-after-approval>

## Code Map

- `services/engine/app/domain/letter.py` -- Refonte des templates et paragraphes structurés (Vous / Moi / Nous / Demain), prise en compte de `profile.search_mode` et `job.offer_type`, enrichissement du dictionnaire `CLICHE_RULES`, intégration LLM Groq.
- `services/engine/tests/test_letter.py` -- Nouveaux tests validant la structure Apec Vous-Moi-Nous, la différenciation PFE vs JOB, et le zéro-hallucination.

## Tasks & Acceptance

**Exécution :**
- [x] `services/engine/app/domain/letter.py` -- Enrichir `CLICHE_RULES` avec les tics de langage identifiés lors des benchmarks de recrutement ingénieur
- [x] `services/engine/app/domain/letter.py` -- Modulariser la génération en 4 sections : `_build_vous_paragraph()`, `_build_moi_paragraph()`, `_build_nous_paragraph()`, `_build_demain_paragraph()`
- [x] `services/engine/app/domain/letter.py` -- Conditionner dynamiquement le vocabulaire selon `search_mode` / `offer_type` (PFE vs Emploi/CDI)
- [x] `services/engine/app/domain/letter.py` -- Intégrer l'inférence LLM Groq avec repli déterministe garanti et garde-fous zéro-hallucination
- [x] `services/engine/tests/test_letter.py` -- Ajouter les cas de tests unitaires couvrant la structure Vous/Moi/Nous et la dissociation PFE/JOB

**Critères d'Acceptation :**
- Pour un profil en recherche de JOB, la lettre générée ne contient aucune mention de "stage" ou "PFE" et met en avant la recherche d'un poste en CDI/CDD.
- Pour un profil en recherche de PFE, la lettre mentionne clairement le stage de fin d'études et sa durée.
- La structure respecte distinctement les 4 temps (Vous / Moi / Nous / Demain).
- La suite de tests `tests/test_letter.py` et la suite globale `tests/` sont 100% vertes.

## Implementation Notes

- Modèle d'IA : Intégration du SDK officiel `groq` avec le modèle `qwen/qwen3.8-27b` via un prompt ultra-cadré (structure Vous-Moi-Nous, zéro hallucination, respect du mode PFE vs JOB).
- Repli déterministe : Bascule automatique transparente sur le moteur déterministe 4 actes en cas d'indisponibilité réseau, de dépassement de quota ou de détection d'une hallucination.
- Filtrage anti-clichés : Enrichissement du dictionnaire `CLICHE_RULES` avec les expressions d'ingénieurs proscrites (`force de proposition`, `couteau suisse`, `soif d'apprendre`, `relever ce challenge`).
- Tests validés : 8 tests dans `test_letter.py` et 42 tests au total sur l'engine backend.
