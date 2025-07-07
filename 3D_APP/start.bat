@echo off
echo ================================
echo    ZEN_on_3D_CreatoR Startup
echo ================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] pnpm not found, installing globally...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install pnpm
        pause
        exit /b 1
    )
)

:: Navigate to project directory
cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    pnpm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Start the development server
echo [INFO] Starting ZEN_on_3D_CreatoR development server...
echo [INFO] Application will be available at: http://localhost:3050
echo.
echo Press Ctrl+C to stop the server
echo.

pnpm dev -p 3050

pause
