@echo off
rem Datei: Zurueck-zur-letzten-Fassung.cmd
rem Projekt: Textbausteine - Teil: Windows-Skript (Ordner Bausteine-Skript)
rem Zweck: NOTFALLWEG (18.16). Normalerweise geht "Zurueck zur letzten
rem        Fassung" im Menue des gruenen Symbols. Startet das Skript nach
rem        einem Selbst-Update aber gar nicht mehr (dann gibt es kein
rem        Symbol), holt dieser Doppelklick die vorherige Fassung aus dem
rem        Unterordner vorherige-fassung zurueck und startet sie. Die
rem        Fassung, von der zurueckgegangen wird, holt das Skript danach
rem        nicht mehr von selbst.
setlocal
set "ORDNER=%~dp0"
if not exist "%ORDNER%vorherige-fassung\Bausteine.ahk" (
  echo.
  echo In diesem Ordner gibt es noch keine fruehere Fassung.
  echo Sie entsteht erst beim ersten Selbst-Update.
  echo.
  pause
  exit /b 1
)
set "AKTUELL="
if exist "%ORDNER%fassung.txt" for /f "usebackq tokens=1,* delims==" %%a in ("%ORDNER%fassung.txt") do if /i "%%a"=="fassung" set "AKTUELL=%%b"
if defined AKTUELL (>"%ORDNER%update-auslassen.txt" echo %AKTUELL%)
copy /y "%ORDNER%vorherige-fassung\*.*" "%ORDNER%" >nul
if errorlevel 1 (
  echo.
  echo Zurueckkopieren hat nicht geklappt. Bitte Claude melden.
  echo.
  pause
  exit /b 1
)
start "" "%ORDNER%AutoHotkey64.exe" "%ORDNER%Bausteine.ahk"
