@echo off
echo ========================================
echo    JIMBO INC Control Center + 3D APP
echo ========================================
echo.

:: Start main dashboard
echo [1/2] Starting JIMBO INC Control Center (Port 6025)...
start "JIMBO Dashboard" cmd /k "cd /d U:\JIMBO_INC_CONTROL_CENTER && python run.py"

:: Wait a moment
timeout /t 3 /nobreak > nul

:: Start 3D application
echo [2/2] Starting 3D Creator Application (Port 3050)...
start "3D Creator" cmd /k "cd /d U:\JIMBO_INC_CONTROL_CENTER\3D_APP && start.bat"

echo.
echo ✅ JIMBO INC Platform started!
echo.
echo 📊 Dashboard: http://localhost:6025
echo 🎨 3D Creator: http://localhost:3050
echo.
echo Press any key to exit launcher...
pause > nul