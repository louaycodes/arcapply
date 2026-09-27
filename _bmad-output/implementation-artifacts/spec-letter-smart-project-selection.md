---
title: "Fix: Sélection intelligente multi-projets/expériences pour la lettre de motivation"
type: 'bugfix'
created: '2026-09-27'
status: 'in-progress'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La génération de lettre de motivation retombe toujours sur `profile.projects[0]` quel que soit le poste, parce que l'algorithme de sélection est naïf (premier projet trouvé, pas de scoring, comparaison de strings fragile) et ne cite qu'un seul projet/expérience même si plusieurs sont pertinents à l'offre.

**Approach:** Remplacer la logique de sélection par un moteur de scoring multi-critères qui classe TOUS les projets et expériences par nombre de technologies correspondant à l'offre, puis injecte de manière fluide dans la lettre tous les éléments pertinents (pas seulement le premier) avec leurs détails complets, en suivant une structure sobre et convaincante en 4 paragraphes.

</frozen-after-approval>

## Implementation Notes

### Algorithme de scoring

Pour chaque projet/expérience, calculer un `relevance_score` :
- `+2` par technologie en common exact match avec `matched_skills`
- `+1` par technologie en common avec `transferable_skills`  
- `+1` par mot clé du titre du poste trouvé dans `description`

Trier par score décroissant. Seuil de pertinence : score > 0.

### Structure 4 paragraphes

1. **Accroche** : nom du poste + entreprise + contexte PFE + école
2. **Corps multi-réalisations** : citer tous les projets/expériences pertinents (score > 0) en prose fluide, chacun avec ses technologies et son impact concret. Si plusieurs : "Parmi mes réalisations, X m'a permis de… ; de même, Y…"
3. **Valeur ajoutée** : contribution concrète à l'équipe sur les compétences matchées
4. **Clôture** : disponibilité + invitation à entretien technique

### Règle zero-hallucination

- Seules les technologies présentes dans `technologies_raw` du projet/expérience sont citées
- Les `missing_skills` ne sont JAMAIS mentionnés
- Si aucun projet/expérience n'est pertinent (score == 0 pour tous), utiliser la formation comme ancrage

## Verification

**Commands:**
- `cd services/engine && uv run pytest tests/test_letter.py -v` -- expected: tous les tests passent
- `cd services/engine && uv run pytest tests/ -v` -- expected: aucune régression
