# Review: Adversarial Divergence Analysis

- **Spine Reviewed:** `ARCHITECTURE-SPINE.md`
- **Reviewer:** Adversarial Architecture Reviewer
- **Date:** 2026-09-26
- **Verdict:** PASS WITH RECOMMENDATIONS (Auto-applied)

## Adversarial Scenarios Examined

### Scenario 1: Polyglot Schema Mismatch on Master Profile & Job Entities
- **Attack:** Unit A (Next.js frontend engineer) designs Master Profile form state with camelCase fields (`workExperience`, `startDate`), while Unit B (FastAPI backend engineer) defines Pydantic models with snake_case (`work_history`, `from_date`). Both claim compliance with AD-1 and AD-2, yet the system breaks on save/load.
- **Hole:** Lack of an explicit single-source-of-truth generator for API and domain contracts across the TS/Python boundary.
- **Remediation:** Bind API contracts to FastAPI's OpenAPI schema: TypeScript interfaces in `apps/web/lib/api/types.ts` must be auto-generated from `services/engine/app/api` schemas (via `openapi-typescript`), with Pydantic configured with `alias_generator` for camelCase serialization or client handling.

### Scenario 2: SSE Event Framing Divergence
- **Attack:** Unit B streams progress with custom SSE formatting (`event: progress`, `data: {"step": 1}`), while Unit A listens for generic messages with an internal type wrapper (`{"event_type": "STEP_COMPLETED"}`). The frontend stepper stalls at step 1.
- **Hole:** Envelope structure for SSE events was not pinned.
- **Remediation:** Enforce a unified SSE envelope format:
  `data: {"event": "<EVENT_NAME>", "timestamp": "<ISO8601>", "payload": { ... }}`

### Scenario 3: FSM Bypass via Direct State Update
- **Attack:** A developer implementing a manual drag-and-drop on the Kanban directly patches an application status from `DISCOVERED` to `SUBMITTED` without going through `READY` or triggering the validation drawer.
- **Hole:** AD-6 mentions transitions but backend validation might be assumed rather than enforced at the database/service layer.
- **Remediation:** Explicitly mandate that the backend application service raises a `422 Unprocessable Entity` or `400 Bad Request` if a status transition violates the allowed state transition matrix, preventing any frontend bypass.
