# Hashibasha — Local Setup Guide

Use this guide to run the project on a new machine. The shareable folder is **source code only** — you install packages and create databases locally.

## Requirements

| Tool | Version |
|------|---------|
| **Node.js** | 18 or newer ([nodejs.org](https://nodejs.org)) |
| **PostgreSQL** | 14+ running locally |
| **npm** | Comes with Node.js |
| **pnpm** (recommended) | Optional — used for the frontend root install |

---

## Quick start (Windows PowerShell)

Open PowerShell in the project folder and run these steps in order.

### 1. Install packages

```powershell
.\scripts\install-all.ps1
```

Or manually:

```powershell
pnpm install          # or: npm install
npm install --prefix server/api-gateway
npm install --prefix server/auth-service
npm install --prefix server/user-service
npm install --prefix server/notification-service
npm install --prefix server/org-service
npm install --prefix server/permission-service
npm install --prefix server/location-service
npm install --prefix server/language-service
```

### 2. Configure environment

```powershell
Copy-Item .env.example .env
# Edit .env — set DB_PASSWORD and ADMIN_PASSWORD at minimum
```

Set the PostgreSQL password for the current session (required for DB scripts):

```powershell
$env:DB_PASSWORD = "your_postgres_password"
```

### 3. Create databases and schema

**Basic setup** (schemas + migrations, no translation/location imports):

```powershell
npm run setup:db
```

**Full setup with sample data** (includes UI translations EN/AR):

```powershell
npm run setup:db:sample
```

This creates these PostgreSQL databases:

- `hashibasha_auth`, `hashibasha_user`, `hashibasha_org`
- `hashibasha_notification`, `hashibasha_permission`
- `hashibasha_location`, `hashibasha_language`

### 4. Start all services

```powershell
npm run start:all
```

This starts the API gateway, all microservices, and the Vite frontend.

| Service | URL |
|---------|-----|
| **Web app** | http://localhost:3000 |
| **API gateway** | http://localhost:3009 |

### 5. Create admin user

**Option A — script** (services must be running):

```powershell
$env:ADMIN_PASSWORD = "YourSecurePassword123"
npm run seed:admin
```

**Option B — browser**

Open http://localhost:3000/admin-setup and complete the setup form.

### 6. Log in

Go to http://localhost:3000/login using the admin email and password from `.env`.

---

## Useful commands

| Command | Description |
|---------|-------------|
| `npm run start:all` | Start frontend + all backend services |
| `npm run setup:db` | Create DBs and apply schemas |
| `npm run setup:db:sample` | Same + import translation sample data |
| `npm run seed:admin` | Create admin user via API |
| `npm run reset:admin-password` | Reset admin password |
| `npm run dev` | Frontend only (Vite) |

---

## Troubleshooting

**PostgreSQL connection failed**

- Confirm PostgreSQL is running.
- Set `$env:DB_PASSWORD` before running setup scripts.
- Check `DB_HOST`, `DB_PORT`, and `DB_USER` in `.env`.

**Port already in use**

- Stop other apps using ports 3000–3014 and 3009, or change service ports in `.env`.

**`seed:admin` fails**

- Run `npm run start:all` first and wait until all services are up.
- Ensure `ADMIN_PASSWORD` is set.

**Optional SA location Excel import**

- Place `أحياء_مدن_السعودية_العنوان_الوطني.xlsx` in the project root and run `npm run setup:db:sample`.

---

## Project structure

```
client/                 React frontend (Vite)
server/
  api-gateway/          Single entry point (port 3009)
  auth-service/         Authentication (3003)
  user-service/         Users & roles (3002)
  org-service/          Organizations, processes, audits (3012)
  permission-service/   Permissions (3005)
  notification-service/ Notifications (3004)
  location-service/     SA locations (3013)
  language-service/     Translations (3014)
  database/             SQL schemas and setup scripts
```
