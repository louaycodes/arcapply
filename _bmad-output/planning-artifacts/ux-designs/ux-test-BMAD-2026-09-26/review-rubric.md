# Spine Pair Review — ArcApply

## Overall verdict
Le tandem DESIGN.md et EXPERIENCE.md constitue une fondation claire, rigoureuse et immédiatement exploitable par un architecte logiciel ou un développeur frontend. Les règles métier clés (Human-in-the-Loop, anti-hallucination, score ATS) sont matérialisées dans des patrons d'interaction précis. Quelques ajustements mécaniques sont nécessaires sur la couverture d'états d'erreur et la résolution de tokens de contraste.

## 1. Flow coverage — adequate
Deux flux d'utilisation complets sont narrés avec le protagoniste Louay (candidature directe LinkedIn Easy Apply et redirection externe avec génération de package).
### Findings
- **medium** Absence de chemin de défaillance explicite dans le Flow 1 en cas de blocage d'authentification ou de CAPTCHA LinkedIn (`EXPERIENCE.md.Key Flows.Parcours 1`). *Fix:* Ajouter une étape 5.b décrivant le passage en contrôle manuel assisté.
- **low** Flow de mise à jour du Master Profile non découpé pas à pas (`EXPERIENCE.md.Key Flows`). *Fix:* Ajouter un troisième parcours court montrant l'ajout d'une nouvelle compétence et son impact temps réel sur les scores du radar.

## 2. Token completeness — adequate
Frontmatter YAML complet avec déclaration des couleurs, typographies, arrondis, espacements et tokens de composants.
### Findings
- **high** Le token `{colors.muted-foreground}` (`#94A3B8`) sur fond `{colors.muted}` (`#1E293B`) est à la limite du ratio WCAG AA sur les textes de petite taille (`DESIGN.md.Colors`). *Fix:* Éclaircir légèrement le token à `#A1B0CB`.
- **low** Manque de spécification du token de focus ring dans le frontmatter (`DESIGN.md.frontmatter.colors`). *Fix:* Déclarer explicitement `ring: '#3B82F6'` dans les tokens de couleurs.

## 3. Component coverage — strong
Chaque composant clé nommé (`ats-score-badge`, `review-drawer`, `action-button-primary`, `ai-generate-button`, `external-package-modal`) possède ses spécifications visuelles dans `DESIGN.md` et ses règles comportementales dans `EXPERIENCE.md`.
### Findings
- **low** Le composant `external-package-modal` est décrit dans le corps de `DESIGN.md` mais absent de la section `components` du frontmatter YAML (`DESIGN.md.frontmatter.components`). *Fix:* L'ajouter au YAML frontmatter pour assurer une parité stricte.

## 4. State coverage — adequate
Les états principaux (collecte active, génération LLM, profil incomplet, attente de validation, session expirée) sont documentés.
### Findings
- **medium** État vide initial ("Cold Start" sans aucune offre ni filtre paramétré) non explicité (`EXPERIENCE.md.State Patterns`). *Fix:* Ajouter une ligne décrivant l'écran d'accueil lors de la toute première ouverture (incitation à compléter le Master Profile et lancer la première recherche).

## 5. Visual reference coverage — adequate
En mode Fast path, les maquettes graphiques lourdes ont été différées à la demande de l'utilisateur, les deux spines faisant autorité textuelle contractuelle.
### Findings
- **low** Mention de fichiers mockups non encore générés (`EXPERIENCE.md.Information Architecture`). *Fix:* Harmoniser avec le mode Fast Path en précisant que les spécifications des tableaux prévalent sur toute maquette future.

## 6. Bloat & overspecification — strong
Aucun bavardage superflu. Pas de duplication des personas du brief ; focalisation stricte sur l'ergonomie, les flux et l'esthétique du cockpit.

## 7. Inheritance discipline — strong
Les références de sources résolvent vers `brief.md` et `addendum.md`. Le système hérite proprement des conventions shadcn/ui et Tailwind CSS en précisant uniquement la surcouche de marque.

## 8. Shape fit — strong
Structure canonique de `DESIGN.md` strictement respectée (Brand & Style $\rightarrow$ Colors $\rightarrow$ Typography $\rightarrow$ Layout & Spacing $\rightarrow$ Elevation & Depth $\rightarrow$ Shapes $\rightarrow$ Components $\rightarrow$ Do's and Don'ts). Sections requises d'`EXPERIENCE.md` toutes présentes.

## Mechanical notes
- Frontmatter YAML valide dans les deux fichiers.
- Nomenclature des composants et des statuts cohérente entre les deux documents.
