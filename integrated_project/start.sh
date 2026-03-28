#!/bin/bash
# OrangeChain + ML Intelligence — Integrated Startup Script
# Starts all 3 services: ML API (Python), Blockchain (Python), Node.js backend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$SCRIPT_DIR/backend"

echo "======================================"
echo "  OrangeChain Integrated Platform"
echo "======================================"

# 1. Start ML FastAPI service
echo ""
echo "[1/3] Starting ML Intelligence Service (port 8000)..."
cd "$BACKEND"
if [ -d "venv" ]; then
    source venv/bin/activate
fi
pip install -q fastapi uvicorn joblib pandas numpy scikit-learn xgboost 2>/dev/null || true
uvicorn ml_service:app --host 0.0.0.0 --port 8000 --reload &
ML_PID=$!
echo "    ✅ ML service starting (PID $ML_PID)"

# 2. Start Blockchain Flask service
echo ""
echo "[2/3] Starting Blockchain Service (port 5001)..."
python blockchain.py &
BC_PID=$!
echo "    ✅ Blockchain service starting (PID $BC_PID)"

sleep 2

# 3. Start Node.js backend
echo ""
echo "[3/3] Starting Node.js Backend (port 5000)..."
node server.js &
NODE_PID=$!
echo "    ✅ Node backend starting (PID $NODE_PID)"

echo ""
echo "======================================"
echo "  All services started!"
echo "  ML API:        http://localhost:8000"
echo "  Blockchain:    http://localhost:5001"
echo "  Node Backend:  http://localhost:5000"
echo "  Frontend:      run 'npm run dev' in project root"
echo "======================================"
echo ""
echo "Press Ctrl+C to stop all services."

trap "echo 'Stopping all services...'; kill $ML_PID $BC_PID $NODE_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
