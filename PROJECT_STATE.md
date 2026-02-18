# PROJECT_STATE

## Goal
- Deliver RelayDocs as a production-style collaborative document platform with deterministic behavior, strict typing, validated API boundaries, secure authorization, and deployable operational maturity.

## Non-Goals
- Sweeping refactors without request.
- Relaxing strict TypeScript, RBAC, or validation constraints.
- Storing secrets in source code or logs.

## Current Architecture
- Frontend: `apps/web` (React + TypeScript + Vite + Tailwind + React Router + TanStack Query).
- API Gateway: `apps/gateway` (Node.js + TypeScript + Zod validation + JWT auth + structured request logging + correlation IDs + auth rate limiting + account lockout).
- Document microservice: `services/document-service` (Spring Boot MVC + JPA/Hibernate + Bean Validation + Flyway + request correlation filter + DB readiness checks).
- Data: PostgreSQL 16 with Flyway migrations (`V1__init.sql`, `V2__consumed_events.sql`, `V3__auth_credentials.sql`).
- Events: Redpanda (Kafka-compatible), idempotent consumer dedupe via `consumed_events`.

## Data Model
- `users`: principal records for ownership and RBAC.
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
- Gateway tests: `npm.cmd run test -w gateway`
- Service tests: `mvn -B -f services/document-service/pom.xml test`
- E2E tests: `npm.cmd run test:e2e`

## Files Created/Modified And Why (High Level)
- Gateway correlation and logging:
  - `apps/gateway/src/context/requestContext.ts`
  - `apps/gateway/src/middleware/requestContext.ts`
  - `apps/gateway/src/middleware/requestLogging.ts`
  - `apps/gateway/src/client/documentServiceClient.ts`
- Gateway distributed auth controls:
  - `apps/gateway/src/security/redisClient.ts`
  - `apps/gateway/src/security/authControlsConfig.ts`
  - `apps/gateway/src/security/authLockout.ts`
  - `apps/gateway/src/middleware/rateLimit.ts`
  - `apps/gateway/src/routes/auth.ts`
- Service correlation and logging:
  - `services/document-service/src/main/java/com/relaydocs/documentservice/api/RequestCorrelationFilter.java`
  - `services/document-service/src/main/resources/application.yml`
- Deployment automation:
  - `.github/workflows/deploy-staging.yml`
  - `.github/workflows/deploy-production.yml`
  - `docs/DEPLOYMENT_SECRETS.md`
- Documentation and env updates:
  - `README.md`
  - `apps/gateway/.env.example`
- Test updates:
  - `apps/gateway/src/app.test.ts`
  - `apps/gateway/src/client/documentServiceClient.test.ts`
  - `services/document-service/src/test/java/com/relaydocs/documentservice/DocumentServiceApplicationTests.java`

## Completed
- Added request correlation IDs (`X-Request-Id`) and structured access logs in gateway.
- Propagated gateway request IDs to document-service downstream calls.
- Added document-service request correlation filter with MDC-based request ID in logs.
- Implemented Redis-capable distributed auth rate limiting and account lockout, with in-memory fallback.
- Added staging/production deployment workflow scaffolds with `/ready` smoke checks and environment variable gates.
- Replaced deploy placeholders with hook-trigger deploy commands and explicit GitHub environment secret validation.
- Added deployment secrets mapping doc for GitHub environments and platform runtime secret manager setup.
- Validation completed:
  - `npm.cmd run lint -w gateway` passed.
  - `npm.cmd run build -w gateway` passed.
  - `npm.cmd --prefix C:\Users\juang\Dev\projects\Codex\RelayDocs run test -w gateway` passed (14 tests).
  - `mvn -B -f C:\Users\juang\Dev\projects\Codex\RelayDocs\services\document-service\pom.xml test` passed (Kafka integration tests skipped without Docker as expected).

## Open Tasks (Prioritized)
1. Complete today deployment gate items in `docs/PRODUCTION_READINESS.md` and deploy production.
2. Configure GitHub environment secrets/variables in `docs/DEPLOYMENT_SECRETS.md`.
3. Add CI security scans (dependency + container + SBOM).
4. Implement observability stack baseline (metrics + tracing + alerts).
5. Continue UI presentability sprint and accessibility pass.

## Known Issues / Edge Cases
- Docker Desktop must be running; otherwise compose/Testcontainers fail with named-pipe connection errors.
- Switching between full-compose and live-edit modes requires stopping compose `web/gateway` first to avoid port conflicts.
- Older local volumes may need `docker compose down -v` so Flyway applies latest migrations cleanly.
- Redis-backed auth controls activate only when `REDIS_URL` is set; otherwise fallback remains process-local and non-shared.

## Next 3 Actions
- [ ] Configure `staging` and `production` GitHub environment secrets/variables from `docs/DEPLOYMENT_SECRETS.md`.
- [ ] Trigger staging deployment workflow and confirm `/ready` passes.
- [ ] Trigger production deployment workflow and run post-deploy smoke path.


