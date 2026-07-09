$pgBin = (Get-ChildItem "C:\Program Files\PostgreSQL" -Directory | Sort-Object Name -Descending | Select-Object -First 1).FullName + "\bin"
$env:PGPASSWORD = "postgres"

$dbs = @("hashibasha_org","hashibasha_notification","hashibasha_permission","hashibasha_location","hashibasha_language","hashibasha_auth")
foreach ($db in $dbs) {
    Write-Host "Recreating $db..." -ForegroundColor Yellow
    & "$pgBin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS `"$db`";"
    & "$pgBin\psql.exe" -U postgres -c "CREATE DATABASE `"$db`";"
    Write-Host "  Done: $db" -ForegroundColor Green
}
Write-Host "ALL DONE" -ForegroundColor Green
