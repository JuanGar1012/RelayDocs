# Deployment Plan

This deployment plan is optimized for portfolio visibility while preserving production-aligned architecture.

## Target Topology
- Frontend (`apps/web`): Vercel or Netlify static deployment with CDN caching.
- API Gateway (`apps/gateway`): container deployment on Render/Fly/Railway.
- Document Service (`services/document-service`): container deployment on the same provider.
- PostgreSQL: managed instance (Neon/Supabase/RDS).
- Kafka/Redpanda: managed Kafka-compatible broker.
- DNS/TLS: custom domain with managed TLS.

## Environments
- `dev`: local Docker Compose and local test data.
- `staging`: cloud mirror for integration and E2E validation.
- `prod`: hardened runtime with least-privilege config.

## CI/CD Flow
- Trigger on push/PR to run lint, build, unit tests, service tests, and E2E gates.
- Build and scan containers for gateway and document service.
- On `main`, deploy staging first, run smoke checks, then deploy prod.
- Roll back automatically when smoke or health checks fail.

## Release Controls
- Required approvals for production deploy.
- Versioned migrations with deployment ordering: DB -> services -> frontend.
- Freeze window support for high-risk schema releases.

## Immediate Implementation Steps
1. Add environment-specific config templates and secrets mapping docs.
2. Add deployment workflows (staging/prod) in `.github/workflows`.
3. Add health-check endpoint verification in pipeline post-deploy jobs.
4. Add infrastructure documentation (or Terraform) for reproducibility.
