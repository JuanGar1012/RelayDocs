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
2. Start full stack:
   - `docker compose up --build -d`
3. Open the app:
   - `http://localhost:5173`
4. Check health:
   - `http://localhost:8080/health` (gateway)
   - `http://localhost:8081/health` (document-service)

## Gateway API Baseline

All document routes require `Authorization: Bearer <token>`.

- `GET /health`
- `GET /api/v1/documents`
- `POST /api/v1/documents`
- `GET /api/v1/documents/:id`
- `PATCH /api/v1/documents/:id`
- `POST /api/v1/documents/:id/share`

The gateway proxies these routes to the Spring `document-service` using `X-User-Id` headers.

## Environment

- Web:
  - `VITE_GATEWAY_BASE_URL` (default: `http://localhost:8080`; docker image uses same-origin proxy)
  - `VITE_DEV_TOKEN` (default: `dev-token-u1`)
- Gateway:
  - `DOCUMENT_SERVICE_BASE_URL` (default: `http://localhost:8081`)
  - `WEB_ORIGIN` (default: `http://localhost:5173`)
  - `ALLOW_DEV_TOKENS` (default: `true`)
  - `JWT_SECRET` (required when `ALLOW_DEV_TOKENS=false`)
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
3. Run smoke E2E tests:
   - `npm run test:e2e`
