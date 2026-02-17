# PROJECT_STATE

## Goal
- Deliver RelayDocs as a production-style collaborative document platform with deterministic behavior, strict typing, validated API boundaries, and server-enforced authorization.

## Non-Goals
- Sweeping refactors without request.
- Relaxing strict TypeScript, RBAC, or validation rules.
- Storing secrets in code/logs.

## Current Architecture
- Frontend: `apps/web` (React + TypeScript + Vite + Tailwind + React Router + TanStack Query).
- API Gateway: `apps/gateway` (Node.js + TypeScript + Zod validation + token auth).
- Document microservice: `services/document-service` (Spring Boot MVC + JPA/Hibernate + Bean Validation + Flyway).
- Data: PostgreSQL 16, schema managed by Flyway migration `V1__init.sql`.
- Events: Redpanda (Kafka-compatible) provisioned in compose; publish-side wiring exists.
- Runtime: `docker-compose.yml` orchestrates `postgres`, `redpanda`, `document-service`, `gateway`, and `web`.

## Data Model
- `users` table for principals.
- `documents` table for owned content (`title`, `content`, timestamps, owner id).
- `document_permissions` join model for per-user access (`viewer`/`editor`) with owner guards.
- Domain event types: `document.created`, `document.updated`, `document.shared`, `permission.changed`.

## Key Commands
- Install JS deps: `npm install`
- Start full stack: `docker compose up --build -d`
- Stop full stack: `docker compose down`
- Reset stack volumes: `docker compose down -v && docker compose up --build -d`
- Web dev mode: `npm run dev:web`
- Gateway dev mode: `npm run dev:gateway`
- Spring dev mode: `cd services/document-service && mvn spring-boot:run`
- Workspace tests: `npm test`
- E2E tests: `npm run test:e2e`
- Lint: `npm run lint`

## Files Created/Modified And Why
- `services/document-service/pom.xml`: added Flyway PostgreSQL module to support Postgres 16.x migrations at runtime.
- `apps/web/nginx.conf`: added SPA static `root`/`index` directives to stop Nginx internal redirect cycle on route refreshes.
- `e2e/playwright.config.ts`, `e2e/tests/smoke.spec.ts`: smoke coverage for create/open flow.
- `docker-compose.yml`: production-like local orchestration path used as the default manual test flow.

## Completed
- Compose stack fully validated on Docker host.
- All five services running together: web, gateway, document-service, postgres, redpanda.
- Flyway migration path verified end-to-end against PostgreSQL 16 (`V1` applied).
- Web routing runtime issue fixed (`/documents` no longer serves 500 from Nginx loop).
- Playwright browsers installed locally.
- E2E smoke test passes (`npm run test:e2e`).

## Open Tasks (Prioritized)
1. Implement Kafka consumer idempotency/replay protection and add reliability tests.
2. Add negative-path E2E tests (forbidden edit/share, malformed ids, auth failures).
3. Add CI workflow gates for lint/test/build/e2e.
4. Expand service-level tests around RBAC edge cases and concurrent updates.

## Known Issues / Edge Cases
- Existing pre-Flyway local DB volumes may require `docker compose down -v` before first migration-managed boot.
- Consumer-side idempotency for domain events is not implemented yet.
- E2E currently validates only the happy path (single smoke flow).

## Next 3 Actions
- [ ] Implement idempotent Kafka consumer strategy (dedupe key/store + retry semantics).
- [ ] Add at least 3 negative E2E scenarios for permissions and invalid ids.
- [ ] Wire CI jobs to enforce lint + unit/integration + E2E on PRs.
