# RelayDocs

Collaborative document management platform with a React frontend, Node API gateway, and Spring Boot microservices.

## Workspace Layout

- `apps/web`: React + TypeScript + Vite + Tailwind
- `apps/gateway`: Node.js API gateway (TypeScript + Zod), auth + REST aggregation
- `services/document-service`: Spring Boot + JPA document microservice
- `services/document-service/src/main/resources/db/migration`: Flyway SQL migrations
- `e2e`: Playwright end-to-end tests

## Prerequisites

- Node.js >= 20
- npm (bundled with Node)
- Java >= 17
- Maven >= 3.9
- Docker

## Quick Start

1. Install JavaScript dependencies:
   - `npm install`
2. Create local env files (first time only):
   - `Copy-Item .env.example .env`
   - `Copy-Item apps/gateway/.env.example apps/gateway/.env`
   - `Copy-Item apps/web/.env.example apps/web/.env`
3. Start full stack:
   - `docker compose up --build -d`
4. Open the app:
   - `http://localhost:5173`
5. Check health:
   - `http://localhost:8080/health` (gateway)
   - `http://localhost:8080/ready` (gateway readiness, checks document-service dependency)
   - `http://localhost:8081/health` (document-service)
   - `http://localhost:8081/ready` (document-service readiness, checks database)

## Live Edit Development

Use these commands in separate terminals for reliable local hot reload:

1. Start only required infrastructure:
   - `docker compose up -d postgres redpanda document-service`
2. Run gateway in watch mode:
   - `npm run dev:gateway`
3. Run web with Vite HMR:
   - `npm run dev:web`

Live edit mode intentionally uses non-compose ports to avoid collisions:
- Gateway: `http://localhost:8082`
- Web (Vite): `http://localhost:5174`

## Gateway API Baseline

All document routes require `Authorization: Bearer <token>`.

- `GET /health`
- `GET /ready`
- `GET /api/v1/documents`
- `POST /api/v1/documents`
- `GET /api/v1/documents/:id`
- `PATCH /api/v1/documents/:id`
- `POST /api/v1/documents/:id/share`

The gateway proxies these routes to the Spring `document-service` using `X-User-Id` headers.
Gateway and document-service also use `X-Request-Id` correlation headers for request tracing.

## Environment

- Web:
  - `VITE_GATEWAY_BASE_URL` (default: `http://localhost:8080`; docker image uses same-origin proxy)
- Gateway:
  - `DOCUMENT_SERVICE_BASE_URL` (default: `http://localhost:8081`)
  - `WEB_ORIGIN` (default: `http://localhost:5173`)
  - `TRUST_PROXY` (default: `false`; set `true` behind reverse proxies/load balancers)
  - `ALLOW_DEV_TOKENS` (default: `true`)
  - `JWT_SECRET` (required and must be strong in production; min 32 chars). Compose defaults this to a local-only dev value; override in real environments.
  - `REDIS_URL` (optional; enables distributed auth rate limiting and lockout state)
  - `AUTH_RATE_LIMIT_MAX` (default: `20` per window for auth routes)
  - `AUTH_RATE_LIMIT_WINDOW_MS` (default: `60000`)
  - `AUTH_LOCKOUT_THRESHOLD` (default: `5` failed logins in window)
  - `AUTH_LOCKOUT_WINDOW_MS` (default: `900000`)
  - `AUTH_LOCKOUT_DURATION_MS` (default: `900000`)
- Document service:
  - `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`
  - `KAFKA_BOOTSTRAP_SERVERS` (default: `localhost:9092`)
  - `RELAYDOCS_KAFKA_EVENTS_ENABLED` (default: `false`)
  - `RELAYDOCS_KAFKA_TOPIC` (default: `relaydocs.domain-events`)

## Database Migrations

- The document-service owns schema changes via Flyway versioned migrations.
- Initial schema is in `services/document-service/src/main/resources/db/migration/V1__init.sql`.
- Runtime is configured with `spring.jpa.hibernate.ddl-auto=validate` to avoid non-deterministic schema mutation.

## End-to-End Testing

1. Start the full stack:
   - `docker compose up --build -d`
2. Install Playwright browsers (first time only):
   - `npx playwright install`
3. Run E2E tests (smoke + negative paths):
   - `npm run test:e2e`

## Docker Recovery Notes

- If Docker Desktop is not running, compose commands will fail with named-pipe connection errors.
- If ports are already bound while switching runtime modes, stop compose `web` and `gateway` first:
  - `docker compose stop web gateway`
- If schema changes are not applying (especially Flyway auth migrations), reset volumes:
  - `docker compose down -v --remove-orphans`
- If Docker cache/snapshots become stale after repeated rebuilds, force a clean rebuild:
  - `docker compose build --no-cache`

## Session Handoff Automation

- Initialize handoff scaffolding (useful in new repos):
  - `npm run handoff:init`
- Generate a next-session prompt from current checkpoint files:
  - `npm run handoff:prompt`
- Output file:
  - `NEXT_SESSION_PROMPT.md`

Recommended session process:
1. Do work and verify changes with tests/builds.
2. Update checkpoint context (`PROJECT_STATE.md`, `DECISIONS.md`).
3. Run `npm run handoff:prompt`.
4. Use `NEXT_SESSION_PROMPT.md` as the exact bootstrap prompt in the next session.

## Deployment Workflows

- Staging workflow: `.github/workflows/deploy-staging.yml`
  - Runs after successful `CI` on `main` (or manually) when `STAGING_DEPLOY_ENABLED=true` GitHub variable is set.
  - Requires `STAGING_GATEWAY_URL` GitHub variable for `/ready` smoke checks.
- Production workflow: `.github/workflows/deploy-production.yml`
  - Manual dispatch workflow when `PROD_DEPLOY_ENABLED=true` GitHub variable is set.
  - Requires `PROD_GATEWAY_URL` GitHub variable for `/ready` smoke checks.
