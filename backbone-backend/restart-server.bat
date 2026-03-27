@echo off
echo ========================================
echo   RESTARTING BACKEND SERVER
echo ========================================
echo.
echo Step 1: Stopping any running Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Step 2: Starting backend server...
echo.
start cmd /k "cd /d %~dp0 && npm start"
echo.
echo ========================================
echo   Backend server is starting...
echo   Check the new window for status
echo ========================================
echo.
echo The server should be running on:
echo http://localhost:5000
echo.
echo Test the crop recommendation endpoint:
echo http://localhost:5000/api/crop-recommendation/recommend
echo.
pause
