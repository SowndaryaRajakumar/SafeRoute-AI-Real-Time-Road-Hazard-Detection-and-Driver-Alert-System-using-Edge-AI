@echo off
echo ======================================================================
echo           AI-Powered Safe Route Recommendation System
echo                 Tata Innovert Hackathon 2026
echo ======================================================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b
)

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b
)

echo [1/3] Setting up Python virtual environment...
python -m venv venv
call venv\Scripts\activate
echo [2/3] Installing Python backend dependencies...
pip install -r backend/requirements.txt

echo.
echo [3/3] Starting Backend (Port 5000) and Frontend (Port 3000)...
echo Press Ctrl+C in this terminal window to stop the servers.
echo.

:: Start backend in new command window
start "SafeRoute API Backend" cmd /c "call venv\Scripts\activate && python backend/app.py"

:: Start frontend in this window
cd frontend
npm run dev

pause
