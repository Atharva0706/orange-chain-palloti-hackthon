# OrangeChain Complete Project - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js (v16+) and npm
- MongoDB running locally or remote connection
- Python 3.8+ (for blockchain service)
- Git

### 1️⃣ Install Dependencies

```bash
npm install
cd backend
npm install
cd ..
```

### 2️⃣ Configure Environment

```bash
# Create backend/.env file with:
cat > backend/.env << 'EOF'
MONGODB_URI=mongodb://127.0.0.1:27017/orangechain
PORT=5000
NODE_ENV=development
BLOCKCHAIN_URL=http://localhost:5001
ML_URL=http://localhost:8000
JWT_SECRET=your_jwt_secret_key_change_this
CORS_ORIGIN=http://localhost:5173
EOF
```

### 3️⃣ Start All Services

**Open 4 terminals:**

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Terminal 3 - Blockchain Service:**
```bash
cd backend
python blockchain.py
```

**Terminal 4 - ML Service (if separate):**
```bash
# If your ML service is in ml_service folder
cd backend/ml_service
python app.py
```

### 4️⃣ Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Blockchain**: http://localhost:5001

### 5️⃣ Create Test Account

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "farmer1",
    "email": "farmer@example.com",
    "password": "password123",
    "role": "farmer"
  }'
```

---

## 📋 Complete Command Reference

### Database Setup

```bash
# Start MongoDB (if not running)
mongod

# Connect to MongoDB shell
mongosh
```

### Frontend Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Commands

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start backend server
npm start

# Run blockchain service
python blockchain.py

# Run ML service
python ml_service.py
```

### Testing Endpoints

```bash
# Health check
curl http://localhost:5000/api/health

# Get available produce
curl http://localhost:5000/api/buyer/produce

# Get ML prediction for a market
curl "http://localhost:5000/api/ml/predict?market=Nagpur%20APMC"

# Get blockchain chain
curl http://localhost:5000/api/blockchain/chain
```

---

## 🎯 Features Overview

### 1. Payment System
- UPI QR code generation
- Automatic payment confirmation
- Status auto-updates
- Blockchain mining on delivery

### 2. ML Integration
- Real-time price predictions
- Market analysis for multiple regions
- Recommendations (BUY/SELL/HOLD)
- Historical data trends

### 3. Dashboards
- **Farmer Dashboard**: Publish listings, view price predictions
- **Trader Dashboard**: Market analysis and trading insights

### 4. Blockchain
- Immutable transaction records
- Proof-of-Work consensus
- Smart contract support

---

## 📊 Dashboard Tabs

### Farmer Dashboard

1. **Publish Listing** - Create and publish crop listings
2. **Price Prediction** - ML-powered price forecasting
3. **Historic Data** - Historical price trends
4. **Sales & Orders** - Order management

### Trader Dashboard

1. **Price Analysis** - Market predictions
2. **Historic Data** - Commodity trends

---

## 🔧 Configuration

### Environment Variables (backend/.env)

```
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/orangechain

# Server
PORT=5000
NODE_ENV=development

# Services
BLOCKCHAIN_URL=http://localhost:5001
ML_URL=http://localhost:8000

# Authentication
JWT_SECRET=your_secret_key_here

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Start MongoDB
mongod

# Or use remote MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/orangechain
```

### Port Already in Use
```bash
# Find process using port
lsof -i :5000  # For backend
lsof -i :5173  # For frontend
lsof -i :5001  # For blockchain

# Kill the process
kill -9 <PID>
```

### CORS Errors
- Check CORS_ORIGIN matches your frontend URL
- Restart backend server after changing .env

### ML Predictions Not Loading
- Verify ML service is running
- Check ML_URL in .env
- Test endpoint: `curl http://localhost:8000/api/ml/predict?market=Nagpur`

### Blockchain Errors
- Ensure Python 3 is installed
- Install Flask: `pip install flask flask-cors`
- Check port 5001 is available

---

## 📱 Project Structure

```
OrangeChain/
├── src/                    # React frontend
│   ├── pages/
│   │   ├── FarmerDashboard.tsx (updated with ML)
│   │   ├── TraderDashboard.tsx (updated with ML)
│   │   └── ...
│   ├── components/
│   ├── context/
│   └── ...
├── backend/               # Node.js/Express backend
│   ├── routes/
│   ├── models/
│   ├── blockchain.py     # Blockchain service
│   ├── ml_service.py     # ML service (if integrated)
│   └── server.js
├── public/               # Static assets
└── package.json
```

---

## 🎓 Key API Endpoints

### Authentication
- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Farmer Operations
- `POST /api/farmer/produce` - List produce
- `GET /api/farmer/produce` - Get farmer's listings
- `PUT /api/farmer/produce/:id` - Update listing

### Buyer Operations
- `GET /api/buyer/produce` - Get all produce
- `POST /api/buyer/buy/:id` - Purchase produce

### Payments
- `POST /api/payment/generate-upi/:transactionId` - Generate UPI
- `POST /api/payment/confirm/:transactionId` - Confirm payment
- `GET /api/payment/status/:transactionId` - Get payment status

### ML Service
- `GET /api/ml/predict?market={name}` - Get price predictions
- `GET /api/ml/markets` - Get available markets

### Blockchain
- `GET /api/blockchain/chain` - Get blockchain
- `POST /api/blockchain/mine` - Mine block
- `GET /api/blockchain/validate` - Validate chain

---

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Docker (if available)
```bash
docker-compose up
```

---

## 📞 Support & Documentation

- **README.md** - Project overview
- **README_INTEGRATION.md** - Integration guide
- **ML_INTEGRATION_GUIDE.md** - ML service details
- **DASHBOARD_UPDATE_SUMMARY.md** - Dashboard changes

---

## ✅ Checklist Before Going Live

- [ ] MongoDB is running and accessible
- [ ] All npm dependencies installed
- [ ] Environment variables configured (.env)
- [ ] Backend server starts without errors
- [ ] Frontend loads at localhost:5173
- [ ] Blockchain service running on port 5001
- [ ] ML service accessible
- [ ] Can create user account
- [ ] Can view price predictions
- [ ] Payment flow works end-to-end
- [ ] No console errors in browser

---

## 🎉 You're All Set!

Start the services and begin using OrangeChain!

```bash
# Terminal 1
cd backend && npm start

# Terminal 2
npm run dev

# Terminal 3
cd backend && python blockchain.py
```

Visit http://localhost:5173 and enjoy! 🍊

