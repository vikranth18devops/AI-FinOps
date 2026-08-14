#!/usr/bin/env bash

# ==============================================================================
# One-Click Local Multi-Service Launcher (Custom Port Configurations)
# Runs Backend (8080), Frontend (3000), and UI_Script Provisioner (8585)
# ==============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "================================================================="
echo " 🚀 STARTING FULL APPLICATION STACK (DEDICATED CUSTOM PORTS)"
echo "================================================================="
echo "  • Backend API Server:     http://localhost:8080"
echo "  • Frontend Web Dashboard: http://localhost:3000"
echo "  • UI_Script Provisioner:  http://localhost:8585"
echo "================================================================="

# Clean stale processes on ports
kill -9 $(lsof -t -i :8080) 2>/dev/null || true
kill -9 $(lsof -t -i :3000) 2>/dev/null || true
kill -9 $(lsof -t -i :8585) 2>/dev/null || true

PYTHON_BIN="$ROOT_DIR/application/backend/venv/bin/python"
if [ ! -f "$PYTHON_BIN" ]; then
    PYTHON_BIN="python3"
fi

# 1. Start Backend Server (Port 8080)
echo "[1/3] Launching FastAPI Backend on port 8080..."
(cd "$ROOT_DIR/application/backend" && "$PYTHON_BIN" -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload) &

# 2. Start UI_Script Provisioner Studio (Port 8585)
echo "[2/3] Launching UI_Script Provisioner Studio on port 8585..."
(cd "$ROOT_DIR/application/UI_Script" && "$PYTHON_BIN" server.py) &

# 3. Start Frontend Dev Server (Port 3000)
echo "[3/3] Launching Vite Frontend on port 3000..."
(cd "$ROOT_DIR/application/frontend" && npm run dev -- --port 3000) &

wait
