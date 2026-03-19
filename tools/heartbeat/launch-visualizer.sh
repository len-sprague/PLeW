#!/usr/bin/env bash

# =============================================================
# Configuration
# =============================================================
HTML_FILE="local-visualizer.html"
SERVER_SCRIPT="server.py"
PORT=8080

# =============================================================
# Resolve the directory this script lives in
# =============================================================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# =============================================================
# Check for Python 3
# =============================================================
PYTHON_CMD=""

if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    if python --version 2>&1 | grep -q "^Python 3\."; then
        PYTHON_CMD="python"
    fi
fi

if [ -z "$PYTHON_CMD" ]; then
    echo "[ERROR] Python 3 was not found on this system."
    echo ""
    echo "Install it with one of the following:"
    echo "  macOS:   brew install python3"
    echo "  Ubuntu:  sudo apt install python3"
    echo "  Fedora:  sudo dnf install python3"
    echo "  Or visit https://www.python.org/downloads/"
    exit 1
fi

echo "[OK] Python 3 found ($($PYTHON_CMD --version))."

# =============================================================
# Check for required files in the script's directory
# =============================================================
if [ ! -f "$SCRIPT_DIR/$HTML_FILE" ]; then
    echo "[ERROR] Could not find \"$HTML_FILE\" in the same folder as this script."
    echo ""
    echo "Please make sure \"$HTML_FILE\" is in:"
    echo "  $SCRIPT_DIR"
    exit 1
fi

echo "[OK] Found $HTML_FILE."

if [ ! -f "$SCRIPT_DIR/$SERVER_SCRIPT" ]; then
    echo "[ERROR] Could not find \"$SERVER_SCRIPT\" in the same folder as this script."
    echo ""
    echo "Please make sure \"$SERVER_SCRIPT\" is in:"
    echo "  $SCRIPT_DIR"
    exit 1
fi

echo "[OK] Found $SERVER_SCRIPT."

# =============================================================
# Launch server and open browser
# =============================================================
URL="http://localhost:$PORT/$HTML_FILE"

echo ""
echo "Starting local server at $URL"
echo "The server will stop automatically when you close the browser tab."
echo ""

cd "$SCRIPT_DIR"

# Open the browser in the background
if command -v xdg-open &>/dev/null; then
    xdg-open "$URL" &>/dev/null &
elif command -v open &>/dev/null; then
    open "$URL" &
fi

# Start the custom server (blocks until browser tab is closed)
$PYTHON_CMD "$SERVER_SCRIPT" "$PORT"
