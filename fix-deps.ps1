$nodePath = "C:\Program Files\nodejs"
$npmPath = "$env:APPDATA\npm"
$env:PATH = "$nodePath;$npmPath;" + [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
Set-Location "M:\Hashibasha-shareable\Hashibasha-shareable"

Write-Host "=== Cleaning up ===" -ForegroundColor Cyan
Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
Remove-Item -Force "pnpm-lock.yaml" -ErrorAction SilentlyContinue

Write-Host "=== Installing with node-linker=hoisted ===" -ForegroundColor Cyan
& "$npmPath\pnpm.cmd" install --no-frozen-lockfile

Write-Host ""
Write-Host "Checking date-fns..." -ForegroundColor Yellow
if (Test-Path "node_modules\date-fns") {
    Write-Host "date-fns OK" -ForegroundColor Green
} else {
    Write-Host "date-fns MISSING - trying npm install as fallback" -ForegroundColor Red
    & "$nodePath\npm.cmd" install
}

Write-Host "INSTALL_DONE" -ForegroundColor Green
