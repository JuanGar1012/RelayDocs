# Production Readiness Checklist

Status date: 2026-02-18
Legend: `DONE` = implemented, `PARTIAL` = baseline in place, `PENDING` = not implemented yet.

## Deploy Today Gate

These are the minimum controls to safely deploy today.

- [x] `DONE` CI green on latest main commit.
- [x] `DONE` Gateway auth hardening (rate limit + lockout) active.
- [x] `DONE` Health and readiness endpoints for gateway and document-service.
- [x] `DONE` Request correlation IDs and structured request logs.
- [ ] `PENDING` Real provider deploy commands in GitHub deploy workflows.
- [ ] `PENDING` Production secrets configured in platform secret manager.

Go/No-Go rule for today:
- `GO` when both pending deploy gate items above are complete.

## Security

- [ ] `PENDING` Secret manager integration (no secrets in repo/runtime logs).
- [ ] `PENDING` JWT refresh token rotation and session revocation strategy.
- [x] `DONE` Gateway rate limiting and brute-force lockout on auth routes.
- [ ] `PENDING` Dependency and container vulnerability scans in CI.
- [ ] `PENDING` SBOM generation and artifact attestation/signing.
- [ ] `PENDING` WAF/CDN protections for internet-facing traffic.

## Auth and Authorization

- [x] `DONE` Server-side RBAC checks on document and permission routes.
- [ ] `PENDING` Audit logs for sign-in, sharing, and permission changes.
- [ ] `PENDING` Account recovery and forced session revocation flows.
- [x] `DONE` User scoping enforced on current data access paths.
- [ ] `PENDING` Tenant boundary model (if multi-tenant deployment is planned).

## Reliability

- [x] `DONE` Liveness/readiness probes in gateway and document-service.
- [ ] `PENDING` Retry/backoff and circuit-breaker policy for downstream calls.
- [ ] `PARTIAL` Kafka idempotency present; DLQ handling still pending.
- [ ] `PENDING` Graceful shutdown + in-flight request draining policy.

## Observability

- [x] `DONE` Correlation IDs + structured request logs.
- [ ] `PENDING` Metrics export (latency/error/saturation) and dashboards.
- [ ] `PENDING` Distributed tracing across web -> gateway -> service.
- [ ] `PENDING` SLO targets and alert thresholds.

## Data and Operations

- [x] `DONE` Flyway migration discipline with deterministic schema validation.
- [ ] `PENDING` Automated PostgreSQL backups + restore drill runbook.
- [ ] `PENDING` Query/index review for production load patterns.
- [ ] `PENDING` Data retention and archival policy.

## Delivery and Governance

- [x] `DONE` Branch/PR checks and CI quality gates.
- [ ] `PENDING` Preview environments per PR.
- [ ] `PENDING` Progressive delivery (blue/green or canary).
- [ ] `PENDING` Incident and recovery runbooks.
- [ ] `PARTIAL` Deploy workflow scaffolds exist; provider-specific deploy commands still pending.

## Priority Execution Order (Post-Deploy)

1. Complete provider-specific deploy steps in `.github/workflows/deploy-staging.yml` and `.github/workflows/deploy-production.yml`.
2. Add secret manager wiring and remove any dev defaults from production runtime config.
3. Add security scanning in CI (dependency + container + SBOM).
4. Add metrics/tracing stack and baseline alerts.
5. Add backup/restore and incident runbooks.
