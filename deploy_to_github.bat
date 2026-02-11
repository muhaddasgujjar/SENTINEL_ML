@echo off
echo ========================================
echo   SENTINEL_ML GITHUB DEPLOYMENT SCRIPT
echo ========================================
echo.

:: Initialize Git (idempotent, safe to run again)
echo [*] Initializing local repository...
git init

:: Configure Git Identity (Interactive Prompt)
echo.
echo [!] GIT IDENTITY REQUIRED
echo Please enter your email and name for the commit history.
set /p GitEmail="Enter your Git Email: "
set /p GitName="Enter your Git Name: "

git config user.email "%GitEmail%"
git config user.name "%GitName%"

:: Add remote (ignore error if already exists)
echo.
echo [*] Linking to GitHub repository...
git remote add origin https://github.com/muhaddasgujjar/SENTINEL_ML.git 2>nul

:: Initial commit
echo.
echo [*] Staging files...
git add .
echo [*] Creating commit...
git commit -m "Phase 20: Full Industrial Portal with RAG, Communication Protocols & UI Polish"

:: Push
echo.
echo [*] Uploading to GitHub (main branch)...
git branch -M main
git push -u origin main

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE! Check your repo at:
echo   https://github.com/muhaddasgujjar/SENTINEL_ML
echo ========================================
pause
