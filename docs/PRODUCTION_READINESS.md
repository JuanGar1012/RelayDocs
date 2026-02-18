# Production Readiness Checklist

This checklist defines the minimum bar to operate RelayDocs as a production service.

## Security
- Manage secrets via environment or secret manager; no plaintext secrets in repo or logs.
- Enforce short-lived access tokens and refresh token rotation.
- Add gateway rate limiting and brute-force protection for auth endpoints.
- Run dependency and container vulnerability scans in CI.
- Generate and store SBOMs for build artifacts.

## Auth and Authorization
- Enforce server-side RBAC checks on all document and permission routes.
- Add audit logging for sign-in, document sharing, and permission changes.
- Add account recovery and session revocation flow.
- Verify tenant/user scoping on every data access path.

## Reliability
- Define liveness/readiness probes for gateway and document service.
- Implement retry with bounded backoff and circuit-breaker behavior for downstream calls.
- Keep idempotent Kafka consumers and DLQ strategy for poison messages.
- Add graceful shutdown and in-flight request draining.

## Observability
- Centralize structured logs with correlation IDs.
- Publish service metrics (latency, error rate, throughput, saturation).
- Add distributed traces for web -> gateway -> service calls.
- Define SLOs and alert thresholds.

## Data and Operations
- Maintain migration safety policy (forward-only, reversible plans where possible).
- Set backup and restore drills for PostgreSQL.
- Validate index usage for RBAC and document access query paths.
- Define retention and archival policy.

## Delivery and Governance
- Enforce branch protections and required status checks.
- Use preview environments for pull requests.
- Add progressive delivery (blue/green or canary) for low-risk rollouts.
- Add runbooks for top failure modes and recovery steps.
