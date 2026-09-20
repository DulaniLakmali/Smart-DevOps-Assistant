@echo off
echo ========================================================
echo   Starting Smart DevOps Assistant (Backend + Frontend)
echo ========================================================
echo.

start "Smart DevOps Assistant - Backend (Port 5000)" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Smart DevOps Assistant - Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   Backend is launching at:  http://localhost:5000
echo   Frontend will open at:    http://localhost:5173
echo ========================================================
echo.
pause
