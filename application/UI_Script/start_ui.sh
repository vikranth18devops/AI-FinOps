#!/usr/bin/env bash

# ==============================================================================
# Web UI Site Launcher Script for UI_Script
# Starts the Azure Provisioning Web Portal Server on http://localhost:8585
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "================================================================="
echo "   🚀 STARTING AZURE PROVISIONING WEB UI STUDIO (UI_Script)   "
echo "================================================================="
echo "  • Web Portal URL: http://localhost:8585"
echo "  • Directory:      $SCRIPT_DIR"
echo "================================================================="

# Clean up any existing process on port 8585
kill -9 $(lsof -t -i :8585) 2>/dev/null || true

PYTHON_BIN="$SCRIPT_DIR/../backend/venv/bin/python"
if [ ! -f "$PYTHON_BIN" ]; then
    PYTHON_BIN="python3"
fi

"$PYTHON_BIN" "$SCRIPT_DIR/server.py"
