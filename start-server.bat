@echo off
title Car Parking System - Backend Server
color 0A
echo.
echo  ================================================
echo    Car Parking System  -  Backend Startup
echo  ================================================
echo.

:: Check if MongoDB is running
echo  [1/2] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  Starting MongoDB service...
    net start MongoDB >nul 2>&1
    IF %ERRORLEVEL% NEQ 0 (
        echo.
        echo  [ERROR] MongoDB is not installed or could not start.
        echo  Please install MongoDB Community Server from:
        echo  https://www.mongodb.com/try/download/community
        echo.
        echo  After installing, run this script again.
        pause
        exit /b 1
    )
)
echo  MongoDB is running!

echo.
echo  [2/2] Starting Node.js backend on port 5000...
echo.
cd /d "%~dp0backend"
node server.js

pause
