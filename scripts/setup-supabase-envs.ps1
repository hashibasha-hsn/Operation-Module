param(
  [Parameter(Mandatory = $true)]
  [string]$SupabasePassword,

  [string]$ProjectRef = "nwwcoukuvyqnbxulvqcl",
  [string]$PoolerHost = "aws-0-ap-southeast-1.pooler.supabase.com",
  [string]$DbPort = "6543",
  [string]$SupabaseUrl = "https://nwwcoukuvyqnbxulvqcl.supabase.co",
  [string]$SupabasePublishableKey = "",
  [string]$SupabaseSecretKey = "",
  [string]$SupabaseJwksUrl = "https://nwwcoukuvyqnbxulvqcl.supabase.co/auth/v1/.well-known/jwks.json",
  [string]$JwtSecret = "change-me-local-dev-secret",
  [string]$GatewayPort = "3009"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$encodedPassword = [System.Uri]::EscapeDataString($SupabasePassword)
$dbHost = $PoolerHost
$dbUser = "postgres.$ProjectRef"
$databaseUrl = "postgresql://${dbUser}:$encodedPassword@${dbHost}:${DbPort}/postgres"

$sharedEnv = @"
SUPABASE_URL=$SupabaseUrl
SUPABASE_PUBLISHABLE_KEY=$SupabasePublishableKey
SUPABASE_SECRET_KEY=$SupabaseSecretKey
SUPABASE_JWKS_URL=$SupabaseJwksUrl
DATABASE_URL=$databaseUrl
DB_HOST=$dbHost
DB_PORT=$DbPort
DB_USER=$dbUser
DB_PASSWORD=$SupabasePassword
DB_NAME=postgres
DB_SSL=true
JWT_SECRET=$JwtSecret
"@

# Four backends only:
# - user-service hosts auth + permission + notification schemas
# - org-service hosts location + language schemas
# - audit-log-service hosts audit logs
# - api-gateway proxies to the three Nest apps

$userEnv = @"
$sharedEnv
DB_SCHEMA=hashibasha_user
AUTH_DB_SCHEMA=hashibasha_auth
USER_DB_SCHEMA=hashibasha_user
PERMISSION_DB_SCHEMA=hashibasha_permission
NOTIFICATION_DB_SCHEMA=hashibasha_notification
PORT=3002
"@
$userPath = Join-Path $root "server\user-service\.env"
Set-Content -Path $userPath -Value $userEnv -Encoding UTF8
Write-Host "Wrote $userPath"

$orgEnv = @"
$sharedEnv
DB_SCHEMA=hashibasha_org
ORG_DB_SCHEMA=hashibasha_org
LOCATION_DB_SCHEMA=hashibasha_location
LANGUAGE_DB_SCHEMA=hashibasha_language
PORT=3012
"@
$orgPath = Join-Path $root "server\org-service\.env"
Set-Content -Path $orgPath -Value $orgEnv -Encoding UTF8
Write-Host "Wrote $orgPath"

$auditEnv = @"
$sharedEnv
DB_SCHEMA=hashibasha_org
PORT=3015
"@
$auditPath = Join-Path $root "server\audit-log-service\.env"
Set-Content -Path $auditPath -Value $auditEnv -Encoding UTF8
Write-Host "Wrote $auditPath"

$gatewayEnv = @"
GATEWAY_PORT=$GatewayPort
USER_SERVICE_URL=http://localhost:3002
ORG_SERVICE_URL=http://localhost:3012
AUDIT_LOG_SERVICE_URL=http://localhost:3015
"@
$gatewayPath = Join-Path $root "server\api-gateway\.env"
Set-Content -Path $gatewayPath -Value $gatewayEnv -Encoding UTF8
Write-Host "Wrote $gatewayPath"

Write-Host ""
Write-Host "Supabase env files created for the four backends (user, org, audit-log, api-gateway)."
Write-Host "Next steps:"
Write-Host "1. Run server/database/supabase-schemas.sql in Supabase SQL Editor (new project)"
Write-Host "2. npm run start:all"
Write-Host "3. npm run seed:admin (if needed)"
