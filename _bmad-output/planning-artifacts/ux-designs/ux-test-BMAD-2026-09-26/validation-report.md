# Validation Report — ArcApply

- **DESIGN.md:** `_bmad-output/planning-artifacts/ux-designs/ux-test-BMAD-2026-09-26/DESIGN.md`
- **EXPERIENCE.md:** `_bmad-output/planning-artifacts/ux-designs/ux-test-BMAD-2026-09-26/EXPERIENCE.md`
- **Run at:** 2026-09-26T21:11:00Z

## Overall verdict

Le tandem `DESIGN.md` et `EXPERIENCE.md` pose une architecture UX d'une grande rigueur, particulièrement adaptée aux exigences d'un cockpit de productivité pour étudiant ingénieur. L'obligation du contrôle humain (*Human-in-the-loop*) et la règle stricte d'anti-hallucination sont parfaitement traduites dans les parcours et composants clés.

La revue critique à travers la grille standard et les trois prismes spécialisés (Accessibilité WCAG 2.1 AA, Cohérence des flux & cas limites, Heuristiques UX de Nielsen) met en évidence **0 anomalie critique**, **5 points d'attention haute (High)** axés sur le focus clavier du tiroir, le contraste de texte atténué et le mode de repli LinkedIn, ainsi que **6 pistes d'optimisation moyenne (Medium)**.

## Category verdicts

- Flow coverage — adequate
- Token completeness — adequate
- Component coverage — strong
- State coverage — adequate
- Visual reference coverage — adequate
- Bloat & overspecification — strong
- Inheritance discipline — strong
- Shape fit — strong

## Findings by severity

### Critical (0)
*Aucun problème bloquant critique détecté.*

### High (5)

1. **[Accessibility]** — Piège au clavier et cycle de focus dans le Review Drawer (`EXPERIENCE.md § Component Patterns`)
   - *Constat :* À l'ouverture du tiroir via `Space`, le confinement du focus (`focus trap`) et la touche `Escape` pour refermer et restituer le focus à la carte active doivent être formellement spécifiés.
   - *Fix :* Déclarer `aria-modal="true"`, confinement Tab et retour de focus sur `Escape`.

2. **[Accessibility]** — Contraste du texte atténué sur fond sombre (`DESIGN.md § Colors`)
   - *Constat :* Le token `#94A3B8` (`muted-foreground`) sur fond `#1E293B` est juste à la limite WCAG AA sur les textes de petite taille en chasse fixe (`13px`).
   - *Fix :* Ajuster `#94A3B8` à `#A1B0CB` pour garantir un ratio supérieur à 5:1.

3. **[Token completeness]** — Déclaration du token `ring` pour l'accessibilité du focus (`DESIGN.md § frontmatter.colors`)
   - *Constat :* L'anneau de focus est mentionné dans `EXPERIENCE.md` mais absent des tokens YAML du frontmatter de `DESIGN.md`.
   - *Fix :* Ajouter `ring: '#3B82F6'` dans le frontmatter YAML de `DESIGN.md`.

4. **[Flow Coherence]** — Mode de repli lors d'un blocage ou CAPTCHA LinkedIn (`EXPERIENCE.md § Key Flows.Parcours 1`)
   - *Constat :* En cas de question imprévue, de formulaire modifié ou de CAPTCHA, l'utilisateur risque d'être bloqué.
   - *Fix :* Définir un *Fallback Path* ("Contrôle manuel") maintenant le navigateur ouvert avec mise en surbrillance des champs à renseigner.

5. **[Flow Coherence]** — Action de passage ou archivage d'une offre non pertinente (`EXPERIENCE.md § Information Architecture`)
   - *Constat :* Louay a besoin de masquer rapidement une offre sans encombrer son radar actif.
   - *Fix :* Ajouter l'action explicite `Ignorer / Archiver l'offre` (`x` au clavier).

### Medium (6)

1. **[Accessibility]** — Gestion des annonces pour le flux temps réel (`EXPERIENCE.md § State Patterns`)
   - *Constat :* Risque de saturation des lecteurs d'écran si toute la liste d'offres est déclarée en région live.
   - *Fix :* Restreindre `aria-live="polite"` à un badge de synthèse ("N nouvelles offres détectées").

2. **[Flow Coherence]** — Boucle de confirmation de candidature externe (`EXPERIENCE.md § Key Flows.Parcours 2`)
   - *Constat :* Si l'étudiant ferme le site carrière externe sans postuler, la carte reste indéfiniment en statut flottant.
   - *Fix :* Afficher un prompt de réconciliation au retour dans ArcApply ("Avez-vous complété la candidature externe ?").

3. **[UX Heuristics]** — Délai d'inférence LLM et retour d'état (H1 - Statut système) (`EXPERIENCE.md § State Patterns`)
   - *Constat :* Un simple `Skeleton` ne donne pas de visibilité sur l'avancement lors des latences d'API.
   - *Fix :* Intégrer un micro-stepper textuel séquencé (Analyse $\rightarrow$ Alignement $\rightarrow$ Rédaction) avec timer de sécurité.

4. **[UX Heuristics]** — Délai de grâce "Annuler l'envoi" (H3 - Contrôle et liberté) (`EXPERIENCE.md § Interaction Primitives`)
   - *Constat :* Absence de filet de sécurité post-clic avant le déclenchement irréversible.
   - *Fix :* Prévoir un compte à rebours de 5 secondes avec bouton "Annuler" avant soumission directe.

5. **[UX Heuristics]** — Mise en miroir Offre vs Lettre (H6 - Reconnaissance) (`EXPERIENCE.md § Component Patterns`)
   - *Constat :* L'utilisateur doit mémoriser les termes de l'offre pour vérifier la pertinence de la lettre.
   - *Fix :* Afficher un volet split-view synchronisé reliant les critères de l'offre aux paragraphes de la lettre.

6. **[State coverage]** — État "Cold Start" initial (`EXPERIENCE.md § State Patterns`)
   - *Constat :* L'état vide avant toute collecte d'offre n'est pas explicité.
   - *Fix :* Définir l'écran d'accueil vide incitant à compléter le Master Profile et à lancer les premiers critères de recherche.

### Low / Robustesse (5)

1. **[Token completeness]** — Ajout du composant `external-package-modal` dans le frontmatter YAML de `DESIGN.md`.
2. **[Accessibility]** — Ajout d'icônes distinctives dans le badge ATS pour renforcer la non-dépendance à la couleur seule.
3. **[Flow Coherence]** — Toast explicatif lors d'un déplacement manuel direct vers "Postulé" dans le Kanban.
4. **[Flow coverage]** — Parcours 3 court décrivant la mise à jour du Master Profile et la réévaluation automatique du radar.
5. **[Visual reference]** — Harmonisation de la référence textuelle aux maquettes en mode Fast path.

## Reviewer files

- [review-rubric.md](file:///Users/louayzorai/Desktop/bmad-test/_bmad-output/planning-artifacts/ux-designs/ux-test-BMAD-2026-09-26/review-rubric.md)
- [review-accessibility.md](file:///Users/louayzorai/Desktop/bmad-test/_bmad-output/planning-artifacts/ux-designs/ux-test-BMAD-2026-09-26/review-accessibility.md)
- [review-flow-coherence.md](file:///Users/louayzorai/Desktop/bmad-test/_bmad-output/planning-artifacts/ux-designs/ux-test-BMAD-2026-09-26/review-flow-coherence.md)
- [review-heuristics.md](file:///Users/louayzorai/Desktop/bmad-test/_bmad-output/planning-artifacts/ux-designs/ux-test-BMAD-2026-09-26/review-heuristics.md)
- [validation-report.html](file:///Users/louayzorai/Desktop/bmad-test/_bmad-output/planning-artifacts/ux-designs/ux-test-BMAD-2026-09-26/validation-report.html)
