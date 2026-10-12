@echo off
chcp 65001 >nul
title Site vitrine - serveur local
cd /d "%~dp0"

set PORT=8000
set URL=http://localhost:%PORT%/

echo.
echo  Lancement du site sur %URL%
echo  Fermez cette fenetre (ou Ctrl+C) pour arreter le site.
echo.

rem 1. Python, s'il est installe
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "%URL%"
  py -m http.server %PORT%
  goto fin
)
python --version >nul 2>nul
if %errorlevel%==0 (
  start "" "%URL%"
  python -m http.server %PORT%
  goto fin
)

rem 2. Node.js, s'il est installe
where npx >nul 2>nul
if %errorlevel%==0 (
  start "" "%URL%"
  npx --yes serve -l %PORT% .
  goto fin
)

rem 3. Sinon : petit serveur integre a Windows (PowerShell), rien a installer
start "" "%URL%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0outils\serveur.ps1" -Port %PORT%

:fin
pause
