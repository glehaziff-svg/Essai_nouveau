@echo off
rem Lance Canon IJ Scan Utility pour numeriser un document, puis joignez le fichier dans Mon Classeur.
setlocal
for %%B in (
  "%ProgramFiles(x86)%\Canon\IJ Scan Utility\SCANUTILITY.EXE"
  "%ProgramFiles%\Canon\IJ Scan Utility\SCANUTILITY.EXE"
  "%ProgramFiles(x86)%\Canon\IJ Scan Utility Lite\SCANUTILITYLITE.EXE"
  "%ProgramFiles%\Canon\IJ Scan Utility Lite\SCANUTILITYLITE.EXE"
) do (
  if exist %%B (
    start "" %%B
    exit /b
  )
)
echo IJ Scan Utility est introuvable sur cet ordinateur.
echo Ouvrez-le depuis le menu Demarrer, numerisez en PDF, puis joignez le fichier dans Mon Classeur.
pause
