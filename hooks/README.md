# Git Hooks

Automatic service worker version management for all apps.

## Installation

### Windows
**Option 1 - PowerShell (Recommended)**:
```powershell
.\hooks\install-hooks.bat
```

**Option 2 - Git Bash**:
```bash
bash hooks/install-hooks.sh
```

### Linux / macOS
```bash
bash hooks/install-hooks.sh
```

## What It Does

Automatically updates the `VERSION` constant in all service worker files when you commit changes to:
- `shop-tracker/*`
- `analytics/*`
- `db-inspector.html`
- `index.html`

### Service Workers Updated:
1. `shop-tracker/sw.js`
2. `analytics/sw.js`
3. `db-inspector-sw.js`
4. `sw.js` (root)

### Version Format:
`YYYYMMDD-shorthash`

Example: `20260411-a1b2c3d`

## Platform Support

| Platform | Hook Type | Status |
|----------|-----------|--------|
| Git Bash (Windows) | Shell | ✅ |
| Windows PowerShell | PowerShell | ✅ |
| PowerShell Core | PowerShell | ✅ |
| Linux | Shell | ✅ |
| macOS | Shell | ✅ |

## Manual Installation

### Shell Hook (Git Bash, Linux, macOS):
```bash
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### PowerShell Hook (Windows):
```powershell
Copy-Item hooks/pre-commit.ps1 .git/hooks/pre-commit.ps1
```

## How It Works

1. Detects if app files are in the commit
2. Generates version string: `YYYYMMDD-commithash`
3. Updates all service worker `VERSION` constants
4. Re-stages the updated service workers
5. Commit proceeds with synchronized versions

## Troubleshooting

**Hook not running?**
- Check `.git/hooks/pre-commit` exists and is executable
- On Windows, ensure Git Bash or PowerShell is available

**Versions not updating?**
- Verify you're committing files from tracked directories
- Check hook has execute permissions: `ls -la .git/hooks/pre-commit`

**Windows-specific:**
- Git for Windows includes Git Bash (shell hook works)
- Windows PowerShell 5.1+ or PowerShell Core 7+ (PowerShell hook works)
- Both hooks can coexist
