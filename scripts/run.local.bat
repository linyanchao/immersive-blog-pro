@echo off
set PORT=5173
cd /d "%~dp0\.."
echo Starting local server at http://127.0.0.1:%PORT%
python -m http.server %PORT%
pause