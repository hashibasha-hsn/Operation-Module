$nodePath = "C:\Program Files\nodejs"
$npmPath = "$env:APPDATA\npm"
$env:PATH = "$nodePath;$npmPath;" + [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
Set-Location "M:\Hashibasha-shareable\Hashibasha-shareable\server\user-service"

$env:DB_HOST = "localhost"; $env:DB_PORT = "5432"
$env:DB_USER = "postgres"; $env:DB_PASSWORD = "postgres"

Write-Host "=== Building user-service ===" -ForegroundColor Cyan
& "$nodePath\npx.cmd" nest build 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "BUILD FAILED"; exit 1 }

Write-Host "=== Starting user-service ===" -ForegroundColor Green
& "$nodePath\node.exe" dist/main.js
