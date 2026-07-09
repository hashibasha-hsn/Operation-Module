# Install all project dependencies (root + every backend microservice).
# Run from the project root: .\scripts\install-all.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "Hashibasha — installing dependencies" -ForegroundColor Cyan
Write-Host "Root: $Root`n"

function Install-PackageManager {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        Write-Host "[root] pnpm install" -ForegroundColor Green
        pnpm install
        return
    }
    Write-Host "[root] pnpm not found — using npm install" -ForegroundColor Yellow
    npm install
}

Install-PackageManager

$services = @(
    "server/api-gateway",
    "server/auth-service",
    "server/user-service",
    "server/notification-service",
    "server/org-service",
    "server/permission-service",
    "server/location-service",
    "server/language-service"
)

foreach ($service in $services) {
    $path = Join-Path $Root $service
    if (-not (Test-Path (Join-Path $path "package.json"))) {
        Write-Host "Skipping missing: $service" -ForegroundColor DarkGray
        continue
    }
    Write-Host "`n[$service] npm install" -ForegroundColor Green
    Push-Location $path
    npm install
    Pop-Location
}

Write-Host "`nDone. Next: see LOCAL_SETUP.md (database setup + start commands)." -ForegroundColor Cyan
