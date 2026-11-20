@echo off
setlocal EnableExtensions
title RTL Chat for ZCode - installer
cd /d "%~dp0"

set "NOPAUSE="
if /I "%~1"=="--no-pause" set "NOPAUSE=1"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed. Get it from https://nodejs.org then run this file again.
  goto end
)

set "ASAR="
if exist "%LOCALAPPDATA%\Programs\ZCode\resources\app.asar" set "ASAR=%LOCALAPPDATA%\Programs\ZCode\resources\app.asar"
if not defined ASAR if exist "%ProgramFiles%\ZCode\resources\app.asar" set "ASAR=%ProgramFiles%\ZCode\resources\app.asar"
if not defined ASAR if exist "%ProgramFiles(x86)%\ZCode\resources\app.asar" set "ASAR=%ProgramFiles(x86)%\ZCode\resources\app.asar"
if not defined ASAR (
  echo [ERROR] ZCode installation not found on this machine.
  goto end
)
echo Found ZCode: %ASAR%

rem --- close ZCode if running, so the asar can be written
"%SystemRoot%\System32\tasklist.exe" /FI "IMAGENAME eq ZCode.exe" 2>nul | "%SystemRoot%\System32\findstr.exe" /I "ZCode.exe" >nul
if errorlevel 1 goto notrunning
echo ZCode is running - closing it so the patch can be applied...
"%SystemRoot%\System32\taskkill.exe" /IM ZCode.exe >nul 2>&1
set /a TRIES=0
:waitclose
"%SystemRoot%\System32\ping.exe" -n 2 127.0.0.1 >nul
"%SystemRoot%\System32\tasklist.exe" /FI "IMAGENAME eq ZCode.exe" 2>nul | "%SystemRoot%\System32\findstr.exe" /I "ZCode.exe" >nul
if errorlevel 1 goto notrunning
set /a TRIES+=1
if %TRIES% lss 5 goto waitclose
echo ZCode minimized to tray instead of quitting - forcing close (like End task in Task Manager)...
"%SystemRoot%\System32\taskkill.exe" /F /IM ZCode.exe >nul 2>&1
"%SystemRoot%\System32\ping.exe" -n 3 127.0.0.1 >nul
"%SystemRoot%\System32\tasklist.exe" /FI "IMAGENAME eq ZCode.exe" 2>nul | "%SystemRoot%\System32\findstr.exe" /I "ZCode.exe" >nul
if errorlevel 1 goto notrunning
echo [ERROR] ZCode did not close. Quit it manually from the tray icon, then run this file again.
goto end
:notrunning

rem --- ask for admin rights only when ZCode lives in Program Files
echo "%ASAR%" | "%SystemRoot%\System32\findstr.exe" /I /C:"Program Files" >nul
if errorlevel 1 goto runpatch
"%SystemRoot%\System32\net.exe" session >nul 2>&1
if not errorlevel 1 goto runpatch
echo Requesting administrator rights - click Yes on the UAC prompt...
powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs -ArgumentList '%*'"
exit /b
:runpatch

set "ZCODE_ASAR=%ASAR%"
node asar-work\patch-asar.mjs --apply
if errorlevel 1 goto end
echo.
echo Done. Open ZCode normally and look for the small red RTL badge at the bottom-right.
echo After every ZCode update, double-click this file again.

:end
if defined NOPAUSE exit /b
echo.
pause