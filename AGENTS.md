# Project Context & Agent Rules — ArcApply

## 1. Project Overview
**ArcApply** is an intelligent, high-efficiency personal application copilot designed to help student engineers secure top-tier PFE internships (France and Tunisia) without blind mass spam or AI hallucinations.

### Architecture
- **Monorepo structure:**
  - `apps/web/` : Next.js Cockpit (App Router, Tailwind CSS, shadcn/ui, TanStack Query).
  - `services/engine/` : Local Automation & AI Engine (FastAPI, SQLite via SQLModel, Playwright, Grok / Instructor).
  - `_bmad/` & `_bmad-output/` : BMAD Framework planning, specifications, and sprint tracking.

---

## 2. Git Workflow & Version Control Best Practices (MANDATORY RULE)

**Every modification, new feature, correction, test suite, and module implementation MUST be systematically and cleanly committed to Git.**

### Commit Rules:
1. **Conventional Commits Format:**
   ```
   <type>(<scope>): <short description in present tense>
   ```
   - **Types:**
     - `feat`: New feature or user story implementation
     - `fix`: Bug fix or edge-case correction
     - `refactor`: Code refactoring without behavioral changes
     - `test`: Adding or updating unit/integration tests
     - `docs`: Documentation or specification updates
     - `chore`: Tooling, dependencies, or configuration changes
   - **Scopes:**
     - `engine`: Backend FastAPI, domain logic, SQLite, or connectors
     - `web`: Frontend Next.js, UI components, hooks, or pages
     - `ats`: ATS deterministic alignment engine
     - `cv`: CV generation and PDF compilation
     - `letter`: Cover letter synthesis
     - `kanban`: Kanban board and application lifecycle
     - `email`: Recruiter email ingestion connector
     - `bmad`: BMAD artifacts, sprint plans, or specifications

2. **Atomic & Focused Commits:**
   - One commit per story sub-task, logical unit, or bug fix.
   - Do NOT mix unrelated frontend, backend, or documentation changes in a single commit.

3. **Pre-commit Verification:**
   - Always run and pass relevant tests before committing.
   - Ensure `git status` contains only intentional, tracked changes. Never commit `.env`, secrets, `.sqlite` databases, or temporary caches.

4. 4. **Push Policy (Deployment Cost Control):**
   - Commit after every completed story, but do NOT push after each story.
   - `main` triggers a production deployment (GitHub Actions). NEVER push to `main` unless the user explicitly asks for it.
   - Work on a feature branch (`feat/<name>`), which does not trigger the pipeline.
   - Push the feature branch only at the end of a work session or when the user asks.
   - Deployment happens once: the user merges the branch into `main` after validation.
   - For docs-only or BMAD-only commits, add `[skip ci]` to the commit message.

---

## 3. Core Architectural Invariants
- **AD-1 (Strict Decoupling):** Frontend Next.js and backend FastAPI run in distinct processes. Next.js never launches heavy automation or scraper subprocesses directly.
- **AD-2 (Exclusive DB Ownership):** The FastAPI engine exclusively owns `~/.arcapply/arcapply.db`. Frontend communicates strictly through REST and SSE APIs.
- **Zero-Hallucination Invariant:** Generation engines (CV, letter) can ONLY use verified data from the user's Master Profile. No synthetic skills or extrapolated experiences.
- **Human-in-the-Loop:** No application may be submitted without explicit, manual user action.

---

## 4. Observed Pitfalls & Critical Invariants for Dev Agents (DO NOT REPEAT)

### Pitfall 1: Next.js Cache Corruption & Build Collision (`.next/` 404 Chunks)
- **Symptom:** In the browser, the application goes blank, unstyled, or throws `Error: Cannot find module './xxx.js'`, `GET /_next/static/chunks/... 404` and `GET / 500`.
- **Root Cause:** Running `npm run build` in `apps/web/` while `next dev` is running as a background daemon wipes and rewrites `.next/`. The running `next dev` process retains in-memory references to outdated chunk hashes that no longer exist on disk.
- **Mandatory Rule:**
  1. NEVER run `npm run build` while `next dev` is active in the background.
  2. If a production build is executed (e.g. to verify TypeScript or bundling before commit), you MUST immediately kill the running `next dev` daemon, delete the cache (`rm -rf apps/web/.next`), and restart `npm run dev`.

### Pitfall 2: SQLite Schema Invariant & Additive Migrations (`OperationalError: no such column`)
- **Symptom:** Backend startup crashes or crashes during API requests with `sqlite3.OperationalError: no such column: <table>.<column>`.
- **Root Cause:** `SQLModel.metadata.create_all(engine)` ONLY creates tables if they do not exist; it DOES NOT alter existing tables to add newly added columns to `~/.arcapply/arcapply.db`.
- **Mandatory Rule:**
  - Whenever ANY new field is added to a SQLModel table (`MasterProfile`, `JobOffer`, `CoverLetter`, `TargetedCV`), an idempotent additive migration MUST be added in `_migrate_db(engine)` in `app/adapters/database.py` with `ALTER TABLE ... ADD COLUMN ...`.

### Pitfall 3: Background Process Hygiene & Zombie Port Conflicts (8000 & 3000)
- **Symptom:** Port collisions, multiple zombie Uvicorn/Node processes competing for SQLite locks or sockets, or stale code running.
- **Mandatory Rule:**
  - Before launching or relaunching FastAPI or Next.js, ALWAYS verify and clean ports 8000 and 3000 using `lsof -ti :8000 -ti :3000 | xargs kill -9 2>/dev/null || true`.

### Pitfall 4: Fast/Safe LLM Generation & Deterministic Fallback
- **Symptom:** Requests timing out or 429 rate limit exceptions failing the generation API.
- **Mandatory Rule:**
  - Groq free tier has a strict 1000 OTPM rate limit. Always enforce conservative token limits (`max_tokens <= 450`).
  - LLM calls must be defensive: on any exception (timeout, 429, schema mismatch, or anti-hallucination check failure), immediately fall back to the deterministic letter builder without raising a 500 error to the client.
  - Always respect `profile.search_mode` and `job.offer_type` (never hardcode PFE / 6 months when the user or offer is in JOB mode).

### Pitfall 5: Zero Emojis in Codebase (Strict Clean Engineering UI/UX)
- **Symptom:** Unprofessional UI rendering, inconsistent typography, font rendering discrepancies on certain operating systems, or cluttered logs.
- **Mandatory Rule:**
  - DO NOT use emojis (flags, symbols, smileys, decorative unicode icons) in frontend components, UI templates, backend code, print/log statements, or comments.
  - Always use Lucide React icons (e.g. `Building2`, `Sparkles`, `Check`, `Zap`, `X`, `ShieldCheck`) for visual indicators.
  - Use clean text codes (e.g. `FR`, `TN`, `EN`, `[FR]`, `[EN]`) for country or language tags instead of emoji flags.

### Pitfall 6: Scraper Connector Architecture Invariant (Pagination, Multi-Location, Multi-Pass Terms & Real Details)
- **Symptom:** Scrapers returning only 5-8 jobs on the first run, and 0 new jobs on subsequent runs, while hundreds of fresh job postings exist on the platform. Complete absence of Tunisian offers or missing tech stack descriptions.
- **Root Causes:**
  1. *Zero Pagination & Hardcoded Limit:* Querying page 0 only without iterating over offsets (`start=0, 10, 20...` or `page=1, 2...`). After the first run, those few jobs are in DB; anti-rescrape rejects them and zero new jobs are found.
  2. *Destructive String Join:* Doing `query = " ".join(keywords)` concatenates separate terms like `["PFE", "Stage Ingénieur", "Internship"]` into one giant phrase (`"PFE Stage Ingénieur Internship"`). This triggers an impossible AND intersection on external search engines, wiping out 95%+ of legitimate offers.
  3. *Dropping Target Locations:* Using `loc = locations[0]` discards `locations[1..N]` (e.g. Tunisie when locations is `["France", "Tunisie"]`).
  4. *Overly Restrictive Platform Filters:* Hardcoding experience flags like `&f_E=1` on LinkedIn omits unclassified internships and entry-level postings.
  5. *Card Placeholder Descriptions:* Not fetching full descriptions via `fetch_job_details()` leaves generic fallback snippets in `description_raw`, breaking downstream ATS keyword extraction.
- **Mandatory Rules for All Current & Future Connectors:**
  1. *Mandatory Pagination:* Connectors must support and execute pagination up to the requested `limit` / `limit_per_platform`.
  2. *Discrete Query Normalization:* Always use `cls.normalize_search_terms(keywords)` to treat search terms as distinct query passes rather than space-concatenating them into a single string.
  3. *Multi-Location Iteration:* Always loop over all entries in `locations` (e.g. France, Tunisie).
  4. *Deep Description Enrichment:* `CrawlerScheduler` must resolve full offer text for newly discovered jobs via `connector.fetch_job_details()` so ATS matching has real requirements to evaluate.
  5. *Ethical Jitter:* Always use human-like jitter (`apply_jitter`) between paginated requests to respect platform rate-limits.

