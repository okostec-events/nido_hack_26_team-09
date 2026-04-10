@echo off
setlocal EnableDelayedExpansion

REM This script lives in <extracted-zip>\auto-install\
REM We use the location of TEAM_URL.txt (in the same folder) to figure out
REM which team's repo to clone -- works no matter what the extracted folder is named.

set "SCRIPT_DIR=%~dp0"
REM Strip trailing backslash from SCRIPT_DIR
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM Parent of auto-install\ = the extracted ZIP folder
for %%I in ("%SCRIPT_DIR%\..") do set "EXTRACTED_DIR=%%~fI"

echo.
echo =====================================
echo  Nido Hack '26 -- Auto Install (Win)
echo =====================================
echo.

REM 0. Figure out which team repo to clone
REM    Priority 1: TEAM_URL.txt (one line, the HTTPS git URL)
REM    Priority 2: derive from the extracted folder name
set "TEAM_URL="
if exist "%SCRIPT_DIR%\TEAM_URL.txt" (
  set /p TEAM_URL=<"%SCRIPT_DIR%\TEAM_URL.txt"
)

if "%TEAM_URL%"=="" (
  REM Fallback: extract team name from the parent folder name
  REM GitHub ZIPs unzip as "nido_hack_26_team-XX-main" -- strip the "-main" suffix.
  for %%I in ("%EXTRACTED_DIR%") do set "FOLDER_NAME=%%~nxI"
  set "TEAM_NAME=!FOLDER_NAME:-main=!"
  set "TEAM_URL=https://github.com/okostec-events/!TEAM_NAME!.git"
  echo [WARN] TEAM_URL.txt not found, guessing from folder name: !TEAM_NAME!
)

REM Strip whitespace/CR from TEAM_URL
set "TEAM_URL=%TEAM_URL: =%"
set "TEAM_URL=%TEAM_URL:	=%"

REM Derive a clean team name (strip URL prefix and .git)
for %%I in ("%TEAM_URL%") do set "TEAM_NAME=%%~nI"
set "CLONE_DIR=%USERPROFILE%\Documents\GitHub\%TEAM_NAME%"

echo Team repo:    %TEAM_URL%
echo Will clone to: %CLONE_DIR%
echo.

REM 1. Install VS Code (skip if 'code' command is already available)
where code >nul 2>&1
if %ERRORLEVEL% equ 0 (
  echo [OK] VS Code already installed, skipping
) else (
  echo ^> Installing VS Code...
  winget install -e --id Microsoft.VisualStudioCode --accept-package-agreements --accept-source-agreements --silent
)

REM 2. Install Node.js LTS (skip if 'node' is already available)
where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
  echo [OK] Node.js already installed, skipping
) else (
  echo ^> Installing Node.js LTS...
  winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent
)

REM 3. Install Git (skip if 'git' is already available)
where git >nul 2>&1
if %ERRORLEVEL% equ 0 (
  echo [OK] Git already installed, skipping
) else (
  echo ^> Installing Git...
  winget install -e --id Git.Git --accept-package-agreements --accept-source-agreements --silent
)

REM 4. Install GitHub Desktop (no simple CLI check - let winget handle duplicates)
if exist "%LOCALAPPDATA%\GitHubDesktop\GitHubDesktop.exe" (
  echo [OK] GitHub Desktop already installed, skipping
) else (
  echo ^> Installing GitHub Desktop...
  winget install -e --id GitHub.GitHubDesktop --accept-package-agreements --accept-source-agreements --silent
)

REM 5. Refresh PATH so newly installed 'code' and 'git' work in this session
set "PATH=%PATH%;%LOCALAPPDATA%\Programs\Microsoft VS Code\bin;C:\Program Files\Git\cmd;C:\Program Files\nodejs"

REM 6. Verify 'git' command is now available
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo.
  echo WARNING: 'git' command not found in PATH.
  echo Close this window, then double-click the script again.
  echo The PATH will be refreshed on the second run.
  pause
  exit /b 1
)

REM 7. Clone (or update) the team repo into %USERPROFILE%\Documents\GitHub\<team>\
echo.
if not exist "%USERPROFILE%\Documents\GitHub" mkdir "%USERPROFILE%\Documents\GitHub"
if exist "%CLONE_DIR%\.git" (
  echo [OK] Repo already cloned, pulling latest changes...
  pushd "%CLONE_DIR%"
  git pull --ff-only
  popd
) else (
  echo ^> Cloning %TEAM_URL% ...
  git clone "%TEAM_URL%" "%CLONE_DIR%"
)

REM 8. Verify 'code' command is available
where code >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo.
  echo WARNING: 'code' command not found in PATH.
  echo Close this window, then double-click the script again.
  pause
  exit /b 1
)

REM 9. Install Cline AI extension for VS Code (idempotent)
echo.
echo ^> Installing Cline AI extension...
code --install-extension saoudrizwan.claude-dev

REM 10. Open the cloned repo in VS Code (NOT the extracted ZIP folder)
echo.
echo ^> Opening project in VS Code...
code "%CLONE_DIR%"

echo.
echo [DONE] VS Code should now be open with your team's repo:
echo   %CLONE_DIR%
echo.
echo Next: in VS Code, double-click 'index.html' in the left sidebar
echo to start the Hackathon Clicker game.
echo.
echo To push changes to your team, open GitHub Desktop, sign in,
echo then File ^> Add Local Repository ^> choose the folder above.
echo.
pause
