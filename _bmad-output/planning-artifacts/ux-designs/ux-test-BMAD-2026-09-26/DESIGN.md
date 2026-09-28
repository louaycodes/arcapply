---
name: ArcApply
description: Copilote intelligent et cockpit de candidature PFE pour étudiants ingénieurs. Direction artistique 'Atelier d'Ingénierie' — Thème clair, chaleureux (Beige lin & Orange terracotta), typographie éditoriale d'auteur et composants tactiles human-made.
status: final
updated: 2026-09-28
colors:
  background: '#FAF7F2' # Beige lin doux / Warm Sand
  foreground: '#1C1917' # Encre d'imprimerie chaude / Deep Warm Espresso
  muted: '#F3EDE4' # Lin brut feutré
  muted-foreground: '#78716C' # Pierre de taille (WCAG AAA > 7:1)
  border: '#E7DFD4' # Liseré lin artisanal
  input: '#FFFFFF' # Papier velin immaculé
  ring: '#EA580C' # Orange terracotta focus accessible
  card: '#FFFFFF' # Craie naturelle pressée
  card-foreground: '#1C1917'
  primary: '#EA580C' # Orange terracotta d'atelier
  primary-foreground: '#FFFFFF'
  primary-hover: '#C2410C' # Cuivre brûlé
  primary-light: '#FFF7ED' # Pêche très douce
  accent: '#D97706' # Ambre doré d'artisan
  accent-foreground: '#FFFFFF'
  match-high: '#16A34A' # Vert sauge / Feuillage frais
  match-medium: '#D97706' # Ocre ambré chaud
  match-low: '#DC2626' # Terracotta carmin
  ai-accent: '#C2410C' # Cuivre artisanal
  human-review: '#EA580C' # Orange signature d'atelier
  success: '#16A34A'
  destructive: '#DC2626'
typography:
  display:
    fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: '28px'
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: '-0.03em'
  heading:
    fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: '18px'
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: '-0.02em'
  body:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    fontSize: '14px'
    fontWeight: '450'
    lineHeight: '1.6'
    letterSpacing: '-0.01em'
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: '13px'
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: '6px'
  md: '10px'
  lg: '14px'
  xl: '20px'
  full: '9999px'
shadows:
  artisan: '0 1px 3px rgba(44, 28, 16, 0.04), 0 8px 24px -4px rgba(44, 28, 16, 0.06)'
  artisan-card: '0 2px 4px rgba(44, 28, 16, 0.03), 0 12px 32px -6px rgba(44, 28, 16, 0.07)'
  artisan-button: '0 2px 0 0 #9A3412, 0 4px 12px rgba(234, 88, 12, 0.22)'
  artisan-hover: '0 4px 16px -2px rgba(44, 28, 16, 0.08), 0 16px 36px -4px rgba(234, 88, 12, 0.12)'
spacing:
  cockpit-gap: '18px'
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
    shadow: '{shadows.artisan-button}'
  ai-generate-button:
    background: '{colors.primary-light}'
    foreground: '{colors.primary}'
    border: '1px solid #FDBA74'
    radius: '{rounded.md}'
  review-drawer:
    background: '{colors.card}'
    border-left: '1px solid {colors.border}'
    width: '{spacing.drawer-width}'
    shadow: '-8px 0 32px rgba(44, 28, 16, 0.08)'
  external-package-modal:
    background: '{colors.card}'
    border: '1px solid {colors.border}'
    radius: '{rounded.xl}'
    shadow: '{shadows.artisan-card}'
---

# ArcApply — Visual Identity Spine (DESIGN.md)

## Brand & Style : L'Atelier de Haute Précision (Human-Made & Crafted)

**ArcApply** rompt délibérément avec les interfaces d'intelligence artificielle stéréotypées (dark mode générique, dégradés violets criards et cartes froides sans âme). 

Le design system adopte l'esthétique d'un **Atelier d'ingénierie et d'architecture contemporain** :
- **Atmosphère claire et chaleureuse** : Un fond couleur beige lin chaud (`#FAF7F2`) qui repose le regard et évoque le papier millimétré de haute facture.
- **Palette signature Orange Terracotta & Ambre** (`#EA580C` & `#D97706`) : Évoque le cuivre, l'artisanat, la braise créative et l'énergie d'exécution, contrastant avec des encres d'imprimerie profondes (`#1C1917`).
- **Typographie éditoriale d'auteur** :
  - **Space Grotesk** pour les titres majeurs : caractère géométrique affirmé, angles singuliers, look humain et non générique.
  - **Plus Jakarta Sans** pour le texte courant : proportions humanistes généreuses, excellente lisibilité, nuances subtiles.
  - **JetBrains Mono** pour les scores ATS et les télémétries : la précision du poinçon d'artisan.
- **Composants physiques et tactiles** :
  - Boutons avec relief ressenti (biseau inférieur subtil, micro-déplacement au clic).
  - Cartes épaisses en craie naturelle avec doubles ombres diffuses chaudes (`shadow-artisan`).
  - Badges façon étiquettes cousues ou tampons d'atelier avec liserés organiques.

---

## Palette de Couleurs Fonctionnelles

| Token | Teinte / Hex | Usage fonctionnel | Ce qu'il NE doit PAS faire |
|---|---|---|---|
| `{colors.background}` | `#FAF7F2` (Beige Lin) | Toile de fond principale de l'application, douce et chaleureuse. | Ne pas remplacer par un blanc criard `#FFFFFF` ou du gris froid. |
| `{colors.card}` | `#FFFFFF` (Craie Pure) | Surfaces des cartes d'offres, colonnes Kanban et tiroirs. | Ne pas laisser flotter sans bordure lin subtile `{colors.border}`. |
| `{colors.muted}` | `#F3EDE4` (Lin Écru) | Arrière-plan des blocs techniques, badges neutres, barres d'outils. | Ne pas utiliser pour le texte principal. |
| `{colors.muted-foreground}` | `#78716C` (Pierre Chaude) | Métadonnées, labels secondaires, mentions de dates (contraste garanti $> 7:1$). | Ne pas utiliser de gris délavé illisible. |
| `{colors.border}` | `#E7DFD4` (Lin Ouvré) | Lignes de séparation fines et contours des cartes. | Ne pas utiliser de bordures noires dures. |
| `{colors.ring}` | `#EA580C` (Terracotta Focus) | Anneau de surbrillance du focus clavier accessible (`2px solid`). | Ne jamais masquer ou désactiver au clavier. |
| `{colors.primary}` | `#EA580C` (Orange Terracotta) | Actions majeures, boutons d'action d'atelier, sélection active. | Ne pas utiliser pour les alertes d'erreur. |
| `{colors.primary-hover}` | `#C2410C` (Cuivre Chaud) | État survolé des actions primaires. | Ne pas saturer excessivement. |
| `{colors.match-high}` | `#16A34A` (Vert Feuillage) | Score ATS optimal ($\ge 75\%$), compétences vérifiées, candidatures acceptées. | Ne pas utiliser pour des actions destructives. |
| `{colors.match-medium}`| `#D97706` (Ocre Ambré) | Score ATS moyen ($60-74\%$), compétences à valoriser ou adapter. | Ne pas confondre avec le bouton d'action primaire. |
| `{colors.match-low}` | `#DC2626` (Terracotta Carmin) | Score ATS insuffisant ($<60\%$), lacunes majeures identifiées. | Ne pas utiliser comme couleur décorative. |
| `{colors.human-review}`| `#EA580C` (Orange Signature) | Écran d'attente de validation humaine obligatoire (*Human-in-the-loop*). | Ne pas dissimuler ou atténuer dans l'interface. |

---

## Typographie "Human-Made"

1. **`{typography.display}`** (`Space Grotesk 28px / 700 / -0.03em`) : Titres de tableaux de bord, en-têtes d'atelier, branding majeur.
2. **`{typography.heading}`** (`Space Grotesk 18px / 600 / -0.02em`) : Intitulés d'offres, en-têtes de colonnes Kanban, noms d'entreprises.
3. **`{typography.body}`** (`Plus Jakarta Sans 14px / 450 / 1.6`) : Descriptions, corps des lettres de motivation, synthèses de profil.
4. **`{typography.mono}`** (`JetBrains Mono 13px / 500 / 1.4`) : Scores ATS (ex. `✓ 88% MATCH`), compétences techniques (`Python`, `FastAPI`), métadonnées de dates.

---

## Composants & Signature Visuelle

### 1. ATS Score Badge (`ats-score-badge`)
- **Composition** : Double encodage accessible : icône distinctive vectorielle (`✓`, `⚠`, `✕`) + pourcentage en monospace d'ingénieur.
- **Styling** : Aspect tampon d'artisan / cartouche technique, fond pastel chaud et texte foncé contrasté :
  - Score $\ge 75\%$ : Fond vert sauge clair (`#F0FDF4`), texte émeraude forêt (`#15803D`), bordure (`#BBF7D0`).
  - Score $60-74\%$ : Fond ambre clair (`#FEF3C7`), texte ambre profond (`#B45309`), bordure (`#FDE68A`).
  - Score $< 60\%$ : Fond pêche claire (`#FEF2F2`), texte carmin (`#B91C1C`), bordure (`#FECACA`).

### 2. Boutons d'Action Tactiles (`tactile-button`)
- **Physique** : Ombre portée inférieure pressée (`shadow-artisan-button`), bordure supérieure imperceptible, micro-déplacement vertical au clic (`active:translate-y-[1px]`).
- Donne l'impression physique de manipuler un bel objet d'atelier plutôt qu'un rectangle plat généré par IA.

### 3. Cartes d'Atelier (`artisan-card`)
- Surface blanc pur immaculé (`#FFFFFF`), reposant sur le beige lin (`#FAF7F2`).
- Bordure artisanale douce (`#E7DFD4`), double ombre diffuse (`shadow-artisan-card`).
- Coins doucement arrondis (`14px` / `rounded-lg`).

---

## Règles d'Implémentation & Invariants

- **Zéro-Hallucination & Human-in-the-Loop** : L'esthétique chaleureuse et humaine renforce le pacte de confiance : chaque action d'envoi exige la main de l'utilisateur.
- **Accessibilité Contrastée (WCAG AA/AAA)** : Tous les textes et badges respectent scrupuleusement les ratios de contraste sur fond beige ou blanc.
- **Cohérence Globale** : Navigation latérale, Cockpit, Radar d'Offres, Studio CV, Kanban et Paramètres partagent la même atmosphère harmonieuse.
