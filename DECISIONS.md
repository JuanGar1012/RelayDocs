# DECISIONS

## 2026-02-11
- Established `PROJECT_STATE.md` as canonical checkpoint source for current workspace state and synchronized a timestamped snapshot in `CHECKPOINTS/`.
- Prioritized near-term execution order as: database/RBAC model hardening, gateway boundary validation/authz enforcement, then service and event reliability test coverage.
- Standardized runtime schema management on Flyway migrations with Spring JPA set to `ddl-auto=validate` for deterministic schema evolution.
- Adopted full-stack container orchestration (`postgres`, `redpanda`, `document-service`, `gateway`, `web`) as the primary manual testing path.
- Added baseline Playwright smoke E2E coverage targeting the running full stack to verify core create/read flows.

## 2026-02-12
- Added `org.flywaydb:flyway-database-postgresql` alongside `flyway-core` in `services/document-service/pom.xml` so Flyway supports PostgreSQL 16.x in containerized runtime.
- Kept PostgreSQL at version 16 in `docker-compose.yml` and fixed compatibility in the service dependency layer rather than downgrading the DB image.
- Updated `apps/web/nginx.conf` with explicit `root /usr/share/nginx/html;` and `index index.html;` to eliminate SPA route refresh redirect loops that returned HTTP 500.
- Confirmed Docker compose as canonical verification path by requiring successful `docker compose up --build -d` and passing `npm run test:e2e` smoke before advancing to next feature work.
- Introduced a split runtime model to reduce iteration friction: full stack in compose for integrated verification, and live-edit mode with compose infra + local gateway/web watchers.
- Standardized live-edit ports to `8082` (gateway) and `5174` (web) to avoid repeated conflicts with compose defaults (`8080`/`5173`).
- Hardened gateway startup in `apps/gateway/src/index.ts` with explicit HTTP server creation, robust `EADDRINUSE` error handling, and process-level fatal handlers for deterministic crash behavior.
- Adopted `.env`-driven configuration across root compose and app-level development (`.env.example`, `apps/gateway/.env.example`, `apps/web/.env.example`) and removed script-level env overrides.
- Added initial visual polish baseline (blue gradient surface system, animated button hover treatment, and document list empty state) as the active UI direction for continued iteration.
- Implemented consumer-side idempotency with durable dedupe storage (`consumed_events`), unique-key replay protection, and fallback hash keying when inbound events do not include `eventId`.
- Added Kafka consumer retry policy with non-retryable malformed-payload handling and bounded retry/backoff for transient failures.
- Expanded Playwright coverage with three negative-path tests (forbidden viewer edit, malformed document id, owner self-share rejection) and stabilized smoke test sequencing by waiting for create API response.
- Added GitHub Actions CI gates (`.github/workflows/ci.yml`) covering Node lint/test/build, Spring tests, and compose-backed E2E.
- Fixed compose/runtime gateway drift by setting container `PORT=8080` explicitly so local app-level `.env` does not break container health/routes.
- Added focused `DocumentService` unit coverage for RBAC edge and sequential concurrent-write behavior instead of broad integration refactoring, preserving small diffs while validating authorization semantics and deterministic last-write outcomes.
- Prioritized an accessibility-focused UI polish pass in `apps/web` with consistent keyboard focus visibility, explicit loading/error semantics (`role=status`/`role=alert`), and safer disabled action states during pending or empty submissions.
- Tuned CI runtime/stability preemptively by enabling workflow-level concurrency cancellation, job timeout caps, and Playwright browser caching; kept first GitHub-run confirmation as a follow-up verification step.
- Added frontend login/session handling in `apps/web` to support practical multi-user RBAC/concurrency validation directly in the UI, using persisted bearer tokens (`dev-token-*` or custom token) without introducing a separate auth service yet.

## 2026-02-13
- Updated handoff documentation flow to keep completed work and pending work explicitly separated: `PROJECT_STATE.md` now carries a dated "Recent Actions" summary while `NEXT_SESSION_PROMPT.md` lists pending actions only.
- Standardized `NEXT_SESSION_PROMPT.md` content to prioritize unresolved tasks first (CI validation, Kafka integration coverage, and compose operational notes) to reduce context drift across sessions.

## 2026-02-13 (Checkpoint Auth Pivot)
- Decided to implement simple username/password authentication without email, backed by database storage and exposed through Sign Up/Login UX, while preserving existing RBAC semantics tied to authenticated user identity.

## 2026-02-13 (Auth Implementation)
- Implemented authentication without email using a dedicated `auth_credentials` table with bcrypt password hashes, while keeping existing `users` table ownership/RBAC model intact.
- Placed JWT issuance in the gateway (`/api/v1/auth/signup`, `/api/v1/auth/login`) and kept credential storage/verification in document-service to maintain current service boundaries with minimal refactor.
- Removed frontend auto-login from `VITE_DEV_TOKEN` fallback so first entry now shows explicit Sign Up/Login actions and authenticated sessions are persisted via local storage token state.

## 2026-02-13 (Checkpoint: Username/Password Auth Delivered)
- Completed end-to-end username/password authentication using a database-backed credential table (`auth_credentials`) with bcrypt hashes, with no email requirement.
- Kept JWT issuance in gateway while delegating credential creation/verification to document-service to minimize refactor and preserve current service boundaries.
- Set web app first entry to explicit Sign Up/Login flows and session persistence, removing default env-based auto-login from canonical web env setup.
- Preserved prior RBAC UX improvements (inline role switching + friendly forbidden messages) so manual authorization testing remains fast after auth rollout.

## 2026-02-14
- Migrated Playwright E2E auth/RBAC coverage from dev-token shortcuts to real username/password signup/login sessions and added a dedicated auth+RBAC+two-user update sequencing scenario.
- Aligned gateway JWT verification fallback with JWT issuance fallback (`relaydocs-dev-secret`) to prevent 401 regressions when `JWT_SECRET` is unset in compose/dev defaults.
- Added broker-backed Kafka consumer integration tests using Testcontainers and marked them `disabledWithoutDocker=true` to keep deterministic local/CI behavior when Docker is unavailable.
- Tightened CI E2E readiness checks to include web endpoint availability before running Playwright to reduce startup race failures.
- Added explicit Docker recovery/cache troubleshooting notes to README as the canonical operational guidance.

## 2026-02-17
- Confirmed and reinforced the branch/PR/CI workflow as the default delivery path: branch from latest `main`, run local lint/build/test gates, open PR, confirm CI, merge, sync `main`, delete feature branch.
- Added `.gitattributes` for repository-level line-ending normalization to reduce cross-platform LF/CRLF staging noise while preserving Windows script ergonomics.
- Chose minimal code fix strategy for gateway test typing/lint conflict by capturing request init explicitly in mocks, preserving strict TypeScript and lint compliance without altering runtime behavior.

## 2026-02-18
- Prioritized a small, production-hardening slice over broad refactors: gateway security headers, auth endpoint rate limiting, and explicit readiness probing were implemented first.
- Centralized gateway runtime security rules in shared config (`getJwtSecret`, `allowDevTokens`) so production disables dev tokens and requires a strong JWT secret.
- Added dependency-aware readiness separation (`/health` vs `/ready`) at both gateway and document-service to support orchestrator-safe liveness/readiness checks.
- Chose in-memory auth rate limiting at gateway as an immediate control, with intent to replace/augment with distributed rate limiting when scaling horizontally.
- Extended gateway observability and traceability with request-scoped correlation IDs (`X-Request-Id`) via async context propagation and structured access logs, and propagated request IDs to downstream service calls.
- Added document-service request correlation filter with MDC-backed request ID logging and response echo to align logs across gateway and service hops.
- Implemented Redis-capable distributed auth controls in gateway (rate limiting and account lockout) with deterministic in-memory fallback when Redis is absent.
- Added staging and production deployment workflow scaffolds with post-deploy `/ready` smoke checks gated by GitHub environment variables.
