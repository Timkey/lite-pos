# Service Worker Auto-Versioning

## Overview

The service worker now uses automatic cache versioning to prevent stale cache issues. Each deployment gets a unique cache name, and old caches are automatically cleaned up.

## How It Works

### 1. Version Format
```javascript
const VERSION = '20260405-1b84840'; // YYYYMMDD-shortcommit
const CACHE_NAME = `shop-tracker-v${VERSION}`;
```

### 2. Cache Busting
All resources (except root and index.html) are cached with version query parameters:
```javascript
'/shop-tracker/js/app.js?v=20260405-1b84840'
'/shop-tracker/css/main.css?v=20260405-1b84840'
```

### 3. Automatic Cleanup
When a new version is deployed:
- New cache is created: `shop-tracker-v20260405-1b84840`
- Old cache is detected and deleted: `shop-tracker-v20260405-abc1234`
- Users automatically get the latest version

## Manual Version Update

Run the PowerShell script before committing:
```powershell
.\update-sw-version.ps1
```

This will:
1. Get current date (YYYYMMDD)
2. Get short commit hash from git
3. Update VERSION in `shop-tracker/sw.js`
4. Example: `20260405-1b84840`

## Automatic Updates (Git Hook) ✅ ACTIVE

A pre-commit hook **automatically updates the version with every commit**:

**Status:** ✅ Installed and working at `.git/hooks/pre-commit`

The hook will:
- ✅ Detect when shop-tracker files are committed
- ✅ Auto-update the VERSION to `YYYYMMDD-commithash`
- ✅ Re-stage the updated sw.js
- ✅ **No manual intervention needed**

**Example:**
```bash
git add shop-tracker/js/app.js
git commit -m "feat: add feature"
# Hook runs automatically
# VERSION updated to: 20260405-9149e9b
# Commit includes updated sw.js
```

## Benefits

✅ **No Manual Cache Clearing** - Old caches auto-deleted  
✅ **Instant Updates** - New version loads immediately  
✅ **Version Tracking** - Know exactly which version is deployed  
✅ **Cache Busting** - Query params force fresh downloads  
✅ **Automatic Process** - Git hook handles it for you  

## Testing

After updating:
1. Open DevTools → Application → Service Workers
2. Check current cache name: `shop-tracker-v20260405-1b84840`
3. Hard refresh (Ctrl+Shift+R)
4. Verify old cache is deleted
5. New cache is active

## Deployment Workflow

### Automatic (Recommended) ✅
```bash
# Just commit - version updates automatically!
git add .
git commit -m "feat: your changes"
# Pre-commit hook auto-updates VERSION before commit
# You'll see: "Service worker version updated to: 20260405-abc1234"
```

**Every commit to shop-tracker files automatically gets a new VERSION.**

### Manual (If Hook Disabled)
```powershell
# 1. Make your changes
# 2. Update version manually
.\update-sw-version.ps1

# 3. Commit
git add .
git commit -m "feat: your changes"
```

## Version History

Each commit will have a unique VERSION string:
- `20260405-1b84840` - Commit 1b84840 on April 5, 2026
- `20260405-a2c3d4e` - Commit a2c3d4e on April 5, 2026
- `20260406-f5e6d7c` - Commit f5e6d7c on April 6, 2026

## Troubleshooting

### Service Worker Not Updating
1. Check VERSION in sw.js - is it unique?
2. Hard refresh: Ctrl+Shift+R
3. Unregister old SW in DevTools
4. Clear all caches manually if needed

### Git Hook Not Running
```powershell
# Make hook executable (if on Linux/Mac)
chmod +x .git/hooks/pre-commit.ps1

# Or use Git config
git config core.hooksPath .git/hooks
```

### Want to Force New Version Now
```powershell
.\update-sw-version.ps1
git add shop-tracker/sw.js
git commit -m "chore: bump service worker version"
```
