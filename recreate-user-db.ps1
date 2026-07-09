$nodePath = "C:\Program Files\nodejs"
$npmPath = "$env:APPDATA\npm"
$pgBin = (Get-ChildItem "C:\Program Files\PostgreSQL" -Directory | Sort-Object Name -Descending | Select-Object -First 1).FullName + "\bin"
$env:PATH = "$nodePath;$npmPath;$pgBin;" + [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
$env:PGPASSWORD = "postgres"

Write-Host "=== Recreating hashibasha_user DB ===" -ForegroundColor Cyan
& "$pgBin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS hashibasha_user;" 2>&1
& "$pgBin\psql.exe" -U postgres -c "CREATE DATABASE hashibasha_user;" 2>&1
Write-Host "DB recreated - TypeORM will sync schema on next start" -ForegroundColor Green

Write-Host "=== Building & starting user-service (TypeORM will auto-create tables) ===" -ForegroundColor Cyan
Set-Location "M:\Hashibasha-shareable\Hashibasha-shareable\server\user-service"
$env:DB_HOST = "localhost"; $env:DB_PORT = "5432"
$env:DB_USER = "postgres"; $env:DB_PASSWORD = "postgres"

& "$nodePath\npx.cmd" nest build 2>&1
Write-Host "Build done"
& "$nodePath\node.exe" dist/main.js
