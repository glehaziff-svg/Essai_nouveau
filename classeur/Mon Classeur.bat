@echo off
rem Lance Mon Classeur dans une fenetre d'application (sans barre d'adresse).
setlocal
set "APP=%~dp0index.html"
set "DATA=%LOCALAPPDATA%\MonClasseur"
if not exist "%DATA%" mkdir "%DATA%"

for %%B in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
  "%LocalAppData%\Programs\Brave-Browser\Application\brave.exe"
) do (
  if exist %%B (
    start "" %%B --app="file:///%APP:\=/%" --user-data-dir="%DATA%" --window-size=1100,800
    exit /b
  )
)
rem Aucun navigateur en mode application trouve : ouvre avec le navigateur par defaut.
start "" "%APP%"
