# Azure App Service deployment guide (dev + production)

This project is a microservice architecture. Deploy **each service as its own Azure App Service**, and use **Supabase** as the shared database.

Code is now cloud-ready:
- Frontend uses `VITE_API_GATEWAY_URL`
- API Gateway uses `PORT` (Azure) with optional `GATEWAY_PORT`
- Backend services bind to `0.0.0.0` and use env-based inter-service URLs

## Recommended branches

| Branch | Azure usage |
|--------|-------------|
| `dev` | Development App Services / Staging slots |
| `main` or `production` | Production App Services |

Suggested App Service names:

### Dev
- `hashibasha-auth-dev`
- `hashibasha-user-dev`
- `hashibasha-org-dev`
- `hashibasha-location-dev`
- `hashibasha-permission-dev`
- `hashibasha-notification-dev`
- `hashibasha-language-dev`
- `hashibasha-gateway-dev`
- `hashibasha-client-dev`

### Production
- `hashibasha-auth-prod`
- `hashibasha-user-prod`
- `hashibasha-org-prod`
- `hashibasha-location-prod`
- `hashibasha-permission-prod`
- `hashibasha-notification-prod`
- `hashibasha-language-prod`
- `hashibasha-gateway-prod`
- `hashibasha-client-prod`

## Service roots and startup

| Service | Root folder | Startup command |
|---------|-------------|-----------------|
| auth | `server/auth-service` | `npm install && npm run build && npm run start:prod` |
| user | `server/user-service` | `npm install && npm run build && npm run start:prod` |
| org | `server/org-service` | `npm install && npm run build && npm run start:prod` |
| location | `server/location-service` | `npm install && npm run build && npm run start:prod` |
| permission | `server/permission-service` | `npm install && npm run build && npm run start:prod` |
| notification | `server/notification-service` | `npm install && npm run build && npm run start:prod` |
| language | `server/language-service` | `npm install && npm run build && npm run start:prod` |
| api-gateway | `server/api-gateway` | `npm install && npm start` |
| client | `client` | `npm install && npm run build && npx vite preview --host 0.0.0.0 --port $PORT` |

For Azure App Service Linux, set **Startup Command** to the command above, or configure Deployment Center with the repo root and use the startup command with `cd <folder> && ...`.

## Common env vars (every backend service)

```env
DATABASE_URL=postgresql://postgres.<ref>:<URL_ENCODED_PASSWORD>@aws-1-<region>.pooler.supabase.com:5432/postgres
DB_SSL=true
JWT_SECRET=<same-secret-in-all-services>
PORT=8080
```

Azure injects `PORT`. Your Nest services already read `process.env.PORT`.

## Schema per service

| Service | DB_SCHEMA |
|---------|-----------|
| auth | `hashibasha_auth` |
| user | `hashibasha_user` |
| org | `hashibasha_org` |
| location | `hashibasha_location` |
| permission | `hashibasha_permission` |
| notification | `hashibasha_notification` |
| language | `hashibasha_language` |

## Inter-service URLs (example production)

Set on each service that calls others:

```env
AUTH_SERVICE_URL=https://hashibasha-auth-prod.azurewebsites.net
USER_SERVICE_URL=https://hashibasha-user-prod.azurewebsites.net
ORG_SERVICE_URL=https://hashibasha-org-prod.azurewebsites.net
LOCATION_SERVICE_URL=https://hashibasha-location-prod.azurewebsites.net
LANGUAGE_SERVICE_URL=https://hashibasha-language-prod.azurewebsites.net
NOTIFICATION_SERVICE_URL=https://hashibasha-notification-prod.azurewebsites.net
PERMISSION_SERVICE_URL=https://hashibasha-permission-prod.azurewebsites.net
```

### API Gateway must have all of the above plus:

```env
PORT=8080
# optional local-style override still supported:
# GATEWAY_PORT=8080
```

### Client build-time env

```env
VITE_API_GATEWAY_URL=https://hashibasha-gateway-prod.azurewebsites.net
```

For Azure App Service client builds, set this as an **Application Setting** and ensure the build runs after it is available (Vite reads it at build time).

## Deploy order

1. auth
2. user
3. org
4. location
5. permission
6. notification
7. language
8. api-gateway
9. client

## Branch workflow

1. Develop and test on `dev` branch → deploy to `*-dev` App Services
2. Merge `dev` → `main`/`production`
3. Production App Services auto-deploy from `main`/`production`

## Notes on free Azure

Azure free credits can host this temporarily. Long-term hosting of 9 App Services is usually not free. Keep Supabase as the DB either way.
