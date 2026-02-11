@echo off
set "PATH=%~dp0node_portable\node-v22.13.1-win-x64;%PATH%"
echo [1/2] Launching FastAPI Backend...
echo Installing dependencies...
py -m pip install python-dotenv
start "Backend" cmd /k "py server.py"
echo [2/2] Launching React Frontend...
cd frontend
start "Frontend" cmd /k "..\node_portable\node-v22.13.1-win-x64\npm.cmd run dev"
echo Both servers are starting in separate windows.
pause
