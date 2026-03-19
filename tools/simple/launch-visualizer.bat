@echo off
setlocal

:: ============================================================
:: Configuration
:: ============================================================
set "HTML_FILE=local-visualizer.html"
set "PORT=8080"

:: ============================================================
:: Check for Python 3
:: ============================================================
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found on this system.
    echo.
    echo Please install Python 3 from https://www.python.org/downloads/
    echo During installation, make sure to check "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

:: Verify it is Python 3, not Python 2
python --version 2>&1 | findstr /r "^Python 3\." >nul
if %errorlevel% neq 0 (
    echo [ERROR] Python was found, but it does not appear to be Python 3.
    echo.
    echo Detected version:
    python --version
    echo.
    echo Please install Python 3 from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [OK] Python 3 found.

:: ============================================================
:: Check for the HTML file in the current directory
:: ============================================================
if not exist "%~dp0%HTML_FILE%" (
    echo [ERROR] Could not find "%HTML_FILE%" in the same folder as this script.
    echo.
    echo Please make sure "%HTML_FILE%" is in:
    echo   %~dp0
    echo.
    pause
    exit /b 1
)

echo [OK] Found %HTML_FILE%.

:: ============================================================
:: Launch server and open browser
:: ============================================================
echo.
echo Starting local server at http://localhost:%PORT%/%HTML_FILE%
echo Press Ctrl+C in this window to stop the server when you are done.
echo.

:: Open the browser after a short delay to give the server time to start
start "" "http://localhost:%PORT%/%HTML_FILE%"

:: Serve from the script's own directory
cd /d "%~dp0"
python -m http.server %PORT%

endlocal
