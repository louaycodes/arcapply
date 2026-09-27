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

4. **Mandatory Remote Push After Every Completed Story (BLOCKING RULE):**
   - Immediately after completing each story with passing tests and clean review, a push to the remote repository (`git push origin <current-branch>`) is STRICTLY MANDATORY before proposing the next step or story.
   - If no remote origin is configured, halt immediately and ask the user for the repository URL.
   - Confirm explicitly that the push succeeded (with commit hash and branch name) before proposing the next story or walkthrough.

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

