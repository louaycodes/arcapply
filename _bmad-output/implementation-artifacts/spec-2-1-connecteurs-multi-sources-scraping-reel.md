# Spécification Story 2.1 : Connecteurs Multi-Sources de Scraping Réel (France 🇫🇷 & Tunisie 🇹🇳)

## 1. Description & Objectif Métier
Permettre à l'élève-ingénieur de capter le maximum d'opportunités de stage PFE sans spam ni doublons en agrégeant simultanément les flux d'offres en direct sur 26 plateformes majeures organisées par catégorie :

- **🇹🇳 Tunisie — Généralistes & Spécialisés PFE (8 sources) :**
  - **Keejob :** Scraping direct des annonces PFE/tech tunisiennes.
  - **TunisieTravail :** Scraping HTML régulier des opportunités et annonces de stage PFE.
  - **Tanitjobs :** Connecteur résilient avec détection et contournement des challenges Cloudflare.
  - **EmploiTunisie :** Plateforme leader AfricaWork pour les stages et premiers emplois d'ingénieurs.
  - **Stage-Tunisie :** Portail spécialisé dans les sujets PFE des écoles d'ingénieurs (ESPRIT, INSAT, ENIT).
  - **OptionCarriere Tunisie :** Agrégateur d'offres en direct sur toute la Tunisie.
  - **ANETI (emploi.nat.tn) :** Portail public et conventions officielles de stages PFE.
  - **Offre-Emploi.tn :** Portail dédié aux annonces et stages d'entreprises tunisiennes.

- **🇫🇷 France & International — Généralistes, Stages, Alternance & Tech (15 sources) :**
  - **LinkedIn Guest API :** Scraping en direct des endpoints publics sans authentification ni risque de bannissement de compte (`/jobs-guest/jobs/api/seeMoreJobPostings/search`).
  - **StackOverflow Jobs :** Pôle opportunités tech et développeurs.
  - **Welcome to the Jungle (WTTJ) :** Extraction ciblée des scaleups, licornes et startups tech.
  - **1jeune1solution :** Opportunités institutionnelles et grands groupes en France.
  - **Jobteaser :** Portail stages et relations écoles d'ingénieurs françaises.
  - **HelloWork :** Leader français privé pour les stages ingénieurs et alternances.
  - **Indeed France :** Moteur de recherche et opportunités PFE ingénierie.
  - **Apec :** Référence nationale pour les cadres, bac+5 et élèves-ingénieurs.
  - **Moovijob :** Stages et offres tech France & transfrontalier.
  - **Monster.fr :** Plateforme généraliste et technique pour les stages et emplois ingénieur.
  - **Stagiaires.fr :** Portail national dédié exclusivement aux stages étudiants et PFE.
  - **Cadremploi :** Stages d'excellence et opportunités pré-cadres ingénieurs.
  - **Meteojob :** Matching algorithmique pour les stages tech.
  - **L'Etudiant :** Portail pour stages de fin d'études et jeunes diplômés d'écoles.
  - **ChooseYourBoss :** Recrutement inversé et matching développeurs / stages ingénieurs.

- **🏢 France — Portails Carrières Directs ESN & Écosystèmes Tech (3 sources) :**
  - **Portails ESN Directs :** Connecteur direct pour Capgemini, Sopra Steria, Thales, Talan, CGI.
  - **Numeum.fr :** Syndicat professionnel de l'écosystème numérique français (annuaire et offres ESN).
  - **Cap Digital :** Pôle de compétitivité numérique européen (deeptech, startups, labs d'innovation).

---

## 2. Invariants Architecturaux
- **AD-1 & AD-2 Conformity :** Le moteur FastAPI orchestre le scraping (`CrawlerScheduler`) et écrit directement dans SQLite `~/.arcapply/arcapply.db`.
- **Déduplication Stricte :** Unicité garantie par couple `(platform, external_id)` avec calcul automatique du hash MD5 pour les plateformes sans identifiant numérique strict.
- **Résilience Réseau (Anti-Crash) :** L'échec d'un connecteur (ex: challenge réseau, timeout) ne bloque ni n'interrompt les 25 autres flux.
- **Diffusion Temps Réel SSE :** Chaque opportunité découverte émet un événement `JOB_DISCOVERED` immédiatement consommé par le Cockpit Radar web sans rechargement.

---

## 3. Composants Implémentés
1. **Connecteurs Backend (`services/engine/app/adapters/connectors/`) :**
   - 🇹🇳 `keejob.py`, `tunisietravail.py`, `tanitjobs.py`, `emploitunisie.py`, `stagetunisie.py`, `optioncarriere.py`, `aneti.py`, `offreemploitn.py`.
   - 🇫🇷 `linkedin.py`, `stackoverflowjobs.py`, `wttj.py`, `unjeuneunesolution.py`, `jobteaser.py`, `hellowork.py`, `indeed.py`, `apec.py`, `moovijob.py`, `monster.py`, `stagiairesfr.py`, `cadremploi.py`, `meteojob.py`, `letudiant.py`, `chooseyourboss.py`.
   - 🏢 `esndirect.py`, `numeum.py`, `capdigital.py`.
2. **Orchestrateur & Télémétrie (`services/engine/app/adapters/scheduler.py`) :**
   - `CrawlerScheduler.run_full_crawl(...)` : Exécution multi-plateforme sur les 26 connecteurs, déduplication et comptage télémétrique.
   - `CrawlerScheduler.get_status()` : État de santé et enregistrement des 26 sources.
3. **Endpoints FastAPI (`services/engine/app/api/jobs.py`) :**
   - `GET /api/jobs/sources` : Télémétrie des 26 connecteurs.
   - `POST /api/jobs/crawl-all` : Lancement du scan multi-plateformes unifié.
4. **Cockpit Radar Frontend (`apps/web`) :**
   - `apps/web/lib/api.ts` : Fonctions `crawlAllSources()` et `fetchSourcesStatus()`.
   - `apps/web/components/radar/job-card.tsx` : Badges distincts et typographie stylisée pour chacune des 26 plateformes.
   - `apps/web/app/radar/page.tsx` : Modal de scan multi-sources avec sélection granulaire et filtres sur les 26 sources.

---

## 4. Matrice de Tests & Validation
- `tests/test_connectors.py` :
  - `test_tunisia_connectors_output_structure` : Validation des 8 connecteurs tunisiens.
  - `test_france_connectors_output_structure` : Validation des 18 connecteurs français, tech et ESN.
  - `test_sources_status_endpoint` : Télémétrie de l'API `/api/jobs/sources` confirmant 26 connecteurs enregistrés.
  - `test_crawl_all_endpoint_deduplication` : Validation de l'idempotence et de l'exclusion des doublons.
- **Suite Complète :** 32/32 tests unitaires et d'intégration validés (`uv run pytest -v`).
- **Frontend Production Build :** Next.js 15 compilé avec 0 erreur.


