# OrangeChain Implementation Guide - Complete Setup

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [What's Included](#whats-included)
6. [Features Overview](#features-overview)
7. [API Documentation](#api-documentation)
8. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Minimum Requirements
- **Node.js**: v16 or higher
- **npm**: v7 or higher
- **Python**: 3.8 or higher
- **MongoDB**: 4.4 or higher
- **RAM**: 2GB minimum
- **Disk Space**: 2GB minimum

### Recommended
- **Node.js**: v18+
- **MongoDB**: 5.0+
- **RAM**: 4GB+
- **Disk Space**: 5GB+

### Operating Systems
- ✅ Linux (Ubuntu 20.04+)
- ✅ macOS (10.15+)
- ✅ Windows 10/11 (with WSL2)

---

## 📦 Installation Steps

### Step 1: Clone/Extract Project

```bash
# Extract the ZIP file
unzip OrangeChain_Complete.zip
cd OrangeChain

# Or if using git
git clone <repository-url>
cd OrangeChain
```

### Step 2: Install Node Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 3: Install Python Dependencies

```bash
# Navigate to backend
cd backend

# Install Python packages for blockchain and ML
pip install flask flask-cors

# If you have requirements.txt
pip install -r requirements.txt

cd ..
```

### Step 4: Setup MongoDB

#### Option A: Local MongoDB
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu)
sudo apt-get install -y mongodb
sudo systemctl start mongod

# Windows (using Chocolatey)
choco install mongodb
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update MONGODB_URI in backend/.env

### Step 5: Environment Configuration

Create `backend/.env` file:

```bash
cat > backend/.env << 'EOF'
# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/orangechain

# Server Configuration
PORT=5000
NODE_ENV=development

# External Services
BLOCKCHAIN_URL=http://localhost:5001
ML_URL=http://localhost:8000

# Security
JWT_SECRET=orangechain_secret_key_change_this_in_production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EOF
```

---

## ⚙️ Configuration

### Frontend Configuration (if needed)

Create `src/.env` file:

```
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=OrangeChain
VITE_APP_VERSION=1.0.0
```

### Backend Services Configuration

#### Blockchain Service (blockchain.py)
```python
# Default configuration
HOST = 'localhost'
PORT = 5001
DIFFICULTY = 3  # Leading zeros in hash
```

#### ML Service (ml_service.py or integrated)
```
API_PORT = 8000
ML_MODEL_PATH = './models'
PREDICTION_CONFIDENCE_THRESHOLD = 0.7
```

---

## 🚀 Running the Application

### Method 1: Using Shell Script (Recommended)

```bash
chmod +x start.sh
./start.sh
```

### Method 2: Manual Terminal Setup

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
```

Expected output:
```
✅ Connected to MongoDB
✅ Backend running on port 5000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Expected output:
```
VITE v4.0.0 ready in 450 ms

➜ Local: http://localhost:5173/
```

**Terminal 3 - Blockchain Service:**
```bash
cd backend
python blockchain.py
```

Expected output:
```
OrangeChain Blockchain Node running on http://localhost:5001
```

**Terminal 4 - ML Service (if separate):**
```bash
cd backend
python ml_service.py
```

Or if integrated in backend:
```
ML Service loaded at /api/ml/predict
```

### Method 3: Using npm scripts

```bash
# Install concurrently (if not already)
npm install -D concurrently

# Add to package.json scripts:
# "dev:all": "concurrently \"npm run dev\" \"cd backend && npm start\" \"cd backend && python blockchain.py\""

npm run dev:all
```

---

## 📦 What's Included

### Frontend (React + TypeScript)
```
src/
├── pages/
│   ├── FarmerDashboard.tsx       ✅ UPDATED with ML
│   ├── TraderDashboard.tsx       ✅ NEW with ML
│   ├── BuyerDashboard.tsx
│   ├── Auth pages
│   └── ...
├── components/
│   ├── Charts
│   ├── Forms
│   └── Layout
├── context/
│   └── AuthContext.tsx
├── services/
│   ├── api.ts
│   └── blockchain.ts
└── App.tsx
```

### Backend (Node.js + Express)
```
backend/
├── routes/
│   ├── auth.js
│   ├── farmer.js
│   ├── buyer.js
│   ├── payment.js           ✅ Payment system
│   ├── blockchain.js
│   └── ml.js               ✅ ML predictions
├── models/
│   ├── User.js
│   ├── Produce.js
│   ├── Transaction.js       ✅ Updated schema
│   └── ...
├── blockchain.py           ✅ Blockchain service
├── ml_service.py          ✅ ML predictions
└── server.js
```

### New Features
- ✅ Payment system with UPI integration
- ✅ ML price predictions
- ✅ Updated dashboards with predictions
- ✅ Historical data analysis
- ✅ Real-time recommendations

---

## 🎯 Features Overview

### 1. Authentication & Authorization
- User signup/login
- Role-based access (Farmer, Buyer, Trader)
- JWT token authentication
- Profile management

### 2. Payment System
- UPI integration
- QR code generation
- Automatic status updates
- Payment confirmation
- Escrow management
- Blockchain mining on delivery

### 3. ML Integration
- Real-time price predictions
- Market analysis for 6 regions
- Recommendations (BUY/SELL/HOLD)
- Demand signal monitoring
- Historical trends
- Statistical analysis

### 4. Dashboards

#### Farmer Dashboard
- **Publish Listing**: Create crop listings
- **Price Prediction**: ML-powered forecasts for markets
- **Historic Data**: Historical price trends
- **Sales & Orders**: Order management
- **Wallet**: Revenue tracking

#### Trader Dashboard
- **Price Analysis**: Market predictions
- **Historic Data**: Commodity trends
- **Market Intelligence**: Comparative analysis

#### Buyer Dashboard
- **Browse Produce**: Search and filter
- **Purchase**: Buy produce
- **Orders**: Track deliveries
- **History**: Purchase history

### 5. Blockchain
- Immutable transaction records
- Proof-of-Work consensus
- Smart contract support
- Cryptographic verification
- Chain validation

---

## 📡 API Documentation

### Authentication Endpoints

```bash
# Register
POST /api/auth/signup
{
  "username": "farmer1",
  "email": "farmer@example.com",
  "password": "password123",
  "role": "farmer"
}

# Login
POST /api/auth/login
{
  "email": "farmer@example.com",
  "password": "password123"
}
```

### Farmer Endpoints

```bash
# List produce
POST /api/farmer/produce
{
  "cropType": "Nagpur Orange",
  "quantity": 45,
  "pricePerKg": 55.00,
  "pickupDate": "2024-04-15"
}

# Get farmer's listings
GET /api/farmer/produce

# Update listing
PUT /api/farmer/produce/:id
```

### Buyer Endpoints

```bash
# Get all produce
GET /api/buyer/produce

# Buy produce
POST /api/buyer/buy/:produceId

# Get transactions
GET /api/buyer/transactions
```

### Payment Endpoints

```bash
# Generate UPI link
POST /api/payment/generate-upi/:transactionId

# Confirm payment
POST /api/payment/confirm/:transactionId

# Get payment status
GET /api/payment/status/:transactionId

# Mark shipped
POST /api/payment/mark-shipped/:transactionId

# Confirm delivery
POST /api/payment/confirm-delivery/:transactionId
```

### ML Endpoints

```bash
# Get price prediction
GET /api/ml/predict?market=Nagpur%20APMC

# Get available markets
GET /api/ml/markets

# Get historical data
GET /api/ml/history?market=Nagpur%20APMC&days=30
```

### Blockchain Endpoints

```bash
# Get blockchain
GET /api/blockchain/chain

# Get block by index
GET /api/blockchain/block/:index

# Validate chain
GET /api/blockchain/validate

# Get transaction
GET /api/blockchain/transaction/:txId
```

---

## 🔍 Testing the Application

### Test User Creation

```bash
# Create a farmer account
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "farmer1",
    "email": "farmer@example.com",
    "password": "password123",
    "role": "farmer"
  }'

# Create a buyer account
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "buyer1",
    "email": "buyer@example.com",
    "password": "password123",
    "role": "buyer"
  }'
```

### Test ML Predictions

```bash
# Get price prediction
curl "http://localhost:5000/api/ml/predict?market=Nagpur%20APMC"

# Response should include:
# - min_price
# - modal_price
# - max_price
# - recommendation (BUY/SELL/HOLD)
# - demand_signal
```

### Test Blockchain

```bash
# Get chain
curl http://localhost:5000/api/blockchain/chain

# Validate chain
curl http://localhost:5000/api/blockchain/validate
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. MongoDB Connection Error

**Problem**: `MongooseError: connect ECONNREFUSED`

**Solution**:
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
mongod

# Or use cloud MongoDB
# Update MONGODB_URI in backend/.env with MongoDB Atlas connection string
```

#### 2. Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process on port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm start
```

#### 3. CORS Error

**Problem**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
```bash
# Update backend/.env
CORS_ORIGIN=http://localhost:5173

# Restart backend
npm start
```

#### 4. ML Predictions Not Loading

**Problem**: `ML Service not responding`

**Solution**:
```bash
# Verify ML service is running
curl http://localhost:8000/health

# Check ML_URL in backend/.env
# Restart services

# Terminal 1: Backend
cd backend && npm start

# Terminal 2: ML Service
python ml_service.py
```

#### 5. Node Dependencies Issue

**Problem**: `Module not found` errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

cd backend
rm -rf node_modules package-lock.json
npm install
cd ..
```

#### 6. Python Dependencies Missing

**Problem**: `ModuleNotFoundError: No module named 'flask'`

**Solution**:
```bash
pip install flask flask-cors

# Or install from requirements
pip install -r backend/requirements.txt
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change JWT_SECRET in backend/.env
- [ ] Use strong MongoDB password
- [ ] Enable HTTPS for frontend
- [ ] Add rate limiting to API
- [ ] Implement API authentication
- [ ] Validate all user inputs
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for trusted domains
- [ ] Regular security audits
- [ ] Keep dependencies updated

---

## 📊 Database

### Collections Created

```
- users
- produces
- transactions
- orders
- blockchain_blocks
- payments
- ml_predictions (optional)
```

### Sample Data

You can seed the database with:

```bash
cd backend
npm run seed
```

---

## 🚀 Deployment

### Development
```bash
NODE_ENV=development npm start
```

### Production Build
```bash
npm run build
NODE_ENV=production npm start
```

### Docker (if available)
```bash
docker-compose up
```

---

## 📞 Getting Help

### Documentation Files
- **README.md** - Project overview
- **QUICK_START.md** - Quick setup
- **ML_INTEGRATION_GUIDE.md** - ML details
- **DASHBOARD_UPDATE_SUMMARY.md** - Dashboard changes

### Common Commands

```bash
# View logs
npm start  # Frontend logs
cd backend && npm start  # Backend logs

# Check service status
curl http://localhost:5000/api/health
curl http://localhost:5173/api/health
curl http://localhost:5001/health

# View database
mongosh
> show dbs
> use orangechain
> db.users.find()
```

---

## ✅ Final Checklist

Before considering setup complete:

- [ ] All dependencies installed (`npm install`)
- [ ] MongoDB running and accessible
- [ ] Environment variables configured (.env)
- [ ] Backend starts without errors
- [ ] Frontend loads at localhost:5173
- [ ] Blockchain service running on port 5001
- [ ] ML service accessible
- [ ] Can create user account
- [ ] Can view price predictions
- [ ] Payment endpoints working
- [ ] No console errors

---

## 🎉 Ready to Go!

Your OrangeChain application is now fully set up and ready to use.

Start all services and visit http://localhost:5173

Happy farming! 🍊

