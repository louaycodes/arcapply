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
