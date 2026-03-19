@echo off
setlocal

:: ============================================================
:: Configuration
:: ============================================================
set "HTML_FILE=local-visualizer.html"
set "SERVER_SCRIPT=server.py"
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
:: Check for required files in the script's directory
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

if not exist "%~dp0%SERVER_SCRIPT%" (
    echo [ERROR] Could not find "%SERVER_SCRIPT%" in the same folder as this script.
    echo.
    echo Please make sure "%SERVER_SCRIPT%" is in:
    echo   %~dp0
    echo.
    pause
    exit /b 1
)

echo [OK] Found %SERVER_SCRIPT%.

:: ============================================================
:: Launch server and open browser
:: ============================================================
echo.
echo Starting local server at http://localhost:%PORT%/%HTML_FILE%
echo The server will stop automatically when you close the browser tab.
echo.

cd /d "%~dp0"

:: Open the browser after a short delay to give the server time to start
start "" "http://localhost:%PORT%/%HTML_FILE%"

:: Start the custom server (blocks until browser tab is closed)
python %SERVER_SCRIPT% %PORT%

endlocal
