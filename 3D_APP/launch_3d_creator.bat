@echo off
title JIMBO INC - 3D Creator Launch
echo ==========================================
echo     JIMBO INC 3D Creator Startup
echo ==========================================
echo.

:: Sprawdź ścieżkę
cd /d "%~dp0"
echo Current directory: %CD%
echo.

:: Sprawdź Node.js
echo [1/4] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Install from nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js OK

:: Sprawdź pnpm
echo [2/4] Checking pnpm...
pnpm --version
if %errorlevel% neq 0 (
    echo ⚠️ Installing pnpm...
    npm install -g pnpm
)
echo ✅ pnpm OK

:: Sprawdź dependencies
echo [3/4] Checking dependencies...
if not exist "node_modules" (
    echo ⚠️ Installing dependencies...
    pnpm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)
echo ✅ Dependencies OK

:: Uruchom aplikację
echo [4/4] Starting 3D Creator...
echo.
echo 🚀 Application starting at: http://localhost:3050
echo 📁 3D Library available at: ./3D_LIBRARY/
echo.
echo Press Ctrl+C to stop
echo.

pnpm dev -p 3050

if %errorlevel% neq 0 (
    echo.
    echo ❌ Application failed to start
    echo Check the error messages above
    pause
)
