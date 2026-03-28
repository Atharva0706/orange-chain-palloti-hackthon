# OrangeChain — Integrated Platform (Blockchain + ML Intelligence)

This is the fully integrated version combining:
- **OrangeChain_Fixed** — Blockchain-powered orange supply chain (React + Node.js + Python Flask)
- **ML** — Real ML price prediction service (FastAPI + XGBoost/scikit-learn models)

## Architecture

```
Frontend (React/Vite)  →  Node.js Backend (port 5000)
                               ├── /api/auth         → MongoDB auth
                               ├── /api/farmer        → farmer routes
                               ├── /api/buyer         → buyer routes
                               ├── /api/blockchain    → proxies to Python Flask (port 5001)
                               ├── /api/ml            → proxies to FastAPI ML (port 8000)  ← NEW
                               └── /api/ai/predict    → now uses real ML data              ← UPDATED

Python Flask (port 5001)   → Blockchain ledger (blockchain.py)
FastAPI ML  (port 8000)    → Price prediction (ml_service.py) + Dataset/ + weights/
```

## What Changed (Integration Points)

### Backend
- `backend/routes/ml.js` — **NEW**: Proxy routes to all FastAPI ML endpoints
- `backend/server.js` — Updated: Added `/api/ml` route; `/api/ai/predict` now calls real ML
- `backend/ml_service.py` — **NEW**: The FastAPI ML service (from the ML project)
- `backend/Dataset/` — **NEW**: Orange price dataset CSVs
- `backend/weights/` — **NEW**: Trained model files (.pkl)

### Frontend
- `src/pages/FarmerDashboard.tsx` — Updated: AI Predict step now uses `/api/ml/predict`; displays real recommendation, net price, and demand signal from ML

## New API Endpoints (via Node.js at port 5000)

| Endpoint | Description |
|---|---|
| `GET /api/ml/predict?market=Nagpur APMC` | Price prediction + sell recommendation |
| `GET /api/ml/forecast?market=...&days=7` | 7-day rolling forecast |
| `GET /api/ml/compare-markets` | All markets ranked by net profit |
| `GET /api/ml/storage-optimizer?market=...&quantity=10` | Hold vs sell analysis |
| `GET /api/ml/historical?market=...&days=90` | Historical prices for charts |
| `GET /api/ml/demand-signal?market=...` | RED/YELLOW/GREEN market signal |
| `GET /api/ml/markets` | List all 22 APMC markets |

## Setup & Running

### Prerequisites
- Node.js 18+
- Python 3.9+ with pip
- MongoDB (local or Atlas)

### Install

```bash
# Frontend + Node deps
npm install

# Python deps for ML service
cd backend
pip install fastapi uvicorn joblib pandas numpy scikit-learn xgboost

# Python deps for blockchain service
pip install flask flask-cors
```

### Start (all services)

```bash
# Option 1: Use the startup script
chmod +x start.sh
./start.sh

# Option 2: Start each manually
cd backend && uvicorn ml_service:app --port 8000 --reload &
cd backend && python blockchain.py &
cd backend && node server.js &
npm run dev   # frontend
```

### Environment Variables (backend/.env)

```env
MONGODB_URI=mongodb://127.0.0.1:27017/orangechain
JWT_SECRET=your_secret_here
PORT=5000
BLOCKCHAIN_URL=http://localhost:5001
ML_URL=http://localhost:8000
```
