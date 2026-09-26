---
title: "Product Brief: ArcApply"
status: complete
created: 2026-09-26
updated: 2026-09-26
---

# Product Brief : ArcApply

## Résumé Exécutif

**ArcApply** est une application web personnelle conçue comme un copilote intelligent pour automatiser la recherche et l'envoi de candidatures de stage de fin d'études (PFE), ciblant en priorité la France et la Tunisie. 

Plutôt que d'agir comme un robot de spam massif et aveugle, ArcApply agit comme un démultiplicateur d'efficacité pour l'étudiant ingénieur : l'application centralise la détection des offres (LinkedIn, Jobteaser), adapte dynamiquement le CV à partir d'un profil maître exhaustif sans jamais halluciner, évalue la conformité ATS avant envoi, et rédige des lettres de motivation percutantes au ton authentiquement humain. Chaque candidature fait l'objet d'une validation humaine finale en un clic.

Conçu initialement pour sécuriser un PFE d'excellence pour janvier 2027 et servir de vitrine d'ingénierie logicielle dans un portfolio technique, ArcApply est pensé pour évoluer vers un projet open-source communautaire permettant aux étudiants de mutualiser et d'étendre des connecteurs d'offres modulaires.

---

## Le Problème

La recherche d'un stage de fin d'études (PFE) à l'international — notamment pour des étudiants ingénieurs tunisiens (ex. filière ArcTIC) postulant en France — est soumise à une asymétrie critique :

1. **Friction chronophage extrême** : Surveiller quotidiennement de multiples plateformes (LinkedIn, Jobteaser, Welcome to the Jungle, Moovijob) et adapter rigoureusement CV et lettre pour chaque poste exige entre 30 et 45 minutes par offre.
2. **Le dilemme Quantité vs Qualité** :
   - *L'approche manuelle pure* garantit la qualité mais plafonne le volume à 2 ou 3 candidatures par jour, réduisant drastiquement les probabilités statistiques de décrocher un entretien face à la concurrence.
   - *L'approche automatisée classique (bots existants)* bombarde les recruteurs de candidatures génériques mal ciblées ou hallucine des compétences, conduisant à des rejets automatiques par les filtres ATS ou les recruteurs.
3. **Déperdition et perte de contrôle** : Les candidatures envoyées sur différents canaux s'éparpillent sans tableau de bord centralisé, rendant le suivi des relances et des entretiens confus.

---

## La Solution

ArcApply résout cette tension en associant automatisation des tâches répétitives et exigence qualitative stricte :

- **Agrégation ciblée** : Détection en temps réel des opportunités PFE sur les plateformes phares (LinkedIn et Jobteaser pour le MVP) selon des critères précis (technologies, villes, types de contrat).
- **Ajustement dynamique du CV sur base de vérité** : À partir d'un *Master Profile* complet (projets, stages d'été, stack, cours), ArcApply sélectionne, met en valeur et réordonne les éléments les plus pertinents pour l'offre sans inventer la moindre compétence.
- **Score d'alignement ATS pré-envoi** : Mesure de la correspondance sémantique et lexicale entre le CV adapté et les critères de la fiche de poste, garantissant une pertinence maximale avant toute action.
- **Rédaction de lettre naturelle et humaine** : Synthèse d'une lettre personnalisée évitant le jargon IA stéréotypé, reflétant la voix sincère, technique et motivée d'un futur ingénieur.
- **Validation humaine obligatoire (*Human-in-the-loop*)** : Aucune candidature ne part sans revue finale de l'étudiant. Les candidatures directes sont pré-remplies et validées en un clic ; les offres externes bénéficient d'un package complet prêt à coller (PDF + texte + lien).
- **Dashboard Kanban de pilotage** : Suivi visuel en temps réel de chaque opportunité, de la détection jusqu'à l'entretien.

---

## Ce qui rend ArcApply unique

1. **Règle absolue d'anti-hallucination** : L'IA ne peut puiser que dans le *Master Profile* vérifié de l'étudiant. Pas de compétences inventées, garantissant une totale légitimité lors des entretiens techniques.
2. **Voix étudiante authentique** : Des formulations spontanées, claires et professionnelles, à rebours des lettres générées par ChatGPT facilement identifiables par les recruteurs.
3. **Scoring ATS prédictif transparent** : Visualisation claire des mots-clés couverts et des écarts éventuels pour optimiser la conversion.
4. **Assistance maximale sans perte de contrôle** : Automatisation poussée des formulaires tout en maintenant l'arbitrage humain final.

---

## Utilisateurs cibles

- **Utilisateur primaire (MVP)** : Louay, élève-ingénieur en 5ème année (ArcTIC), préparant sa campagne de recherche de PFE débutant en janvier 2027 en France ou en Tunisie.
- **Utilisateurs secondaires (V2 / Open-Source)** : Étudiants d'écoles d'ingénieurs et d'universités en fin de cursus cherchant un stage PFE ou un premier emploi tech, particulièrement dans un contexte de mobilité internationale.

---

## Critères de Succès

1. **Gain de temps opérationnel** : Réduction du temps passé par candidature de ~40 minutes à **moins de 3 minutes** (revue et ajustements compris).
2. **Qualité et ciblage mesurables** : Score d'alignement ATS $\ge$ **75-80%** sur chaque candidature préparée.
3. **Résultat terrain tangible** : Atteinte d'un taux de conversion en entretien d'au moins **15 à 20%** sur l'ensemble des offres ciblées pour la session de PFE 2027.

---

## Périmètre du Projet

### Dans le périmètre du MVP
- Interface web ergonomique (profil, offres agrégées, kanban de suivi).
- Gestionnaire de *Master Profile* complet (projets personnels/académiques, stages, compétences, préférences).
- Connecteurs de recherche pour LinkedIn et Jobteaser (ciblage France et Tunisie).
- Moteur d'adaptation de CV en PDF et de calcul de score ATS.
- Générateur de lettre de motivation au ton humain naturel.
- Pré-remplissage et soumission assistée en 1 clic pour les candidatures directes (Easy Apply).
- Générateur de package (CV PDF + lettre copiée + lien direct) pour les redirections externes.
- Tableau de bord Kanban (Découverte $\rightarrow$ Candidature envoyée $\rightarrow$ Réponse reçue $\rightarrow$ Entretien).

### Hors périmètre (reporté en V2)
- Relances automatiques d'emails après délai d'inactivité.
- Plateformes secondaires : Welcome to the Jungle, Moovijob, Indeed, Apec.
- Extension navigateur autonome pour les formulaires ATS complexes tiers (Workday, etc.).
- Mode multi-comptes utilisateurs et déploiement communautaire cloud.

---

## Vision à long terme

Démarrant comme un outil personnel haute précision et une pièce maîtresse de portfolio démontrant une maîtrise complète (web scraping, agents LLM, architecture web moderne, UX orientée productivité), ArcApply a vocation à devenir un **projet open-source communautaire de référence**. 

L'architecture sera conçue de façon modulaire pour que d'autres étudiants puissent facilement implémenter leurs propres adaptateurs de job boards, partager des modèles de CV ATS optimisés et démocratiser l'accès aux meilleures opportunités de stages et d'emplois internationaux.
