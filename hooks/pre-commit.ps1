#!/usr/bin/env pwsh
# Git pre-commit hook to auto-update service worker versions
# This runs automatically before each commit
# Works on Windows PowerShell and PowerShell Core
#
# To install: Copy-Item hooks/pre-commit.ps1 .git/hooks/pre-commit.ps1

# List of service worker files to update
$swFiles = @(
    "shop-tracker\sw.js",
    "analytics\sw.js",
    "db-inspector-sw.js",
    "sw.js"
)

# Check if any app files are being committed
$stagedFiles = git diff --cached --name-only

if ($stagedFiles -match "shop-tracker|analytics|db-inspector|index.html") {
    Write-Host "Application files modified, updating service worker versions..." -ForegroundColor Yellow
    
    # Get current date in YYYYMMDD format
    $date = Get-Date -Format "yyyyMMdd"
    
    # Get short hash of the latest commit (or use timestamp for initial commit)
    try {
        $shortHash = git rev-parse --short HEAD 2>$null
        if ($LASTEXITCODE -eq 0) {
            $version = "$date-$shortHash"
        } else {
            $timestamp = Get-Date -UFormat %s
            $version = "$date-$([Math]::Floor($timestamp))"
        }
    } catch {
        $timestamp = Get-Date -UFormat %s
        $version = "$date-$([Math]::Floor($timestamp))"
    }
    
    # Update all service worker files
    foreach ($swPath in $swFiles) {
        if (Test-Path $swPath) {
            $content = Get-Content $swPath -Raw
            $pattern = "const VERSION = '[^']+'"
            $replacement = "const VERSION = '$version'"
            $newContent = $content -replace $pattern, $replacement
            Set-Content -Path $swPath -Value $newContent -NoNewline
            
            # Re-stage the updated file
            git add $swPath
            
            $fileName = Split-Path $swPath -Leaf
            Write-Host "  ✓ Updated $fileName to version: $version" -ForegroundColor Green
        }
    }
    
    Write-Host "All service workers updated to: $version" -ForegroundColor Cyan
}

exit 0
