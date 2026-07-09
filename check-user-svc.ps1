$nodePath = "C:\Program Files\nodejs"
$npmPath = "$env:APPDATA\npm"
$env:PATH = "$nodePath;$npmPath;" + [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
Set-Location "M:\Hashibasha-shareable\Hashibasha-shareable\server\user-service"

Write-Host "=== Checking TypeScript compilation for user-service ===" -ForegroundColor Cyan
& "$nodePath\npx.cmd" tsc --noEmit 2>&1 | Select-Object -First 40
Write-Host "DONE"
