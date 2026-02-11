# PROJECT_STATE

## Goal
- Deliver a production-style collaborative document management platform (RelayDocs) with deterministic behavior, strict typing, validated API boundaries, server-enforced authorization, and interview-ready engineering quality.

## Non-Goals
- Large refactors not explicitly requested.
- Relaxing strict typing, RBAC, or validation guarantees.
- Adding secrets to source code or logs.

## Current Architecture
- Frontend: `apps/web` (React + TypeScript + Vite + Tailwind, Router, TanStack Query).
- API Gateway: `apps/gateway` (Node.js + TypeScript + Zod, JWT/dev-token auth, REST aggregation/proxy).
- Microservice: `services/document-service` (Spring Boot MVC + JPA/Hibernate + Bean Validation).
- Database: PostgreSQL schema/scripts in `infra/sql`.
- Events: Kafka-compatible broker (Redpanda via Docker), domain events planned/used for document and permission changes.

## Data Model (Current/Planned Core)
- `users`
- `documents` (owner, title, content/body, timestamps)
- sharing/RBAC join structure for per-document permissions (reader/editor/owner semantics)
- event payloads for `document.created`, `document.updated`, `document.shared`, `permission.changed`

## Key Commands
- Install deps: `npm install`
- Infra up: `docker compose up -d`
- Frontend dev: `npm run dev:web`
- Gateway dev: `npm run dev:gateway`
- Workspace build: `npm run build`
- Workspace test: `npm test`
- Workspace lint: `npm run lint`
- Spring service dev: `cd services/document-service && mvn spring-boot:run`

## Files Created/Modified (This Checkpoint)
- `PROJECT_STATE.md`: canonical concise state snapshot.
- `CHECKPOINTS/PROJECT_STATE_2026-02-11_1333.md`: timestamped snapshot copy.
- `DECISIONS.md`: appended dated decision log entry for checkpointing baseline.

## Completed
- Monorepo scaffold established (`apps/*`, `services/*`, `infra/*`).
- Root workspace scripts configured for web/gateway/build/test/lint/format.
- Baseline service boundaries and gateway document route contract documented.
- Checkpoint artifacts created and synchronized.

## Open Tasks (Prioritized)
1. Finalize and verify PostgreSQL schema + migration path for documents and RBAC join tables.
2. Implement/verify strict gateway request/response validation and authz forwarding rules.
3. Complete Spring document-service endpoints with validation, JPA mappings, and deterministic error handling.
4. Implement event publication/consumption with idempotency guarantees.
5. Add/expand automated tests across frontend, gateway, service, and E2E paths.

## Known Issues / Edge Cases
- No git metadata available from current working directory context (`git status` unavailable).
- Kafka event toggles and idempotency behavior require explicit runtime verification.
- RBAC edge cases (owner transfer, duplicate shares, stale permission cache) need explicit test coverage.

## Next 3 Actions
- [ ] Validate DB schema and indexes against required RBAC/document access queries.
- [ ] Add/verify gateway Zod schemas and authorization checks at all document endpoints.
- [ ] Add service and gateway integration tests for share/update permission edge cases.
