$nodePath = "C:\Program Files\nodejs"
$npmPath = "$env:APPDATA\npm"
$env:PATH = "$nodePath;$npmPath;" + [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
$env:DB_HOST = "localhost"; $env:DB_PORT = "5432"
$env:DB_USER = "postgres"; $env:DB_PASSWORD = "postgres"
$env:PGHOST = "localhost"; $env:PGPORT = "5432"
$env:PGUSER = "postgres"; $env:PGPASSWORD = "postgres"
$env:LANGUAGE_DB_NAME = "hashibasha_language"
Set-Location "M:\Hashibasha-shareable\Hashibasha-shareable"
Write-Host "Importing language data..." -ForegroundColor Cyan
& "$nodePath\node.exe" server/database/import-language-data.cjs
Write-Host "LANG_IMPORT_DONE" -ForegroundColor Green
