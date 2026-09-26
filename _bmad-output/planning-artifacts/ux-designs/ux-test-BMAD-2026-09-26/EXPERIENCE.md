---
name: ArcApply
status: final
sources:
  - {planning_artifacts}/briefs/brief-test-BMAD-2026-09-26/brief.md
  - {planning_artifacts}/briefs/brief-test-BMAD-2026-09-26/addendum.md
updated: 2026-09-26
---

# ArcApply — Experience Spine (EXPERIENCE.md)

## Foundation

Application web mono-page responsive avec priorité ergonomique **Desktop-first** (cockpit de productivité pour grands écrans 1280px+). 
- **Système d'UI sous-jacent** : Composants inspirés de `shadcn/ui` sur socle Tailwind CSS et Next.js.
- **Rôle du document** : Ce document régit le comportement dynamique, l'architecture de l'information, la gestion des états, les flux de candidatures et l'interaction homme-machine (*Human-in-the-Loop*). L'identité visuelle et les tokens de style sont définis de manière souveraine dans [DESIGN.md](file:///Users/louayzorai/Desktop/bmad-test/_bmad-output/planning-artifacts/ux-designs/ux-test-BMAD-2026-09-26/DESIGN.md).
- **Modèle d'exécution** : Local-first / monocompte pour le MVP, axé sur la rapidité d'exécution sans latence de navigation.

---

## Information Architecture

L'application est structurée en 4 surfaces fonctionnelles interconnectées, accessibles via une barre de navigation latérale persistante :

| Surface | Déclencheur / Raccourci | Rôle fonctionnel | Composants clés |
|---|---|---|---|
| **Cockpit / Dashboard** | Navigation principale / `g d` | Vue d'ensemble stratégique de la campagne de stage : métriques de conversion, offres urgentes, alertes de relance. | Widgets télémétriques, taux de conversion en entretien, alertes de candidatures en attente. |
| **Radar d'Offres (Live Feed)** | Barre latérale / `g r` | Flux temps réel des offres collectées (LinkedIn & Jobteaser) filtrées selon les critères de l'étudiant. | Tableau d'offres compact, filtre par stack/ville, badge de score ATS `{components.ats-score-badge}`, action d'archivage rapide (`x`). |
| **Master Profile (Socle de Vérité)** | Barre latérale / `g p` | Référentiel immuable et exhaustif de l'étudiant : formations, projets techniques, stages passés, compétences. | Formulaire modulaire par sections, import/export JSON, validateurs d'exhaustivité. |
| **Tableau Kanban (Suivi)** | Barre latérale / `g k` | Suivi du pipeline de candidatures étape par étape, de la découverte jusqu'à l'offre finale de stage. | 5 colonnes d'états, cartes déplaçables (drag & drop), archivage et tri rapide. |
| **Review Drawer (Tiroir de Validation)** | Clic sur une offre / `Space` | Panneau latéral coulissant (`{components.review-drawer}`) avec confinement modal de focus permettant d'examiner et valider la candidature. | Vue miroir split-view offre/lettre, aperçu CV adapté, éditeur de lettre naturelle, bouton de soumission assistée. |

---

## Voice and Tone

Micro-copie de l'interface. La voix de marque est sobre, directe et orientée ingénieur.

| Contexte | Ce que l'interface dit (Do) | Ce qu'elle ne dit JAMAIS (Don't) | Règle sous-jacente |
|---|---|---|---|
| **Validation finale** | « Prêt pour envoi sur LinkedIn. Vérifiez les 3 champs pré-remplis. » | « L'IA a tout fait pour vous ! Cliquez pour envoyer 🚀 » | L'étudiant reste le décideur responsable. |
| **Score ATS élevé** | « Alignement ATS : 84%. 5 compétences clés validées depuis votre Master Profile. » | « Match parfait ! Vous allez forcément décrocher un entretien ! » | Rester factuel, télémétrique et sans promesse abusive. |
| **Compétence manquante** | « Kubernetes n'est pas répertorié dans votre profil maître. Non inclus dans le CV. » | « Compétence extrapolée à partir de vos projets Docker. » | Règle absolue d'anti-hallucination : ne jamais inventer. |
| **Succès de soumission** | « Candidature transmise à 14:32. Annulable pendant 5s. Carte déplacée dans 'Postulé'. » | « Youpi ! Bravo champion ! » | Ton professionnel, calme et sécurisant. |

---

## Component Patterns

### 1. ATS Radar Pill & Match Drawer
- **Comportement** : Au survol ou au clic sur le badge de score ATS `{components.ats-score-badge}`, une infobulle enrichie détaille la concordance avec double encodage visuel (icônes + pourcentages) :
  - `✓` Vert : Mots-clés exacts détectés et présents dans le Master Profile.
  - `⚠` Ambre : Compétences proches ou transférables (ex. : `React` requis, `Next.js` présent).
  - `✕` Rouge : Technologies absentes du profil maître, clairement isolées pour éviter toute surprise en entretien.

### 2. Human-in-the-Loop Validation Drawer
- **Comportement & Accessibilité Clavier** :
  - **Confinement modal (`focus trap` & `aria-modal="true"`)** : Dès l'ouverture via `Space`, le focus clavier est capturé dans le tiroir. La touche `Tab` boucle strictement à l'intérieur. La touche `Escape` referme immédiatement le tiroir et restitue le focus à la carte d'offre active dans le flux.
  - **Vue miroir synchrone (Split-view)** : Volet escamotable gauche affichant la fiche de poste avec surbrillance des critères clés, en regard du volet droit montrant les paragraphes correspondants dans la lettre et le CV adapté.
  - L'action primaire reste bloquée tant que l'utilisateur n'a pas fait défiler le document ou cliqué sur "Relu & Validé".
  - Possibilité de retoucher manuellement chaque paragraphe en un clic.

### 3. External Package Downloader (Modal Redirection)
- Pour les offres nécessitant une redirection externe (sites carrières entreprises, Workday, ATS propriétaires) :
  - Une modale claire apparaît avec 3 actions séquencées :
    1. `[1] Télécharger le PDF optimisé` (compile et télécharge le CV ciblé standard ATS).
    2. `[2] Copier la lettre de motivation` (copie dans le presse-papier avec confirmation toast).
    3. `[3] Ouvrir l'offre externe` (ouvre le lien dans un nouvel onglet et passe le statut en "En cours de soumission externe").
  - **Boucle d'acquittement au retour** : Lorsque l'étudiant réactive l'onglet d'ArcApply, un prompt contextuel non bloquant demande : *"Avez-vous complété la candidature externe ? [Oui, marquer Postulé] [Non, laisser en cours] [Abandonner]"*.

---

## State Patterns

| État | Surface impactée | Comportement UX & Visuel |
|---|---|---|
| **Cold Start (Première ouverture)** | Radar & Dashboard | Écran d'accueil guidé : « Bienvenue sur ArcApply. Complétez votre Master Profile et saisissez vos critères de recherche (France / Tunisie, PFE 2027) pour activer la veille automatique. » |
| **Collecte active des offres (Scraping en tâche de fond)** | Radar d'Offres | Impulsion lumineuse discrète `{colors.primary}` en en-tête. Notification accessible bornée via `aria-live="polite"` sur un badge synthétique (« 3 nouvelles offres détectées ») évitant de saturer la lecture vocale. |
| **Génération / Adaptation LLM en cours** | Review Drawer | Micro-stepper textuel séquentiel indiquant la progression : *« 1/3 Analyse sémantique de l'offre... »* $\rightarrow$ *« 2/3 Alignement du Master Profile... »* $\rightarrow$ *« 3/3 Synthèse de la lettre au ton naturel... »*. Timeout automatique à 15s avec bouton de réessai. |
| **Profil incomplet** | Master Profile / Radar | Bannière persistante non bloquante : « Renseignez au moins 2 projets techniques pour activer le calcul de score ATS optimal. » |
| **Attente de validation humaine** | Carte Kanban & Drawer | Bordure lumineuse `{colors.human-review}` invitant l'utilisateur à vérifier les informations avant soumission. |
| **Session plateforme expirée** | Radar / Modal | Alerte claire : « Session LinkedIn expirée. Veuillez vous reconnecter pour relancer la détection assistée. » |

---

## Interaction Primitives

1. **Raccourcis clavier globaux (Power-User Mode)** :
   - `j` / `k` : Navigation vers le bas / haut dans la liste des offres.
   - `Space` : Ouvrir le tiroir de révision de l'offre sélectionnée avec confinement du focus.
   - `Escape` : Fermer le tiroir de révision et restituer le focus à la liste.
   - `Cmd+Enter` ou `Ctrl+Enter` : Valider la révision et déclencher la soumission assistée.
   - `x` : Ignorer ou archiver instantanément l'offre sélectionnée du radar actif.
   - `e` : Marquer comme "Package externe prêt" et copier les éléments.
2. **Filet de sécurité "Annuler l'envoi" (Délai de grâce de 5 secondes)** :
   - Après le clic de validation Easy Apply, un compte à rebours de 5 secondes s'affiche dans une notification flottante : *« Envoi de la candidature sur LinkedIn dans 5s... [Annuler immédiatement] »*.
3. **Drag and Drop fluide sur le Kanban & Saisie manuelle** :
   - Déplacement instinctif des cartes entre colonnes. Si une carte est glissée manuellement vers "Postulé", un modal rapide s'affiche : *"Candidature envoyée en dehors d'ArcApply ? [Confirmer avec la date d'aujourd'hui]"*.
4. **Mise en cache instantanée** :
   - Toutes les modifications de lettres dans le tiroir sont persistées localement en temps réel (zéro perte de saisie).

---

## Accessibility Floor

- **Navigation clavier intégrale** : Chaque carte d'offre, bouton d'action et champ de formulaire possède un anneau de focus net (`{colors.ring}` `2px solid #3B82F6`).
- **Confinement modal accessible** : Tiroirs et modales dotés de `role="dialog"`, `aria-modal="true"`, avec piège au clavier (Tab) et échappement universel (`Escape`).
- **Support des lecteurs d'écran** : Balises sémantiques strictes (`<main>`, `<nav>`, `<aside>`, `<article>`), notifications toast annoncées via `aria-live="polite"` sur badge restreint.
- **Rapports de contraste garantis** : Tous les textes et labels secondaires (`{colors.muted-foreground}` `#A1B0CB`) respectent un ratio $> 5:1$ sur fond sombre `{colors.background}`.

---

## Key Flows (Parcours Narrés)

### Parcours 1 : Louay valide une offre LinkedIn "Easy Apply" en 90 secondes avec gestion de repli

> **Protagoniste** : Louay, étudiant en 5ème année d'ingénierie ArcTIC, rentre de cours à 19h00. Il a 30 minutes devant lui pour faire avancer sa recherche de stage PFE en France.

1. **Découverte** : Louay ouvre ArcApply sur son ordinateur. Sur le radar d'offres, une nouvelle offre publiée il y a 2 heures apparaît en tête : *"Stage PFE Ingénieur Full-Stack Cloud & IA - Paris"*. Le badge affiche : `✓ 86% MATCH`.
2. **Examen instantané** : Louay tape sur la touche `Space`. Le tiroir de validation `{components.review-drawer}` glisse sur la droite et capture le focus clavier.
3. **Analyse de la personnalisation (Vue miroir)** : Il active la vue miroir : les prérequis de l'offre s'affichent en regard de ses projets d'école en micro-services et son stage de 4ème année. Aucune compétence fantaisiste n'est injectée.
4. **Revue de la lettre** : Louay lit la lettre de motivation générée. Le ton est fluide et technique. Il ajuste juste une phrase pour ajouter son lien de démo GitHub.
5. **Climax & Soumission assistée** : Louay clique sur `Valider et Soumettre (Easy Apply)`.
   - *Cas nominal* : Le délai de grâce de 5 secondes s'écoule. Le navigateur pré-remplit les questions LinkedIn et s'arrête sur le récapitulatif avec cadre orange `{colors.human-review}`. Louay vérifie son téléphone et valide l'envoi.
   - *Cas de repli (Fallback Path)* : Si LinkedIn présente un CAPTCHA ou une question fermée imprévue, ArcApply émet un son doux et bascule en mode "Contrôle manuel assisté" : la fenêtre reste active au premier plan avec les champs non remplis surlignés. Louay répond en 10 secondes et clique sur le bouton ArcApply *"J'ai validé manuellement"*.
6. **Résolution** : ArcApply détecte l'envoi, émet un toast de succès et déplace automatiquement la carte dans la colonne *Postulé* du Kanban avec horodatage exact.

---

### Parcours 2 : Candidature externe sur un site carrière complexe

1. **Détection** : Une offre chez un grand groupe bancaire à Paris est repérée sur Jobteaser avec redirection Taleo/Workday.
2. **Préparation du package** : Louay clique sur `Générer le package de candidature`.
3. **Package prêt en 1 clic** :
   - Le CV PDF sur-mesure (optimisé ATS) est compilé et téléchargé directement.
   - La lettre personnalisée est copiée dans le presse-papier.
   - Le lien de redirection s'ouvre dans un nouvel onglet.
4. **Boucle de confirmation** : Louay colle la lettre et dépose le PDF sur le portail externe en 45 secondes. De retour sur ArcApply, le prompt contextuel apparaît : *"Avez-vous complété la candidature externe ?"*. Louay clique sur `Oui, marquer Postulé`. La carte est archivée dans le suivi.

---

### Parcours 3 : Louay enrichit son Master Profile et recalcule le radar

1. **Contexte** : Louay vient de finaliser un projet open-source d'orchestration Kubernetes et l'ajoute dans son **Master Profile**.
2. **Impact immédiat** : Dès la sauvegarde, un toast indique : *« Profil maître mis à jour. Recalcul des scores ATS sur les offres en cours... »*.
3. **Résultat** : Sur le radar d'offres, deux offres DevOps dont le score plafonnait à 62% passent instantanément à 84% (`✓ MATCH`) avec la mise en valeur automatique du nouveau projet dans les suggestions de CV.

---

## Anti-patterns & Garde-fous Spécifiques

- **Pas d'envoi en masse aveugle (*Anti-Spam Guard*)** : Le système empêche techniquement le "batch submit" sans passage par l'écran de revue. Chaque offre doit avoir été ouverte et acquittée par l'étudiant.
- **Vérification de provenance du Master Profile** : Si l'utilisateur tente d'insérer un mot-clé dans la lettre qui n'existe nulle part dans son Master Profile, un avertissement ambre signale : *"Attention : compétence non trouvée dans votre profil maître. Êtes-vous certain de pouvoir la défendre en entretien ?"*.
- **Gestion des offres non retenues** : La touche `x` permet d'archiver immédiatement une offre jugée hors cible, évitant toute pollution visuelle du tableau de bord.
