@echo off
echo JIMBO INC Dashboard - Training Data Auto-Update
echo ================================================

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found! Please install Python 3.8+
    pause
    exit /b 1
)

REM Run single check for changes
echo Checking for dashboard changes...
python training_data_updater.py check

echo.
echo Update check completed!
echo.

REM Ask if user wants continuous monitoring
choice /C YN /M "Start continuous monitoring (updates every 5 minutes)"
if errorlevel 2 goto end
if errorlevel 1 goto monitor

:monitor
echo Starting continuous monitoring...
echo Press Ctrl+C to stop monitoring
python training_data_updater.py monitor 300

:end
echo Training data updater finished.
pause
