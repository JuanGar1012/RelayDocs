# RelayDocs

Collaborative document management platform with a React frontend, Node API gateway, and Spring Boot microservices.

## Workspace Layout

- `apps/web`: React + TypeScript + Vite + Tailwind
- `apps/gateway`: Node.js API gateway (TypeScript + Zod), auth + REST aggregation
- `services/document-service`: Spring Boot + JPA document microservice
- `infra/sql`: PostgreSQL schema scripts

## Prerequisites

- Node.js >= 20
- npm (bundled with Node)
- Java >= 17
- Maven >= 3.9
- Docker

## Quick Start

1. Install JavaScript dependencies:
   - `npm install`
2. Start infrastructure:
   - `docker compose up -d`
3. Run Spring Boot service:
   - `cd services/document-service`
   - `mvn spring-boot:run`
4. Start gateway:
   - `npm run dev:gateway`
5. Start frontend:
   - `npm run dev:web`

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
  - `VITE_GATEWAY_BASE_URL` (default: `http://localhost:8080`)
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