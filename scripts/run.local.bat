@echo off
cd /d "%~dp0\.."
set PORT=5173
echo Starting dev server at http://127.0.0.1:%PORT%
python scripts\dev_server.py
pause