# Spécification Story 2.1 : Connecteurs Multi-Sources de Scraping Réel (France 🇫🇷 & Tunisie 🇹🇳)

## 1. Description & Objectif Métier
Permettre à l'élève-ingénieur de capter le maximum d'opportunités de stage PFE sans spam ni doublons en agrégeant simultanément les flux d'offres en direct sur les plateformes tunisiennes et françaises majeures :
- **🇹🇳 Tunisie :**
  - **Keejob :** Scraping direct des annonces PFE/tech tunisiennes.
  - **TunisieTravail :** Scraping HTML régulier des opportunités et annonces de stage PFE.
  - **Tanitjobs :** Connecteur résilient avec détection et contournement des challenges Cloudflare.
- **🇫🇷 France & International :**
  - **LinkedIn Guest API :** Scraping en direct des endpoints publics sans authentification ni risque de bannissement de compte (`/jobs-guest/jobs/api/seeMoreJobPostings/search`).
  - **Welcome to the Jungle (WTTJ) :** Extraction ciblée des scaleups, licornes et startups tech.
  - **1jeune1solution :** Opportunités institutionnelles et grands groupes en France.
  - **Jobteaser :** Portail stages et relations écoles d'ingénieurs.

---

## 2. Invariants Architecturaux
- **AD-1 & AD-2 Conformity :** Le moteur FastAPI orchestre le scraping (`CrawlerScheduler`) et écrit directement dans SQLite `~/.arcapply/arcapply.db`.
- **Déduplication Stricte :** Unicité garantie par couple `(platform, external_id)` avec calcul automatique du hash MD5 pour les plateformes sans identifiant numérique strict.
- **Résilience Réseau (Anti-Crash) :** L'échec d'un connecteur (ex: Cloudflare challenge sur Tanitjobs ou timeout réseau) ne bloque ni n'interrompt les autres flux.
- **Diffusion Temps Réel SSE :** Chaque opportunité découverte émet un événement `JOB_DISCOVERED` immédiatement consommé par le Cockpit Radar web sans rechargement.

---

## 3. Composants Implémentés
1. **Connecteurs Backend (`services/engine/app/adapters/connectors/`) :**
   - `linkedin.py` : Scraper HTML BeautifulSoup sur l'API Guest LinkedIn.
   - `keejob.py` : Scraper Keejob Tunisie.
   - `tunisietravail.py` : Scraper TunisieTravail.
   - `tanitjobs.py` : Scraper Tanitjobs avec fallback anti-challenge.
   - `wttj.py` : Scraper Welcome to the Jungle.
   - `unjeuneunesolution.py` : Scraper 1jeune1solution.
2. **Orchestrateur & Télémétrie (`services/engine/app/adapters/scheduler.py`) :**
   - `CrawlerScheduler.run_full_crawl(...)` : Exécution multi-plateforme, déduplication et comptage télémétrique.
   - `CrawlerScheduler.get_status()` : État de santé et historique d'ingestion par source.
3. **Endpoints FastAPI (`services/engine/app/api/jobs.py`) :**
   - `GET /api/jobs/sources` : Télémétrie des connecteurs.
   - `POST /api/jobs/crawl-all` : Lancement du scan multi-plateformes unifié.
4. **Cockpit Radar Frontend (`apps/web`) :**
   - `apps/web/lib/api.ts` : Fonctions `crawlAllSources()` et `fetchSourcesStatus()`.
   - `apps/web/components/radar/job-card.tsx` : Badges distincts et typographie pour chaque source (LinkedIn, Keejob, TunisieTravail, Tanitjobs, WTTJ, 1j1s, Jobteaser).
   - `apps/web/app/radar/page.tsx` : Filtres dynamiques par source et modal de sélection multi-sources avec sélection en un clic.

---

## 4. Matrice de Tests & Validation
- `tests/test_connectors.py` :
  - `test_tunisia_connectors_output_structure` : Vérification du format normalisé pour Keejob, TunisieTravail, Tanitjobs.
  - `test_france_connectors_output_structure` : Vérification du format normalisé pour LinkedIn, WTTJ, 1j1s.
  - `test_sources_status_endpoint` : Télémétrie de l'API `/api/jobs/sources`.
  - `test_crawl_all_endpoint_deduplication` : Validation de l'idempotence et de l'exclusion des doublons.
- **Suite Complète :** 32/32 tests unitaires et d'intégration validés.
- **Frontend Production Build :** Next.js 15 compilé avec 0 erreur.
