$nodePath = "C:\Program Files\nodejs"
$npmPath = "$env:APPDATA\npm"
$env:PATH = "$nodePath;$npmPath;" + [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")

$ROOT = "M:\Hashibasha-shareable\Hashibasha-shareable"
Set-Location $ROOT

Write-Host "Starting all Hashibasha services..." -ForegroundColor Cyan
Write-Host "Frontend will be at: http://localhost:5173" -ForegroundColor Green
Write-Host "API Gateway at:      http://localhost:3009" -ForegroundColor Green
Write-Host ""

& "$npmPath\pnpm.cmd" run start:all
