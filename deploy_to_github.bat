@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   SENTINEL_ML GITHUB DEPLOYMENT SCRIPT
echo ========================================
echo.

:: 1. Auto-Detect Git Installation
echo [*] Checking for Git installation...

:: Try standard 'git' command
where git >nul 2>nul
if %errorlevel% equ 0 (
    set "GIT_CMD=git"
    goto :GitFound
)

:: Try common installation paths
if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
    goto :GitFound
)
if exist "C:\Program Files\Git\bin\git.exe" (
    set "GIT_CMD=C:\Program Files\Git\bin\git.exe"
    goto :GitFound
)
if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
    set "GIT_CMD=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
    goto :GitFound
)

:: Git Not Found
echo.
echo [ERROR] Git command not found!
echo.
echo Likely causes:
echo 1. You just installed Git but didn't restart VS Code/Terminal.
echo 2. Git is installed in a non-standard location.
echo.
echo PLEASE RESTART VS CODE COMPLETELEY AND TRY AGAIN.
echo.
pause
exit /b 1

:GitFound
echo [OK] Git found at: !GIT_CMD!

:: 2. Initialize Git (Safe to run multiple times)
echo.
echo [*] Initializing local repository...
"!GIT_CMD!" init

:: 3. Configure Git Identity (Interactive Prompt)
echo.
echo [!] GIT IDENTITY REQUIRED
echo Please enter your email and name for the commit history.
set /p GitEmail="Enter your Git Email: "
set /p GitName="Enter your Git Name: "

"!GIT_CMD!" config user.email "%GitEmail%"
"!GIT_CMD!" config user.name "%GitName%"

:: 4. Add remote (ignore error if already exists)
echo.
echo [*] Linking to GitHub repository...
"!GIT_CMD!" remote add origin https://github.com/muhaddasgujjar/SENTINEL_ML.git 2>nul

:: 5. Staging files
echo.
echo [*] Staging files...
"!GIT_CMD!" add .

:: 6. Commit
echo.
echo [*] Creating commit...
"!GIT_CMD!" commit -m "Phase 20: Full Industrial Portal with RAG, Communication Protocols & UI Polish"

:: 7. Push
echo.
echo [*] Uploading to GitHub (main branch)...
"!GIT_CMD!" branch -M main
"!GIT_CMD!" push -u origin main

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE! Check your repo at:
echo   https://github.com/muhaddasgujjar/SENTINEL_ML
echo ========================================
pause
