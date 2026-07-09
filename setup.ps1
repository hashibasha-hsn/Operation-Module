$nodePath = "C:\Program Files\nodejs"
$npmPath = "$env:APPDATA\npm"
$env:PATH = "$nodePath;$npmPath;" + [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")

$ROOT = "M:\Hashibasha-shareable\Hashibasha-shareable"
Set-Location $ROOT

Write-Host "`n=== Step 1: Installing root dependencies with pnpm ===" -ForegroundColor Cyan
& "$npmPath\pnpm.cmd" install
Write-Host "ROOT_INSTALL_DONE"

Write-Host "`n=== Step 2: Installing microservice dependencies ===" -ForegroundColor Cyan
$services = @(
    "server\api-gateway",
    "server\auth-service",
    "server\user-service",
    "server\org-service",
    "server\permission-service",
    "server\location-service",
    "server\language-service",
    "server\notification-service"
)
foreach ($svc in $services) {
    Write-Host "`n-- Installing $svc --" -ForegroundColor Yellow
    Set-Location "$ROOT\$svc"
    & "$nodePath\npm.cmd" install
}

Set-Location $ROOT
Write-Host "`nALL_DEPS_DONE" -ForegroundColor Green
