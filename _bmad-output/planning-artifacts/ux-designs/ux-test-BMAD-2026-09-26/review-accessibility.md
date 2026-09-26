# Review: Accessibility & Inclusivity (WCAG 2.1 AA) — ArcApply

**Cible** : `DESIGN.md` & `EXPERIENCE.md`
**Auditeur** : Accessibility & Assistive Tech Specialist
**Statut** : Terminé

---

## Synthèse globale

L'intention d'accessibilité est explicitement posée dans `EXPERIENCE.md` (navigation clavier, balises sémantiques, ratios de contraste visés). Cependant, l'utilisation d'une palette très sombre (`#0B0F19`) combinée à des éléments d'information textuelle secondaire présente des risques précis de contraste insuffisant et de gestion de focus dans le tiroir latéral contextuel (`review-drawer`).

---

## Findings

### 1. Contraste de couleur sur texte atténué (`muted-foreground`)
- **Sévérité** : **High**
- **Emplacement** : `DESIGN.md.Colors` (`muted-foreground: '#94A3B8'` sur `background: '#0B0F19'` et `muted: '#1E293B'`)
- **Problème** : Sur le fond `muted` (`#1E293B`), le ratio de contraste pour `#94A3B8` est de **4.68:1** (conforme AA pour texte normal), mais tombe sous les **4.5:1** si utilisé sur des bordures actives ou en taille réduite (`JetBrains Mono 13px`). De plus, le texte d'état `match-medium` (`#F59E0B`) sur fond `#0B0F19` ou `#1E293B` offre un contraste moyen (environ 4.8:1) qui peut fatiguer l'œil sur les longues descriptions.
- **Fix recommandé** : Ajuster `#94A3B8` à `#A1B0CB` pour les métadonnées sur surfaces sombres. Réserver `#F59E0B` aux icônes/badges avec fond sombre contrasté et veiller à une police semi-bold.

### 2. Piège au clavier et gestion du focus dans le `review-drawer`
- **Sévérité** : **High**
- **Emplacement** : `EXPERIENCE.md.Interaction Primitives` & `Component Patterns`
- **Problème** : Lorsque le tiroir de validation s'ouvre via la touche `Space`, la spécification n'explicite pas le transfert de focus immédiat (`focus trap` / `aria-modal="true"`) ni la touche `Escape` pour refermer le tiroir et restituer le focus à la carte d'offre active dans le flux.
- **Fix recommandé** : Spécifier explicitement : à l'ouverture, focus automatique sur le premier élément interactif (ou l'en-tête de révision) ; confinement du focus clavier (Tab looping) à l'intérieur du tiroir tant qu'il est ouvert ; `Escape` referme le tiroir et replace le focus sur la ligne de l'offre.

### 3. Annonce des mises à jour dynamiques du radar d'offres (Live Regions)
- **Sévérité** : **Medium**
- **Emplacement** : `EXPERIENCE.md.State Patterns` (Scraping actif en arrière-plan)
- **Problème** : Les offres insérées dynamiquement en arrière-plan peuvent saturer ou désorienter un utilisateur de lecteur d'écran si une région `aria-live="polite"` n'est pas spécifiquement bornée à un compteur de nouvelles offres plutôt qu'au flux entier.
- **Fix recommandé** : Utiliser un badge d'alerte `aria-live="polite"` ("3 nouvelles offres détectées") plutôt que de rendre la liste complète réactive en lecture vocale.

### 4. Indicateur non purement chromatique pour le score ATS
- **Sévérité** : **Low**
- **Emplacement** : `DESIGN.md.Components.ats-score-badge`
- **Problème** : Conforme au principe WCAG 1.4.1 (utilisation de la couleur) : le score est déjà accompagné d'un chiffre textuel (`86% MATCH`), ce qui évite la dépendance exclusive à la couleur pour les utilisateurs daltoniens. À pérenniser avec une icône explicite (crochet, attention, croix).
- **Fix recommandé** : Ajouter une icône distinctive à côté du pourcentage pour renforcer la lisibilité instantanée.
