# Review: UX Heuristics (Nielsen Norman 10) — ArcApply

**Cible** : `DESIGN.md` & `EXPERIENCE.md`
**Auditeur** : Principal UX Heuristic Evaluator
**Statut** : Terminé

---

## Synthèse globale

L'expérience globale est solide et très bien alignée avec la philosophie d'un cockpit développeur : la prévention des erreurs (Human-in-the-loop, anti-hallucination) et l'efficience d'usage (raccourcis clavier, validation 1-clic) sont remarquablement traitées. Des renforts sont nécessaires sur la visibilité du statut système (durées d'inférence LLM) et le contrôle utilisateur (annulation d'envoi / dé-publication).

---

## Findings par Heuristique

### 1. Visibilité du statut système (Heuristique 1)
- **Sévérité** : **Medium**
- **Emplacement** : `EXPERIENCE.md.State Patterns` (Génération / Adaptation LLM)
- **Constat** : La durée de génération d'une lettre et de réorganisation du CV est estimée à "~2s" avec un composant `Skeleton`. Si l'API LLM a de la latence (5-10s) ou subit un rate-limit, l'utilisateur risque de penser que l'interface a planté.
- **Fix recommandé** : Ajouter un stepper d'étapes sous forme de micro-messages séquentiels : *"1/3 Analyse sémantique de l'offre..."* $\rightarrow$ *"2/3 Alignement du Master Profile..."* $\rightarrow$ *"3/3 Synthèse de la lettre..."* avec timer d'abandon (timeout après 15s) et bouton "Réessayer".

### 2. Contrôle et liberté de l'utilisateur (Heuristique 3)
- **Sévérité** : **Medium**
- **Emplacement** : `EXPERIENCE.md.Key Flows` & `Interaction Primitives`
- **Constat** : Pas d'option explicite de rétractation ("Undo" ou "Annuler") juste après avoir cliqué sur "Valider et Soumettre". Même si une confirmation existe avant envoi, un filet de sécurité de 5 secondes ("Candidature en cours d'envoi... [Annuler]") apporte une grande sérénité cognitive.
- **Fix recommandé** : Intégrer un compte à rebours discret de 5 secondes (façon Gmail "Annuler l'envoi") avant le déclenchement irréversible du clic Easy Apply sur LinkedIn.

### 3. Prévention des erreurs (Heuristique 5)
- **Sévérité** : **Low (Point fort)**
- **Emplacement** : `EXPERIENCE.md.Anti-patterns & Garde-fous Spécifiques`
- **Constat** : L'interdiction absolue de soumission aveugle en lot (*Anti-Spam Guard*) et l'alerte sur les compétences non référencées dans le Master Profile constituent d'excellents garde-fous.
- **Recommandation** : Conserver rigoureusement ce pattern au niveau de l'architecture logicielle.

### 4. Reconnaissance plutôt que rappel (Heuristique 6)
- **Sévérité** : **Medium**
- **Emplacement** : `EXPERIENCE.md.Component Patterns.Human-in-the-Loop Validation Drawer`
- **Constat** : Dans le tiroir de validation, Louay voit la lettre générée et le CV adapté, mais il doit faire un effort de mémoire pour se souvenir des formulations exactes de la fiche de poste initiale.
- **Fix recommandé** : Prévoir une vue en miroir (split-view ou volet escamotable) affichant les exigences clés de l'offre en vis-à-vis des arguments mis en avant dans la lettre, avec mise en surbrillance correspondante.

### 5. Flexibilité et efficience d'utilisation (Heuristique 7)
- **Sévérité** : **Low (Point fort)**
- **Emplacement** : `EXPERIENCE.md.Interaction Primitives`
- **Constat** : Le mapping clavier complet (`j`/`k`, `Space`, `Cmd+Enter`, `e`, `x`) est idéal pour un élève-ingénieur recherchant une productivité maximale.
