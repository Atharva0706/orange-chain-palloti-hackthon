# 🍊 OrangeChain - Complete Agricultural Marketplace Platform

**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

- [Overview](#-overview)
- [What's Included](#-whats-included)
- [Quick Start](#-quick-start)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Dashboard Features](#-dashboard-features)
- [Payment System](#-payment-system)
- [ML Integration](#-ml-integration)
- [Blockchain Integration](#-blockchain-integration)
- [Troubleshooting](#-troubleshooting)
- [Deployment](#-deployment)
- [Support](#-support)

---

## 🎯 Overview

OrangeChain is a complete agricultural marketplace platform that connects farmers, buyers, and traders. It provides:

- **Smart listing and purchasing** of agricultural produce
- **AI-powered price predictions** using machine learning
- **Secure payments** with UPI integration
- **Immutable transaction records** using blockchain
- **Real-time market analysis** for better decision making

### Who Uses OrangeChain?

| User Type | Features |
|-----------|----------|
| **Farmers** | Publish listings, View price predictions, Receive payments, Track sales |
| **Buyers** | Browse produce, Make purchases, Confirm deliveries, Make payments |
| **Traders** | Analyze markets, Track trends, Make trading decisions |

---

## 📦 What's Included

This is a **COMPLETE, PRODUCTION-READY** project with:

### ✅ Frontend (React + TypeScript)
- Beautiful responsive UI
- Real-time charts and data visualization
- ML-powered dashboards
- Mobile-friendly design
- Dark/Light mode support

### ✅ Backend (Node.js + Express)
- RESTful API with full authentication
- MongoDB database integration
- Payment processing
- ML service integration
- Blockchain service integration

### ✅ Additional Services
- **Blockchain Service** (Python Flask) - Immutable transaction records
- **ML Service** - Real-time price predictions
- **Payment System** - UPI integration with QR codes

### ✅ Documentation
- QUICK_START.md - 5-minute setup
- IMPLEMENTATION_GUIDE.md - Detailed guide
- RUN_COMMANDS.md - All commands
- ML_INTEGRATION_GUIDE.md - ML details
- DASHBOARD_UPDATE_SUMMARY.md - Dashboard changes

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ (`node --version`)
- MongoDB running locally or MongoDB Atlas account
- Python 3.8+ (`python --version`)

### 30-Second Setup

```bash
# 1. Install dependencies
npm install && cd backend && npm install && cd ..

# 2. Create .env file
cat > backend/.env << 'EOF'
MONGODB_URI=mongodb://127.0.0.1:27017/orangechain
PORT=5000
NODE_ENV=development
BLOCKCHAIN_URL=http://localhost:5001
ML_URL=http://localhost:8000
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173
EOF

# 3. Start services (open 4 terminals)
# Terminal 1
cd backend && npm start

# Terminal 2
npm run dev

# Terminal 3
cd backend && python blockchain.py
```

Then open: **http://localhost:5173** 🎉

---

## ✨ Features

### 🎯 Core Features

#### 1. User Management
- ✅ Multi-role authentication (Farmer, Buyer, Trader)
- ✅ User profile management
- ✅ Role-based access control
- ✅ JWT token authentication

#### 2. Listing & Discovery
- ✅ Create and manage crop listings
- ✅ Search and filter produce
- ✅ View farmer details
- ✅ Real-time inventory updates

#### 3. 💰 Payment System
- ✅ UPI integration with QR codes
- ✅ Real-time payment confirmation
- ✅ Automatic status updates
- ✅ Escrow-like payment protection
- ✅ Transaction history

#### 4. 🤖 ML-Powered Predictions
- ✅ Real-time price predictions
- ✅ Market analysis for 6 regions
- ✅ Intelligent recommendations (BUY/SELL/HOLD)
- ✅ Demand signal monitoring
- ✅ Historical trend analysis
- ✅ Statistical insights

#### 5. 📊 Interactive Dashboards
- ✅ **Farmer Dashboard**: Listings, predictions, sales
- ✅ **Trader Dashboard**: Market analysis, trends
- ✅ **Buyer Dashboard**: Shopping, orders, history
- ✅ Beautiful charts and visualizations
- ✅ Real-time data updates

#### 6. ⛓️ Blockchain Integration
- ✅ Immutable transaction records
- ✅ Proof-of-Work consensus
- ✅ Cryptographic verification
- ✅ Chain validation
- ✅ Smart contract support

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **Recharts** for data visualization
- **Lucide Icons** for UI elements

### Backend
- **Node.js + Express** for API
- **MongoDB** for database
- **Mongoose** for database ORM
- **JWT** for authentication
- **Bcrypt** for password hashing

### Additional Services
- **Python Flask** for Blockchain service
- **Python** for ML service
- **Socket.IO** for real-time updates (optional)

### Deployment
- **Docker** support included
- **Docker Compose** for multi-service setup
- **Environment-based configuration**

---

## 📁 Project Structure

```
OrangeChain/
├── src/                           # React Frontend
│   ├── pages/
│   │   ├── FarmerDashboard.tsx    # ✨ Farmer with ML predictions
│   │   ├── TraderDashboard.tsx    # ✨ Trader with market analysis
│   │   ├── BuyerDashboard.tsx     # Buyer dashboard
│   │   └── ...
│   ├── components/
│   │   ├── Charts/
│   │   ├── Forms/
│   │   └── Layout/
│   ├── context/
│   │   └── AuthContext.tsx        # Authentication
│   ├── services/
│   │   ├── api.ts                 # API calls
│   │   └── blockchain.ts          # Blockchain calls
│   └── App.tsx
│
├── backend/                       # Node.js Backend
│   ├── routes/
│   │   ├── auth.js                # Authentication
│   │   ├── farmer.js              # Farmer operations
│   │   ├── buyer.js               # Buyer operations
│   │   ├── payment.js             # ✨ Payment system
│   │   ├── blockchain.js          # Blockchain calls
│   │   └── ml.js                  # ✨ ML predictions
│   ├── models/
│   │   ├── User.js
│   │   ├── Produce.js
│   │   ├── Transaction.js         # ✨ Updated with payment fields
│   │   └── ...
│   ├── middleware/
│   │   └── auth.js
│   ├── blockchain.py              # Blockchain service
│   ├── ml_service.py              # ML predictions service
│   └── server.js                  # Express server
│
├── public/                        # Static assets
├── QUICK_START.md                 # Quick setup
├── IMPLEMENTATION_GUIDE.md        # Detailed guide
├── RUN_COMMANDS.md                # All commands
├── package.json
└── README.md                      # This file
```

---

## 🎓 Getting Started

### Step 1: Prerequisites

```bash
# Check Node.js
node --version  # Should be v16+

# Check npm
npm --version   # Should be v7+

# Check Python
python --version  # Should be 3.8+

# Ensure MongoDB is accessible
# Either local: mongod running
# Or cloud: MongoDB Atlas connection string
```

### Step 2: Installation

```bash
# Clone/Extract project
cd OrangeChain

# Install all dependencies
npm install
cd backend && npm install && cd ..

# Install Python dependencies
pip install flask flask-cors
```

### Step 3: Configuration

```bash
# Create backend/.env file
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

### Step 4: Start Services

See [Running the Application](#-running-the-application) section below.

---

## 🚀 Running the Application

### Method 1: Using 4 Terminals (Recommended)

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
# Expected: ✅ Backend running on port 5000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Expected: http://localhost:5173/
```

**Terminal 3 - Blockchain:**
```bash
cd backend
python blockchain.py
# Expected: OrangeChain Blockchain Node running on http://localhost:5001
```

**Terminal 4 - ML Service (Optional):**
```bash
cd backend
python ml_service.py
# Expected: ML Service running on port 8000
```

### Method 2: Using Shell Script

```bash
chmod +x start.sh
./start.sh
```

### Method 3: One Terminal Sequential

```bash
npm run dev &
cd backend && npm start &
cd backend && python blockchain.py
```

---

## 📍 Access Points

After starting services:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React application |
| Backend API | http://localhost:5000 | Express API |
| Blockchain | http://localhost:5001 | Blockchain service |
| ML Service | http://localhost:8000 | ML predictions |

---

## 📡 API Documentation

### Authentication

```bash
# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "farmer1",
    "email": "farmer@example.com",
    "password": "password123",
    "role": "farmer"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "password123"
  }'
```

### ML Predictions

```bash
# Get price prediction for a market
curl "http://localhost:5000/api/ml/predict?market=Nagpur%20APMC"

# Response includes:
# - min_price (conservative estimate)
# - modal_price (most likely price)
# - max_price (optimistic estimate)
# - recommendation (BUY/SELL/HOLD)
# - demand_signal
```

### Payment Endpoints

```bash
# Generate UPI link
POST /api/payment/generate-upi/:transactionId

# Confirm payment
POST /api/payment/confirm/:transactionId

# Mark shipped
POST /api/payment/mark-shipped/:transactionId

# Confirm delivery (triggers blockchain mining)
POST /api/payment/confirm-delivery/:transactionId
```

### Blockchain Endpoints

```bash
# Get blockchain
GET /api/blockchain/chain

# Validate chain
GET /api/blockchain/validate

# Get transaction
GET /api/blockchain/transaction/:txId
```

See **RUN_COMMANDS.md** for complete API reference.

---

## 📊 Dashboard Features

### Farmer Dashboard

**Publish Listing Tab:**
- Create and publish crop listings
- Set quantity and price
- Configure pickup date

**Price Prediction Tab:** ✨ NEW
- Select market from dropdown (6 options)
- View ML price predictions
- See recommendations (BUY/SELL/HOLD)
- Check demand signals
- Review historical trends

**Historic Data Tab:** ✨ NEW
- 8 months of price history
- Interactive area chart
- Time range selection (7D, 1M, 6M, 1Y)
- Statistics (avg, max, min price)

**Sales & Orders Tab:**
- View incoming orders
- Manage shipments
- Track payments

### Trader Dashboard

**Price Analysis Tab:**
- Select market
- View price predictions
- See recommendations
- Analyze demand signals

**Historic Data Tab:**
- Historical price trends
- Comparative analysis
- Statistical insights

### Buyer Dashboard

- Browse available produce
- Search and filter
- Make purchases
- Confirm deliveries
- View transaction history

---

## 💰 Payment System

### How It Works

1. **Initiate Purchase** → User clicks "Buy"
2. **Generate UPI Link** → System creates QR code + payment link
3. **Payment Confirmation** → User confirms payment made
4. **Auto-Update Status** → "Pending Deposit" → "Deposited"
5. **Farmer Ships** → Status → "In Transit"
6. **Delivery Confirmation** → Triggers blockchain mining
7. **Auto-Update to Released** → Payment sent to farmer

### Status Flow

```
Pending Deposit 
    ↓
Deposited (Payment Confirmed)
    ↓
In Transit (Farmer Shipped)
    ↓
Delivered (Buyer Confirmed)
    ↓
Payment Released (Mined to Blockchain) ✅
```

---

## 🤖 ML Integration

### Markets Available

- Nagpur APMC
- Jalna Mandi
- Aurangabad Market
- Parbhani APMC
- Beed Market
- Washim Mandi

### Price Predictions

The ML service returns:

```json
{
  "predicted_prices": {
    "min_price": 3005,
    "modal_price": 4387,
    "max_price": 4157
  },
  "recommendation": "SELL",
  "demand_signal": {
    "pressure": "OVERSUPPLY"
  },
  "trend": "Stable"
}
```

### How Recommendations Work

- **SELL** (Orange): Prices expected to peak soon
- **BUY** (Green): Prices expected to rise
- **HOLD** (Amber): Prices stable, wait

---

## ⛓️ Blockchain Integration

### What's Stored

When delivery is confirmed, a block is mined containing:
- Transaction ID
- Produce details
- Farmer & buyer info
- Amount
- Timestamp
- Status: "Payment Released"

### Why Blockchain?

✅ **Immutable records** - Can't be altered  
✅ **Transparent** - All parties can verify  
✅ **Trustless** - No middleman needed  
✅ **Verifiable** - Cryptographic proof

---

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
# Start MongoDB
mongod

# Or use MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/orangechain
```

### Port Already in Use

```bash
# Find process on port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### ML Predictions Not Loading

```bash
# Verify ML service is running
curl http://localhost:8000/health

# Check endpoint
curl "http://localhost:5000/api/ml/predict?market=Nagpur"
```

### Frontend Not Loading

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run dev
```

See **RUN_COMMANDS.md** for more troubleshooting steps.

---

## 🚀 Deployment

### Production Build

```bash
npm run build
NODE_ENV=production npm start
```

### Using Docker

```bash
docker-compose up
```

### Environment for Production

```bash
NODE_ENV=production
JWT_SECRET=<strong_random_key>
MONGODB_URI=<production_mongodb_url>
CORS_ORIGIN=<your_domain>
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **QUICK_START.md** | 5-minute quick setup |
| **IMPLEMENTATION_GUIDE.md** | Detailed step-by-step |
| **RUN_COMMANDS.md** | All commands reference |
| **ML_INTEGRATION_GUIDE.md** | ML service details |
| **DASHBOARD_UPDATE_SUMMARY.md** | Dashboard changes |

---

## 🎯 Key Commands

```bash
# Install dependencies
npm install && cd backend && npm install && cd ..

# Start frontend
npm run dev

# Start backend
cd backend && npm start

# Start blockchain
cd backend && python blockchain.py

# Test API
curl http://localhost:5000/api/health

# Test ML
curl "http://localhost:5000/api/ml/predict?market=Nagpur%20APMC"

# Build for production
npm run build
```

---

## ✅ Pre-Launch Checklist

- [ ] All dependencies installed
- [ ] MongoDB running or connected
- [ ] .env file configured
- [ ] Backend starts without errors
- [ ] Frontend loads at localhost:5173
- [ ] Blockchain service running
- [ ] ML service accessible
- [ ] Can create user account
- [ ] Can view price predictions
- [ ] Payment flow works
- [ ] No console errors

---

## 💡 Tips & Best Practices

1. **Use 4 Terminals** - Each service in its own terminal for easier debugging
2. **Check Logs** - Always check terminal logs first for errors
3. **Test APIs** - Use curl or Postman to test endpoints
4. **Monitor MongoDB** - Use mongosh to check database
5. **Environment Variables** - Never commit .env to git
6. **Keep Updated** - Run `npm update` regularly

---

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Docs](https://docs.mongodb.com)
- [Blockchain Basics](https://www.investopedia.com/terms/b/blockchain.asp)
- [Machine Learning](https://www.tensorflow.org)

---

## 📞 Support & Contact

For issues or questions:
1. Check **RUN_COMMANDS.md** troubleshooting section
2. Review **IMPLEMENTATION_GUIDE.md**
3. Check browser console for errors (F12)
4. Verify services are running

---

## 📄 License

This project is provided as-is for educational and commercial use.

---

## 🎉 Ready to Launch!

You now have a **complete, production-ready** agricultural marketplace platform with:

✅ Beautiful React frontend  
✅ Full-featured Node.js backend  
✅ AI-powered price predictions  
✅ Secure payment processing  
✅ Blockchain transaction records  

**Start the services and begin using OrangeChain today!**

```bash
# Terminal 1
cd backend && npm start

# Terminal 2
npm run dev

# Terminal 3
cd backend && python blockchain.py

# Then open: http://localhost:5173
```

---

**Happy farming! 🍊**

Version 1.0.0 | Last Updated: March 28, 2026

