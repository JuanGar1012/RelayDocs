# PROJECT_STATE

## Goal
- Deliver RelayDocs as a production-style collaborative document platform with deterministic behavior, strict typing, validated API boundaries, and server-enforced authorization.

## Non-Goals
- Sweeping refactors without request.
- Relaxing strict TypeScript, RBAC, or validation rules.
- Storing secrets in code/logs.

## Current Architecture
- Frontend: `apps/web` (React + TypeScript + Vite + Tailwind + React Router + TanStack Query).
- API Gateway: `apps/gateway` (Node.js + TypeScript + Zod validation + JWT + auth middleware + rate limit + readiness checks).
- Document microservice: `services/document-service` (Spring Boot MVC + JPA/Hibernate + Bean Validation + Flyway + DB-backed readiness check).
- Data: PostgreSQL 16 with Flyway migrations (`V1__init.sql`, `V2__consumed_events.sql`, `V3__auth_credentials.sql`).
- Events: Redpanda (Kafka-compatible), idempotent consumer dedupe via `consumed_events`.

## Data Model
- `users`: principal records used by document ownership and RBAC.
- `auth_credentials`: username (`user_id`) + bcrypt password hash.
- `documents`: owner, title/content, timestamps.
- `document_permissions`: per-user `viewer`/`editor` roles.
- `consumed_events`: idempotency replay tracking.

## Key Commands (Dev/Test/Lint/Build)
- Install deps: `npm install`
- Full stack up/down: `docker compose up --build -d` / `docker compose down`
- Reset volumes: `docker compose down -v --remove-orphans`
- Live-edit infra: `docker compose stop web gateway && docker compose up -d postgres redpanda document-service`
- Lint: `npm.cmd run lint`
- Build: `npm.cmd run build`
- Node tests: `npm.cmd run test`
- Gateway tests only: `npm.cmd run test -w gateway`
- Service tests: `mvn -B -f services/document-service/pom.xml test`
- E2E tests: `npm.cmd run test:e2e`

## Files Created/Modified And Why (High Level)
- `apps/gateway/src/config/runtime.ts`: centralized production/runtime auth controls for JWT secret and dev-token behavior.
- `apps/gateway/src/middleware/securityHeaders.ts`: baseline HTTP security headers.
- `apps/gateway/src/middleware/rateLimit.ts`: auth route rate limiting with env-driven thresholds.
- `apps/gateway/src/app.ts`: added `/ready` endpoint with downstream dependency check; enabled gateway hardening middleware.
- `apps/gateway/src/app.test.ts`: coverage for readiness and security headers.
- `apps/gateway/.env.example`, `README.md`: documented new runtime and readiness settings.
- `services/document-service/src/main/java/com/relaydocs/documentservice/api/HealthController.java`: added `/live` and DB-backed `/ready` endpoint.
- `docs/PRODUCTION_READINESS.md`, `docs/DEPLOYMENT_PLAN.md`, `docs/RESUME_PORTFOLIO_SKILLS.md`: production/deployment and resume/portfolio summaries.
- `.gitignore`: ignore local-only `PR Workflow.txt` and `CHECKPOINTS/` artifacts.

## Completed
- `.gitattributes` line-ending normalization was already committed and synced on `main`.
- Created and pushed `feature/pr-workflow-checklist-docs` with production/deployment/skills docs.
- Implemented production-hardening slice in gateway and document-service (security headers, auth rate limit, readiness separation).
- Verified quality gates for changed areas:
  - `npm.cmd run lint -w gateway` passed.
  - `npm.cmd run build -w gateway` passed.
  - `npm.cmd --prefix C:\Users\juang\Dev\projects\Codex\RelayDocs run test -w gateway` passed (13 tests).
  - `mvn -B -f C:\Users\juang\Dev\projects\Codex\RelayDocs\services\document-service\pom.xml test` passed.

## Open Tasks (Prioritized)
1. Open PR for `feature/pr-workflow-checklist-docs` and merge docs/hardening slice after CI passes.
2. Implement distributed rate limiting and account lockout strategy (Redis-backed preferred) for horizontally scaled gateway deployments.
3. Add structured request logging + correlation IDs across gateway and document-service.
4. Add deployment workflows for staging/prod and post-deploy smoke checks in GitHub Actions.
5. Continue UI polish pass (design system tokens, empty/loading states, responsive nav, accessibility checks).

## Known Issues / Edge Cases
- Docker Desktop must be running; otherwise compose/Testcontainers fail with named-pipe connection errors.
- Switching between full-compose and live-edit modes requires stopping compose `web/gateway` first to avoid port conflicts.
- Older local volumes may need `docker compose down -v` so Flyway applies latest migrations cleanly.
- Current auth rate limiting is in-memory; it does not coordinate across multiple gateway replicas.

## Next 3 Actions
- [ ] Open and merge PR from `feature/pr-workflow-checklist-docs` after CI success.
- [ ] Add structured logging + correlation IDs in gateway and propagate downstream.
- [ ] Start UI presentability sprint (design tokens, layout polish, accessibility pass) on a new feature branch.
