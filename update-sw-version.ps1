#!/usr/bin/env pwsh
# Update Service Worker Version
# Run this script before committing to update the VERSION in sw.js

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$swPath = Join-Path $scriptPath "shop-tracker\sw.js"

# Get current date in YYYYMMDD format
$date = Get-Date -Format "yyyyMMdd"

# Get short commit hash (last commit)
try {
    $shortHash = git rev-parse --short HEAD 2>$null
    if ($LASTEXITCODE -eq 0) {
        $version = "$date-$shortHash"
    } else {
        # Fallback to timestamp if not in git repo
        $timestamp = [Math]::Floor((Get-Date).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalSeconds)
        $version = "$date-$timestamp"
    }
} catch {
    # Fallback to timestamp
    $timestamp = [Math]::Floor((Get-Date).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalSeconds)
    $version = "$date-$timestamp"
}

Write-Host "Updating service worker version to: $version" -ForegroundColor Green

# Read the file
$content = Get-Content $swPath -Raw

# Update the VERSION line
$pattern = "const VERSION = '[^']+'"
$replacement = "const VERSION = '$version'"
$newContent = $content -replace $pattern, $replacement

# Write back
Set-Content -Path $swPath -Value $newContent -NoNewline

Write-Host "Service worker updated successfully!" -ForegroundColor Green
Write-Host "Version: $version" -ForegroundColor Cyan
