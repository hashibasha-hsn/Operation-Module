$nodePath = "C:\Program Files\nodejs"
$npmPath = "$env:APPDATA\npm"
$pgBin = (Get-ChildItem "C:\Program Files\PostgreSQL" -Directory | Sort-Object Name -Descending | Select-Object -First 1).FullName + "\bin"
$env:PATH = "$nodePath;$npmPath;$pgBin;" + [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
$env:PGPASSWORD = "postgres"

$ROOT = "M:\Hashibasha-shareable\Hashibasha-shareable"
Set-Location $ROOT

Write-Host "`n=== Setting postgres password ===" -ForegroundColor Cyan
& "$pgBin\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD 'postgres';" 2>&1

Write-Host "`n=== Running database setup ===" -ForegroundColor Cyan
& "$nodePath\node.exe" server/database/setup-all.cjs
if ($LASTEXITCODE -ne 0) {
    Write-Host "DB setup had errors, continuing..." -ForegroundColor Yellow
}

Write-Host "`nDB_SETUP_DONE" -ForegroundColor Green
