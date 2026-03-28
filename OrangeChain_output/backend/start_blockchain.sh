#!/bin/bash
# Run from inside the backend/ folder:
#   cd OrangeChain_Fixed/backend
#   bash start_blockchain.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Setting up Python virtual environment..."
python -m venv venv
source venv/bin/activate

echo "Installing dependencies..."
pip install flask flask-cors

echo ""
echo "Starting OrangeChain blockchain node..."
python blockchain.py
