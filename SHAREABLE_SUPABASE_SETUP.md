# Shareable Supabase Setup

This folder is a shareable copy of the project for another developer.

It does **not** include:
- `.git`
- `node_modules`
- `dist`
- real `.env` files or database passwords

## What the next developer needs

- Node.js 18+
- npm
- The Supabase database password from you

## Folder to use

Open this folder:

`C:\Rasika\operation Module Project\Operation-Module-shareable`

## Step 1: Install dependencies

Run these commands in PowerShell from the project root:

```powershell
npm install
npm install --prefix server/api-gateway
npm install --prefix server/user-service
npm install --prefix server/org-service
npm install --prefix server/audit-log-service
```

## Step 2: Generate Supabase `.env` files

Run:

```powershell
.\scripts\setup-supabase-envs.ps1 -SupabasePassword "PASTE_THE_SUPABASE_PASSWORD_HERE"
```

This writes `.env` files into:
- `server/user-service` (auth + permission + notification schemas)
- `server/org-service` (location + language schemas)
- `server/audit-log-service`
- `server/api-gateway`

The script is already configured for:
- Supabase session pooler host: `aws-0-ap-southeast-1.pooler.supabase.com`
- Database: `postgres`
- User: `postgres.nwwcoukuvyqnbxulvqcl`
- Schemas:
  - `hashibasha_auth`
  - `hashibasha_user`
  - `hashibasha_org`
  - `hashibasha_notification`
  - `hashibasha_permission`
  - `hashibasha_location`
  - `hashibasha_language`

## Step 3: Start the project

```powershell
npm run start:all
```

## Step 4: Login/setup

If admin is not created yet:

```powershell
npm run reset:auth-user
```

Then open:

- App: [http://localhost:3000](http://localhost:3000)
- Admin setup: [http://localhost:3000/admin-setup](http://localhost:3000/admin-setup)

## Notes

- Do not commit the generated `.env` files.
- The shareable copy uses Supabase directly; it does not require a local PostgreSQL database.
- If Saudi location data needs re-importing, use:

```powershell
npm run import:all-location-data
```
