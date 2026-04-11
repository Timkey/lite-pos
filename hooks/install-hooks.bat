@echo off
REM Windows batch installer for git hooks
REM Run this on Windows if you don't have Git Bash

echo Installing git hooks...
echo.

REM Check if PowerShell is available
where pwsh >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo PowerShell Core detected, installing PowerShell hook...
    copy hooks\pre-commit.ps1 .git\hooks\pre-commit.ps1
    copy hooks\pre-commit .git\hooks\pre-commit
    echo.
    echo ✓ PowerShell hook installed
) else (
    where powershell >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo Windows PowerShell detected, installing PowerShell hook...
        copy hooks\pre-commit.ps1 .git\hooks\pre-commit.ps1
        copy hooks\pre-commit .git\hooks\pre-commit
        echo.
        echo ✓ PowerShell hook installed
    ) else (
        echo Installing shell hook (requires Git Bash)...
        copy hooks\pre-commit .git\hooks\pre-commit
        echo.
        echo ✓ Shell hook installed
    )
)

echo.
echo The hook will automatically update service worker versions on commit.
pause
