# Hashibasha — Local Setup Guide

This guide helps a new developer install PostgreSQL, create all databases, apply schemas, and seed the minimum data needed to run the app locally.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ (20 LTS recommended) |
| PostgreSQL | 14+ |
| npm | Comes with Node |

Install PostgreSQL and ensure the service is running before database setup.

---

## Quick start (recommended)

```powershell
# 1. Install root + service dependencies
npm install
npm install --prefix server/user-service
npm install --prefix server/org-service
npm install --prefix server/audit-log-service
npm install --prefix server/api-gateway

# 2. Configure database password (if not using default)
$env:DB_PASSWORD="your-postgres-password"

# 3. Create all databases, schemas, migrations, and module defaults
npm run setup:db

# Optional: also import translations + SA location Excel data
npm run setup:db:sample

# 4. Start all services + frontend + API gateway
npm run start:all

# 5. In a new terminal — create admin user (requires services running)
npm run seed:admin

# 6. Open the app
# http://localhost:3000/login
```

---

## One-command database setup

```powershell
npm run setup:db
```

This runs `server/database/setup-all.cjs`, which:

1. Verifies PostgreSQL connection
2. Creates **8 databases**:
   - `hashibasha_auth`
   - `hashibasha_user`
   - `hashibasha_org`
   - `hashibasha_notification`
   - `hashibasha_permission`
   - `hashibasha_location`
   - `hashibasha_language`
3. Applies base SQL schemas
4. Runs all migration scripts
5. Sets up tickets, reporting modules, audit logs, hybrid assignee tables

### Full setup with sample/reference data

```powershell
npm run setup:db:sample
```

Also imports:

- UI translations (English + Arabic)
- Saudi location data from `أحياء_مدن_السعودية_العنوان_الوطني.xlsx` (if present in project root)

---

## Environment variables

Set these **before** `npm run setup:db` if your PostgreSQL credentials differ:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` / `PGHOST` | `localhost` | PostgreSQL host |
| `DB_PORT` / `PGPORT` | `5432` | PostgreSQL port |
| `DB_USER` / `PGUSER` | `postgres` | PostgreSQL user |
| `DB_PASSWORD` / `PGPASSWORD` | `Rasika` | PostgreSQL password |

Example (PowerShell):

```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_USER="postgres"
$env:DB_PASSWORD="your-password"
npm run setup:db
```

Example (bash):

```bash
export DB_PASSWORD=your-password
npm run setup:db
```

---

## Admin user (required for login)

Database setup does **not** create a login user. After services are running, use one of:

### Option A — npm script (recommended)

```powershell
npm run seed:admin
```

Creates:

- **Email:** `admin@hashibasha.com`
- **Password:** `admin123`

### Option B — Admin setup page

1. Start services: `npm run start:all`
2. Open http://localhost:3000/admin-setup
3. Create your admin account and organization

### Option C — Reset admin password

```powershell
npm run reset:admin-password
```

---

## What gets seeded automatically

| Data | When | How |
|------|------|-----|
| System roles & permissions | Service startup | `user-service` `SeedService` |
| Auth / permission / notification tables | Service startup | `user-service` TypeORM sync |
| Ticket defaults | `setup:db` | Tags, categories, settings |
| Reporting sample rows | `setup:db` | Courses, assessments, dashboards |
| Audit log schema | `setup:db` | Table only; rows backfilled from existing data |
| Translations | `setup:db:sample` | EN/AR UI strings |
| SA locations | `setup:db:sample` | From Excel file in repo root |

---

## Running the application

```powershell
npm run start:all
```

| Component | URL |
|-----------|-----|
| Frontend | http://localhost:3000 |
| Login | http://localhost:3000/login |
| API Gateway | http://localhost:3009 |
| Gateway health | http://localhost:3009/health |
| Service status | http://localhost:3009/api/status |

### Services and ports

Four Nest backends + Vite. Auth, permission, and notification APIs are served by **user-service**. Location and language APIs are served by **org-service**.

| Service | Port | Databases / schemas |
|---------|------|---------------------|
| Frontend (Vite) | 3000 | — |
| API Gateway | 3009 | — |
| user-service | 3002 | `hashibasha_user`, `hashibasha_auth`, `hashibasha_permission`, `hashibasha_notification` |
| org-service | 3012 | `hashibasha_org`, `hashibasha_location`, `hashibasha_language` |
| audit-log-service | 3015 | audit logs (org DB / schema) |

---

## Individual setup scripts (advanced)

You can still run scripts separately if needed:

```powershell
node server/database/setup-databases.js      # legacy: 5 core DBs only
npm run setup:location-db
npm run setup:language-db
npm run setup:tickets
npm run setup:audit-logs
npm run setup:reporting-modules
npm run import:language-data
npm run import:location-data
npm run seed:admin
```

Prefer `npm run setup:db` for new installations.

---

## Troubleshooting

### `Database setup failed: connection refused`

- PostgreSQL is not running
- Wrong `DB_HOST` / `DB_PORT`

### `password authentication failed`

Set the correct password:

```powershell
$env:DB_PASSWORD="your-actual-password"
npm run setup:db
```

### `seed:admin` fails with connection error

Start all services first:

```powershell
npm run start:all
# wait ~30 seconds, then:
npm run seed:admin
```

### Login fails after seed

Reset password:

```powershell
npm run reset:admin-password
```

### Re-run setup on existing database

Scripts use `IF NOT EXISTS` / `ON CONFLICT DO NOTHING` where possible. Re-running `npm run setup:db` is generally safe for local dev.

To wipe all data and start fresh:

```powershell
node server/database/clear-all-data.js
npm run setup:db:sample
npm run start:all
npm run seed:admin
```

---

## Handoff checklist for new developers

- [ ] PostgreSQL installed and running
- [ ] `DB_PASSWORD` set (if not using default)
- [ ] `npm install` in root + all `server/*` services
- [ ] `npm run setup:db` or `npm run setup:db:sample`
- [ ] `npm run start:all`
- [ ] `npm run seed:admin` or `/admin-setup`
- [ ] Login at http://localhost:3000/login

---

## Production note

This guide is for **local development**. For production deployment, change default passwords, disable TypeORM `synchronize` on user-service/org-service, and use managed PostgreSQL with SSL. See deployment discussions in project documentation.
