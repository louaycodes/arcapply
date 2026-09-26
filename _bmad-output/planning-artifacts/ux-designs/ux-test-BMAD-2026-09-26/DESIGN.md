---
name: ArcApply
description: Copilote intelligent et cockpit de candidature PFE pour étudiants ingénieurs. Style haute précision, ingénierie soignée, basé sur les primitives shadcn/ui + Tailwind CSS.
status: final
updated: 2026-09-26
colors:
  background: '#0B0F19'
  foreground: '#F8FAFC'
  muted: '#1E293B'
  muted-foreground: '#A1B0CB' # Rehaussé pour contraste WCAG AA > 5:1
  border: '#334155'
  input: '#1E293B'
  ring: '#3B82F6' # Anneau de focus clavier accessible
  card: '#0F172A'
  card-foreground: '#F8FAFC'
  primary: '#3B82F6'
  primary-foreground: '#FFFFFF'
  primary-hover: '#2563EB'
  match-high: '#10B981'
  match-medium: '#F59E0B'
  match-low: '#EF4444'
  ai-accent: '#8B5CF6'
  human-review: '#F97316'
  success: '#10B981'
  destructive: '#EF4444'
typography:
  display:
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    fontSize: '28px'
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: '-0.02em'
  heading:
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    fontSize: '18px'
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: '-0.01em'
  body:
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    fontSize: '14px'
    fontWeight: '400'
    lineHeight: '1.5'
  mono:
    fontFamily: 'JetBrains Mono, ui-monospace, monospace'
    fontSize: '13px'
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: '4px'
  md: '8px'
  lg: '12px'
  xl: '16px'
  full: '9999px'
spacing:
  cockpit-gap: '16px'
  drawer-width: '560px'
  kanban-col: '320px'
components:
  ats-score-badge:
    background: '{colors.muted}'
    border: '1px solid {colors.border}'
    radius: '{rounded.full}'
  action-button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  ai-generate-button:
    background: '{colors.ai-accent}'
    foreground: '#FFFFFF'
    radius: '{rounded.md}'
  review-drawer:
    background: '{colors.card}'
    border-left: '1px solid {colors.border}'
    width: '{spacing.drawer-width}'
  external-package-modal:
    background: '{colors.card}'
    border: '1px solid {colors.border}'
    radius: '{rounded.lg}'
---

# ArcApply — Visual Identity Spine (DESIGN.md)

## Brand & Style

**ArcApply** est un outil de productivité haute précision destiné aux élèves-ingénieurs recherchant un stage de fin d'études (PFE) d'élite. Ce n'est ni un portail RH aseptisé, ni un bot agressif d'automatisation opaque. C'est un **cockpit de pilotage stratégique**, un instrument d'ingénieur qui allie rigueur analytique, transparence algorithmique totale et efficacité d'exécution.

L'esthétique visuelle s'inspire des meilleurs outils pour développeurs (Linear, Raycast, Vercel Dashboard) :
- **Dark mode immersif par défaut** (`{colors.background}`) avec contraste maîtrisé, évitant la fatigue oculaire lors des sessions intensives de recherche de stage.
- **Densité d'information calibrée** : présentation compacte et sans fioritures superflues, permettant d'évaluer une offre en un coup d'œil.
- **Transparence visuelle des données d'analyse** : le score ATS et les correspondances de compétences sont mis en scène avec une précision télémétrique (badges monospace, jauges de précision).
- **Sobriété et autorité technique** : les micro-animations sont fonctionnelles (transition de statut, validation en un clic, ouverture latérale du tiroir de révision), renforçant le sentiment de contrôle absolu.

ArcApply hérite des fondations de **shadcn/ui** combinées à **Tailwind CSS**. Le présent document définit la couche spécifique d'identité de marque (Brand Layer), les composants spécialisés (tiroir de validation humaine, jauges ATS, badge de provenance) et les règles d'agencement du cockpit.

---

## Colors

La palette repose sur un fond sombre structuré, ponctué d'accents fonctionnels rigoureusement attribués à des rôles sémantiques stricts avec un ratio de contraste WCAG AA $> 5:1$ garanti :

| Token | Teinte / Hex | Usage fonctionnel | Ce qu'il NE doit PAS faire |
|---|---|---|---|
| `{colors.background}` | `#0B0F19` (Obsidian Blue) | Toile de fond principale de l'application. | Ne pas utiliser pour les cartes ou conteneurs flottants. |
| `{colors.card}` | `#0F172A` (Slate Dark) | Surfaces des cartes d'offres, colonnes Kanban et tiroirs. | Ne pas confondre avec le fond global. |
| `{colors.muted}` | `#1E293B` (Slate Subtile) | Arrière-plan des blocs de code, badges neutres, séparateurs. | Ne pas utiliser pour le texte principal. |
| `{colors.muted-foreground}` | `#A1B0CB` (Cool Muted) | Métadonnées, labels secondaires, mentions de dates (contraste garanti $> 5:1$). | Ne pas utiliser sur fond blanc. |
| `{colors.border}` | `#334155` | Lignes de séparation, contours de cartes et de tiroirs. | Ne pas surcharger avec des bordures trop épaisses. |
| `{colors.ring}` | `#3B82F6` (Electric Focus) | Anneau de surbrillance du focus clavier accessible (`2px solid`). | Ne jamais masquer ou désactiver au clavier. |
| `{colors.primary}` | `#3B82F6` (Electric Blue) | Actions principales de navigation, boutons de confirmation neutres. | Ne pas utiliser pour les alertes ou le scoring. |
| `{colors.match-high}` | `#10B981` (Emerald) | Score ATS optimal ($\ge 75\%$), compétences vérifiées dans le profil, succès d'envoi. | Ne pas utiliser pour des actions destructives. |
| `{colors.match-medium}`| `#F59E0B` (Amber) | Score ATS moyen ($60-74\%$), compétences à valoriser ou adapter. | Ne pas utiliser pour des erreurs bloquantes. |
| `{colors.match-low}` | `#EF4444` (Ruby) | Score ATS insuffisant ($<60\%$), lacunes majeures identifiées. | Ne pas utiliser comme couleur décorative. |
| `{colors.ai-accent}` | `#8B5CF6` (Violet AI) | Déclenchement de génération de lettre, reformulation contextuelle de CV. | Ne pas utiliser pour la validation finale d'envoi. |
| `{colors.human-review}`| `#F97316` (Warm Orange) | Écran d'attente de validation humaine obligatoire (*Human-in-the-loop*). | Ne pas dissimuler ou atténuer dans l'interface. |

---

## Typography

Le système typographique associe une police sans-serif géométrique d'ingénierie (**Inter**) à une police à chasse fixe de haute lisibilité (**JetBrains Mono**) pour toutes les métriques de scoring et données techniques.

- **`{typography.display}`** (`Inter 28px / 700 / -0.02em`) : Titres de sections majeures (ex. *Tableau de bord de campagne*, *Master Profile*).
- **`{typography.heading}`** (`Inter 18px / 600 / -0.01em`) : Titres d'offres d'emploi, en-têtes de colonnes Kanban, noms d'entreprises.
- **`{typography.body}`** (`Inter 14px / 400 / 1.5`) : Descriptions d'offres, corps des lettres de motivation, notes de synthèse.
- **`{typography.mono}`** (`JetBrains Mono 13px / 500 / 1.4`) : Scores ATS (ex. `✓ 88% MATCH`), tags de compétences techniques (`Python`, `FastAPI`, `Docker`), balises de statut et métadonnées de dates.

---

## Layout & Spacing

Le cockpit ArcApply est conçu pour des écrans desktop (résolution cible minimale : 1280×800) avec une mise en page à haute efficacité spatiale :

1. **Navigation latérale rétractable (64px replié / 240px déployé)** : Accès rapide aux 4 vues maîtresses (Dashboard, Radar Offres, Kanban Candidatures, Master Profile).
2. **Zone de travail principale fluide** : Grille modulaire avec espacement standardisé (`{spacing.cockpit-gap}` = `16px`).
3. **Tiroir d'action contextuel (Review Drawer)** : Largeur fixe de `{spacing.drawer-width}` (`560px`), s'ouvrant depuis le bord droit avec confinement de focus modal accessible.
4. **Colonnes Kanban** : Largeur fixe `{spacing.kanban-col}` (`320px`), avec défilement horizontal fluide et barres de progression discrètes.

---

## Elevation & Depth

Le cockpit privilégie une profondeur par étagement de tons plutôt que par des ombres portées lourdes :

- **Niveau 0 (Toile de fond)** : `{colors.background}` (`#0B0F19`).
- **Niveau 1 (Conteneurs et colonnes)** : `{colors.card}` (`#0F172A`) avec bordure subtile `{colors.border}` (`1px solid #334155`).
- **Niveau 2 (Cartes interactives survolées / actives)** : Teinte légèrement rehaussée (`#1E293B`), contour d'accès clavier `{colors.ring}`, ombre portée diffuse : `0 4px 20px -2px rgba(0, 0, 0, 0.5)`.
- **Niveau 3 (Tiroir de révision et Modales)** : Fond `{colors.card}`, bordure gauche `{colors.border}`, ombre latérale profonde `box-shadow: -8px 0 32px rgba(0, 0, 0, 0.6)`.

---

## Shapes

- **Cartes et panneaux** : Rayon modéré `{rounded.md}` (`8px`), conférant un aspect net et structuré.
- **Boutons et champs de saisie** : Rayon `{rounded.md}` (`8px`) pour une prise en main tactile et visuelle équilibrée.
- **Badges de statut, scores ATS et tags de stack** : Rayon complet `{rounded.full}` (`9999px`) pour un contraste morphologique immédiat avec les cartes rectangulaires.
- **Modales et tiroirs** : Rayon `{rounded.lg}` (`12px`) sur les coins intérieurs ou flottants.

---

## Components

### 1. ATS Score Badge (`ats-score-badge`)
- **Composition** : Double encodage accessible : icône distinctive vectorielle (`✓` succès, `⚠` alerte, `✕` lacune) + pourcentage en `{typography.mono}`.
- **Règles d'état** :
  - Score $\ge 75\%$ : Texte `{colors.match-high}`, icône `✓`, bordure vert émeraude subtile (`rgba(16, 185, 129, 0.2)`).
  - Score $60-74\%$ : Texte `{colors.match-medium}`, icône `⚠`, bordure ambre.
  - Score $< 60\%$ : Texte `{colors.match-low}`, icône `✕`, bordure rouge.

### 2. Validation Drawer — Human-in-the-Loop (`review-drawer`)
- **Anatomie** :
  - En-tête fixe avec intitulé de poste, entreprise, statut de plateforme (LinkedIn Easy Apply / Jobteaser / Externe), bouton de fermeture accessible (`Esc`) et score ATS global.
  - **Vue miroir / Split-view synchrone** : volet gauche escamotable affichant les exigences de l'offre surlignées, volet droit présentant le CV adapté et la lettre générée avec correspondance visuelle directe.
  - Barre d'action inférieure sticky : bouton d'ajustement IA (`{colors.ai-accent}`), bouton d'édition manuelle directe, bouton d'archivage (`x`), et bouton de validation finale (`{colors.action-button-primary}`).

### 3. External Package Modal (`external-package-modal`)
- Surface modale `{colors.card}` avec bordure `{colors.border}` et rayon `{rounded.lg}`.
- Propose en 1 clic :
  - `[1] Télécharger le PDF adapté (Optimisé ATS)`
  - `[2] Copier la lettre de motivation dans le presse-papier` (toast de confirmation)
  - `[3] Ouvrir le portail externe`
  - Prompt d'acquittement au retour : *"Candidature finalisée sur le site externe ? [Oui, marquer Postulé] [Non, annuler]"*.

---

## Do's and Don'ts

### Do
- **Garantir un contraste supérieur à 5:1** sur tous les libellés secondaires via `{colors.muted-foreground}` (`#A1B0CB`).
- **Afficher un double encodage (icône + texte)** pour ne jamais faire reposer l'interprétation du score ATS sur la couleur seule.
- **Assurer un cycle de focus strict (`aria-modal="true"`)** à l'ouverture du tiroir de révision avec retour du focus sur l'élément déclencheur à la fermeture via `Escape`.
- **Offrir un délai de grâce de 5 secondes** après soumission directe avec option d'annulation immédiate.

### Don't
- **Ne jamais supprimer le focus ring au clavier** (`outline: none` interdit sans remplacement par `{colors.ring}`).
- **Ne jamais soumettre silencieusement une candidature en arrière-plan** sans confirmation explicite de l'utilisateur.
- **Ne jamais masquer les lacunes de compétences** : si une offre requiert une technologie absente du Master Profile, l'afficher en rouge avec la mention "Non couvert dans votre profil".
