@echo off
title Headspace Local Server

cd /d "%~dp0"

echo Starting Headspace...
echo.
echo This window must stay open while Headspace is running.
echo Close this window when you are done.
echo.

where python >nul 2>nul
if %errorlevel% equ 0 (
    start "" "http://localhost:8000"
    python server.py
    exit /b
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    start "" "http://localhost:8000"
    py server.py
    exit /b
)

echo Python was not found.
echo.
echo Please install Python, then try again:
echo https://www.python.org/downloads/
echo.
pause
