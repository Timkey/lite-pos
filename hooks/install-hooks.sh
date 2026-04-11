#!/bin/sh
# Install git hooks from the hooks/ directory
# For Unix/Linux/macOS and Git Bash on Windows

echo "Installing git hooks..."

# Copy shell hook (works on Git Bash, Linux, macOS)
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Copy PowerShell hook if PowerShell is available (Windows)
if command -v pwsh >/dev/null 2>&1 || command -v powershell >/dev/null 2>&1; then
    cp hooks/pre-commit.ps1 .git/hooks/pre-commit.ps1
    echo "✓ PowerShell hook installed (Windows PowerShell support)"
fi

echo "✓ Shell hook installed (Git Bash/Unix support)"
echo ""
echo "The hook will automatically update service worker versions on commit."
echo ""
echo "Platforms supported:"
echo "  - Git Bash on Windows (shell hook)"
echo "  - Windows PowerShell (PowerShell hook)"  
echo "  - Linux (shell hook)"
echo "  - macOS (shell hook)"
