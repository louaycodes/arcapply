# Review: Flow Coherence & Edge Cases — ArcApply

**Cible** : `EXPERIENCE.md`
**Auditeur** : Senior Product Interaction Architect
**Statut** : Terminé

---

## Synthèse globale

Les deux flux narratifs principaux (offre LinkedIn Easy Apply en 90 secondes et génération de package externe pour portail complexe) sont clairs, crédibles et ancrés dans les besoins réels du persona Louay. L'obligation du "Human-in-the-Loop" est bien matérialisée. Néanmoins, il existe des zones de flou sur le cycle de vie de la carte dans le Kanban en cas d'abandon de candidature, de rejet par l'ATS externe, ou d'échec de parsing.

---

## Findings

### 1. Cycle de vie Kanban lors de l'abandon en cours de revue
- **Sévérité** : **High**
- **Emplacement** : `EXPERIENCE.md.Information Architecture` & `Key Flows`
- **Problème** : Si Louay ouvre une offre, constate que le score ATS ou les prérequis ne lui conviennent pas, et décide de fermer le tiroir ou d'ignorer l'offre, la spécification ne précise pas si la carte reste dans le Radar, est marquée "Ignorée", ou revient à l'état initial. Il manque un statut d'archivage rapide / dépriorisation.
- **Fix recommandé** : Ajouter une action explicite `Passer / Ignorer l'offre` (`x` au clavier) qui déplace la carte dans un état archivé discret, évitant de polluer le radar de recherche avec des offres non pertinentes.

### 2. Gestion de l'échec de pré-remplissage ou blocage LinkedIn Easy Apply
- **Sévérité** : **High**
- **Emplacement** : `EXPERIENCE.md.Key Flows.Parcours 1` (Étape 5)
- **Problème** : Le flux idéal décrit un pré-remplissage réussi. Mais si LinkedIn affiche un CAPTCHA, des questions ouvertes imprévues (ex. prétentions salariales en stage, code postal) ou un blocage de session, comment l'interface réagit-elle ? Louay risque de se retrouver coincé sans fallback clair.
- **Fix recommandé** : Formaliser le mode de repli (*Fallback Path*) : si le script rencontre un champ inconnu ou un CAPTCHA, l'interface bascule immédiatement en mode "Contrôle manuel" : le navigateur reste ouvert au premier plan avec les champs non remplis surlignés, et un bouton "J'ai finalisé la soumission manuellement" permet d'enregistrer la candidature dans le Kanban.

### 3. Confirmation de candidature externe (Feedback Loop)
- **Sévérité** : **Medium**
- **Emplacement** : `EXPERIENCE.md.Key Flows.Parcours 2`
- **Problème** : Dans le flux externe, Louay est redirigé vers Taleo/Workday. ArcApply place la carte dans "En cours de soumission externe". Cependant, aucune fermeture de boucle n'est prévue si Louay ferme la fenêtre externe sans avoir postulé (ex. formulaire trop long ou abandon). La carte reste indéfiniment en statut flottant.
- **Fix recommandé** : Prévoir un dialogue de clôture ou un badge persistant dans le Kanban : "Candidature complétée sur le site externe ? [Oui, marquer 'Postulé'] [Non, annuler]".

### 4. Cohérence du drag-and-drop vs automatisation
- **Sévérité** : **Low**
- **Emplacement** : `EXPERIENCE.md.Interaction Primitives`
- **Problème** : Le déplacement manuel par drag-and-drop dans le Kanban peut entrer en conflit avec les statuts automatisés (ex. si Louay glisse une carte vers "Postulé" sans être passé par le tiroir de validation).
- **Fix recommandé** : Préciser que le déplacement manuel vers "Postulé" affiche un toast demandant si la candidature a été envoyée en dehors d'ArcApply (ex. par email direct), permettant de renseigner la date d'envoi.
