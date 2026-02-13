@echo off
cd /d "%~dp0\.."
git config core.hooksPath scripts/githooks
echo OK: git hooksPath -> scripts/githooks
echo Now every commit will sync CHANGELOG.md automatically.
pause