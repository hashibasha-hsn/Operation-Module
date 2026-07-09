# Creates a lightweight copy of this project for sharing (no node_modules, builds, logs, etc.).
#
# Usage:
#   .\scripts\create-shareable-copy.ps1
#   .\scripts\create-shareable-copy.ps1 -Destination "D:\Share\Hashibasha"
#   .\scripts\create-shareable-copy.ps1 -CreateZip

param(
    [string]$Destination = "",
    [switch]$CreateZip
)

$ErrorActionPreference = "Stop"
$Source = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

if (-not $Destination) {
    $parent = Split-Path -Parent $Source
    $folderName = (Split-Path -Leaf $Source) -replace " - Copy.*$", ""
    if ($folderName -eq (Split-Path -Leaf $Source)) {
        $folderName = "$folderName-shareable"
    } else {
        $folderName = "Hashibasha-shareable"
    }
    $Destination = Join-Path $parent $folderName
}

Write-Host "Creating shareable copy..." -ForegroundColor Cyan
Write-Host "  From: $Source"
Write-Host "  To:   $Destination`n"

if (Test-Path $Destination) {
    Write-Host "Removing existing destination folder..." -ForegroundColor Yellow
    Remove-Item -LiteralPath $Destination -Recurse -Force
}

New-Item -ItemType Directory -Path $Destination -Force | Out-Null

# robocopy exit codes 0-7 mean success (with or without copied files)
$excludeDirs = @(
    "node_modules",
    "dist",
    "build",
    ".git",
    ".vs",
    ".pnpm-store",
    ".webdev",
    ".manus-logs",
    "coverage",
    "uploads",
    "tmp",
    "temp",
    ".cache",
    ".parcel-cache",
    ".next",
    ".nuxt"
)

$excludeFiles = @(
    "*.log",
    "*.db",
    "*.sqlite",
    "*.sqlite3",
    "Thumbs.db",
    ".DS_Store",
    "test-admin-setup.json",
    "*.xlsx",
    "kafka_*.tgz",
    "image.png"
)

$robocopyArgs = @(
    $Source,
    $Destination,
    "/E",
    "/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS",
    "/XD"
) + $excludeDirs + @("/XF") + $excludeFiles

& robocopy @robocopyArgs | Out-Null
$rc = $LASTEXITCODE
if ($rc -ge 8) {
    throw "robocopy failed with exit code $rc"
}

# Ensure setup docs are present in the copy
$setupSrc = Join-Path $Source "LOCAL_SETUP.md"
$setupDst = Join-Path $Destination "LOCAL_SETUP.md"
if (Test-Path $setupSrc) {
    Copy-Item -LiteralPath $setupSrc -Destination $setupDst -Force
}

$envExampleSrc = Join-Path $Source ".env.example"
$envExampleDst = Join-Path $Destination ".env.example"
if (Test-Path $envExampleSrc) {
    Copy-Item -LiteralPath $envExampleSrc -Destination $envExampleDst -Force
}

# Size report
$sizeBytes = (Get-ChildItem -LiteralPath $Destination -Recurse -File -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($sizeBytes / 1MB, 2)

Write-Host "Shareable folder ready ($sizeMB MB)" -ForegroundColor Green
Write-Host "  $Destination"

if ($CreateZip) {
    $zipPath = "$Destination.zip"
    if (Test-Path $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
    Compress-Archive -LiteralPath $Destination -DestinationPath $zipPath -CompressionLevel Optimal
    $zipMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Host "Zip created ($zipMB MB): $zipPath" -ForegroundColor Green
}

Write-Host "`nShare this folder (or zip) with your teammate. They should open LOCAL_SETUP.md first." -ForegroundColor Cyan
