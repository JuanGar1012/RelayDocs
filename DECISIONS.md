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
