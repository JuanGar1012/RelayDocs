# Deployment Secrets Mapping

This file defines the minimum GitHub environment variables/secrets and platform runtime secrets required to deploy RelayDocs today.

## GitHub Environment Variables

Set these as GitHub **Environment Variables**.

### `staging` environment
- `STAGING_DEPLOY_ENABLED=true`
- `STAGING_GATEWAY_URL=https://<staging-gateway-domain>`

### `production` environment
- `PROD_DEPLOY_ENABLED=true`
- `PROD_GATEWAY_URL=https://<prod-gateway-domain>`

## GitHub Environment Secrets

Set these as GitHub **Environment Secrets**.

### `staging` environment
- `STAGING_DOCUMENT_SERVICE_DEPLOY_HOOK_URL`
- `STAGING_GATEWAY_DEPLOY_HOOK_URL`
- `STAGING_WEB_DEPLOY_HOOK_URL`

### `production` environment
- `PROD_DOCUMENT_SERVICE_DEPLOY_HOOK_URL`
- `PROD_GATEWAY_DEPLOY_HOOK_URL`
- `PROD_WEB_DEPLOY_HOOK_URL`

Notes:
- Use provider deploy hooks (Render/Railway/etc.) that trigger a deploy for the target service.
- Do not store hook URLs in repo files; keep them in environment secrets only.

## Platform Runtime Secrets

Set these directly in your hosting platform secret manager for each service.

### Gateway
- `NODE_ENV=production`
- `PORT` (provider-specific)
- `DOCUMENT_SERVICE_BASE_URL`
- `WEB_ORIGIN`
- `JWT_SECRET` (strong secret, >= 32 chars)
- `REDIS_URL` (if using distributed lockout/rate-limit store)
- `ALLOW_DEV_TOKENS=false`
- `AUTH_RATE_LIMIT_MAX`
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_LOCKOUT_THRESHOLD`
- `AUTH_LOCKOUT_WINDOW_MS`
- `AUTH_LOCKOUT_DURATION_MS`

### Document Service
- `SERVER_PORT` (or default `8081`)
- `DATABASE_URL`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `KAFKA_BOOTSTRAP_SERVERS`
- `RELAYDOCS_KAFKA_EVENTS_ENABLED`
- `RELAYDOCS_KAFKA_CONSUMER_ENABLED`
- `RELAYDOCS_KAFKA_TOPIC`
- `RELAYDOCS_KAFKA_CONSUMER_GROUP_ID`
- `RELAYDOCS_KAFKA_CONSUMER_NAME`

### Web
- `VITE_GATEWAY_BASE_URL`

## Day-Of Deployment Checklist

1. Add all GitHub environment variables/secrets listed above.
2. Add all platform runtime secrets listed above.
3. Trigger staging deploy workflow and wait for `/ready` success.
4. Trigger production deploy workflow and wait for `/ready` success.
5. Run post-deploy smoke path: signup -> create doc -> share -> read.
