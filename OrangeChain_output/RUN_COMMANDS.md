# OrangeChain - Complete Run Commands

## 🚀 Quick Commands Reference

Copy and paste these commands to run OrangeChain.

---

## Prerequisites Setup

### 1. Install Node.js (if not installed)

**macOS:**
```bash
brew install node
```

**Linux (Ubuntu):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
Download from https://nodejs.org/

### 2. Install MongoDB (if not installed)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongod
```

**Windows:**
```bash
choco install mongodb
```

**Or Use MongoDB Atlas (Cloud):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster and get connection string
4. Update `MONGODB_URI` in `backend/.env`

### 3. Install Python (if not installed)

**macOS:**
```bash
brew install python3
```

**Linux (Ubuntu):**
```bash
sudo apt-get install -y python3 python3-pip
```

**Windows:**
Download from https://www.python.org/

---

## ⚡ Quick Start (Fastest Way)

```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..

# 2. Create .env file
cat > backend/.env << 'EOF'
MONGODB_URI=mongodb://127.0.0.1:27017/orangechain
PORT=5000
NODE_ENV=development
BLOCKCHAIN_URL=http://localhost:5001
ML_URL=http://localhost:8000
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=http://localhost:5173
EOF

# 3. Start all services (in separate terminals)

# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
npm run dev

# Terminal 3 - Blockchain
cd backend && python blockchain.py

# Terminal 4 - ML Service (if available)
cd backend && python ml_service.py
```

Then open: **http://localhost:5173**

---

## 📝 Step-by-Step Commands

### Step 1: Extract and Navigate

```bash
# Extract the ZIP file
unzip OrangeChain_Complete.zip

# Navigate to project
cd OrangeChain
```

### Step 2: Install All Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install Python dependencies
pip install flask flask-cors

# Return to project root
cd ..
```

### Step 3: Configure Environment

```bash
# Create backend/.env file
cat > backend/.env << 'EOF'
MONGODB_URI=mongodb://127.0.0.1:27017/orangechain
PORT=5000
NODE_ENV=development
BLOCKCHAIN_URL=http://localhost:5001
ML_URL=http://localhost:8000
JWT_SECRET=orangechain_dev_secret
CORS_ORIGIN=http://localhost:5173
EOF
```

### Step 4: Start All Services

**Option A: Using 4 Terminals (Recommended)**

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
```
Expected: `✅ Backend running on port 5000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Expected: `http://localhost:5173/`

**Terminal 3 - Blockchain Service:**
```bash
cd backend
python blockchain.py
```
Expected: `OrangeChain Blockchain Node running on http://localhost:5001`

**Terminal 4 - ML Service (Optional):**
```bash
cd backend
# If ml_service.py exists
python ml_service.py
```

**Option B: Using One Terminal (Sequential)**

```bash
# Terminal 1
npm run dev &

# Terminal 2  
cd backend && npm start &

# Terminal 3
cd backend && python blockchain.py
```

**Option C: Using Shell Script**

```bash
chmod +x start.sh
./start.sh
```

### Step 5: Access Application

**Frontend:** http://localhost:5173  
**Backend API:** http://localhost:5000  
**Blockchain:** http://localhost:5001

---

## 🧪 Testing Commands

### Test Backend Health

```bash
curl http://localhost:5000/api/health
```

### Create Test Farmer Account

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

### Create Test Buyer Account

```bash
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
curl "http://localhost:5000/api/ml/predict?market=Nagpur%20APMC"
```

### Test Blockchain

```bash
curl http://localhost:5000/api/blockchain/chain
```

### Test Available Produce

```bash
curl http://localhost:5000/api/buyer/produce
```

---

## 🔧 Individual Service Commands

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

# Check code quality
npm run lint
```

### Backend Commands

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start backend server
npm start

# Start with nodemon (auto-reload)
npm run dev

# Check logs
npm start 2>&1 | tee backend.log
```

### Blockchain Service Commands

```bash
# Navigate to backend
cd backend

# Start blockchain service
python blockchain.py

# Or with logging
python blockchain.py > blockchain.log 2>&1
```

### ML Service Commands

```bash
# Navigate to backend
cd backend

# Start ML service
python ml_service.py

# Or with logging
python ml_service.py > ml.log 2>&1
```

---

## 📦 Database Commands

### Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows (if using MongoDB)
mongod
```

### Connect to MongoDB

```bash
# Using mongosh (new shell)
mongosh

# Or using legacy mongo shell
mongo
```

### View Database

```bash
# Connect to database
mongosh

# Inside mongosh
show dbs
use orangechain
db.users.find()
db.produces.find()
db.transactions.find()
```

### Reset Database

```bash
# Connect to MongoDB
mongosh

# Drop database
db.dropDatabase()
```

---

## 🐛 Troubleshooting Commands

### Check if Services are Running

```bash
# Check backend
curl http://localhost:5000/api/health

# Check blockchain
curl http://localhost:5001/health

# Check ML service
curl http://localhost:8000/health

# Check MongoDB
mongosh --eval "db.version()"
```

### Find and Kill Process on Port

```bash
# Find process
lsof -i :5000  # Backend
lsof -i :5173  # Frontend
lsof -i :5001  # Blockchain

# Kill process
kill -9 <PID>
```

### Clear Cache and Reinstall

```bash
# Frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
cd ..
```

### Check Node/npm Versions

```bash
node --version
npm --version
python --version
```

### View Application Logs

```bash
# Backend logs (if running)
npm start

# Frontend logs (in browser console)
# Open http://localhost:5173
# Press F12 to open Developer Tools
# Go to Console tab

# Blockchain logs
python blockchain.py  # Shows output directly
```

---

## 🚀 Production Deployment Commands

### Build Frontend for Production

```bash
npm run build
```

### Start Backend in Production

```bash
cd backend
NODE_ENV=production npm start
```

### Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
pm2 start backend/server.js --name "orangechain-backend"

# Start blockchain with PM2
pm2 start backend/blockchain.py --name "orangechain-blockchain" --interpreter python

# View running processes
pm2 list

# View logs
pm2 logs orangechain-backend
```

### Using Docker (if available)

```bash
# Build Docker image
docker build -t orangechain .

# Run Docker container
docker run -p 5000:5000 -p 5173:5173 orangechain

# Using docker-compose
docker-compose up
```

---

## 📊 Environment Variables

### Create .env File

```bash
cat > backend/.env << 'EOF'
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/orangechain

# Server
PORT=5000
NODE_ENV=development

# Services
BLOCKCHAIN_URL=http://localhost:5001
ML_URL=http://localhost:8000

# Security
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EOF
```

### Change Database

```bash
# For MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/orangechain

# For Local MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/orangechain

# For Remote MongoDB
MONGODB_URI=mongodb://your_server_ip:27017/orangechain
```

---

## 📱 Useful Browser Commands

### Check Frontend in Console

```javascript
// In browser console (F12 > Console tab)

// Check API URL
console.log(import.meta.env.VITE_API_URL)

// Make test API call
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

---

## ⏱️ Typical Startup Time

| Component | Time |
|-----------|------|
| Frontend | ~5 seconds |
| Backend | ~3 seconds |
| MongoDB | ~2 seconds |
| Blockchain | ~2 seconds |
| Total | ~12 seconds |

---

## 🎯 Common Workflows

### First Time Setup

```bash
# 1. Install dependencies
npm install && cd backend && npm install && cd ..

# 2. Create .env file
cp backend/.env.example backend/.env
# Edit .env file as needed

# 3. Start services (in 4 terminals)
# Terminal 1
cd backend && npm start

# Terminal 2
npm run dev

# Terminal 3
cd backend && python blockchain.py

# Terminal 4 (if needed)
cd backend && python ml_service.py

# 4. Open browser
# http://localhost:5173
```

### Daily Development

```bash
# Start all services
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
npm run dev

# Terminal 3: Blockchain
cd backend && python blockchain.py

# Edit code and see changes live
```

### Testing

```bash
# In new terminal, test endpoints
curl http://localhost:5000/api/health
curl "http://localhost:5000/api/ml/predict?market=Nagpur"

# Or use Postman/Insomnia
# Import endpoints from documentation
```

### Debugging

```bash
# View all logs
npm start  # Shows everything
# Ctrl+C to stop

# Or save to file
npm start > app.log 2>&1

# View log file
tail -f app.log
```

---

## 🆘 Emergency Commands

### Restart Everything

```bash
# Kill all services
pkill -f "npm start"
pkill -f "python blockchain.py"
pkill -f "python ml_service.py"

# Restart MongoDB
mongod

# Start all services fresh (in 4 terminals)
cd backend && npm start
npm run dev
cd backend && python blockchain.py
```

### Clear Everything and Reset

```bash
# Stop all services
pkill -f "npm start"
pkill -f "python"
pkill -f "mongod"

# Remove dependencies
rm -rf node_modules backend/node_modules
rm package-lock.json backend/package-lock.json

# Drop database
mongosh --eval "db.dropDatabase()"

# Reinstall everything
npm install
cd backend && npm install && cd ..

# Restart services
# Follow startup instructions
```

---

## 📞 Quick Help

### Service Won't Start?

```bash
# 1. Check if port is in use
lsof -i :5000

# 2. Check if dependencies are installed
npm list

# 3. Check Node version
node --version  # Should be v16+

# 4. Clear cache
npm cache clean --force

# 5. Reinstall
rm -rf node_modules && npm install
```

### Database Connection Error?

```bash
# 1. Check if MongoDB is running
ps aux | grep mongod

# 2. Start MongoDB
mongod

# 3. Test connection
mongosh

# 4. Check MONGODB_URI in .env
cat backend/.env | grep MONGODB_URI
```

### ML Predictions Not Working?

```bash
# 1. Check if ML service is running
curl http://localhost:8000/health

# 2. Test ML endpoint
curl "http://localhost:5000/api/ml/predict?market=Nagpur%20APMC"

# 3. Check ML_URL in .env
cat backend/.env | grep ML_URL

# 4. Restart ML service
cd backend && python ml_service.py
```

---

## 🎉 Success Indicators

When everything is running correctly, you should see:

✅ Frontend: http://localhost:5173 (loads without errors)  
✅ Backend: http://localhost:5000/api/health (returns {"status": "ok"})  
✅ Blockchain: http://localhost:5001/health (returns blockchain info)  
✅ Browser Console: No red errors  
✅ Terminal: No crash messages  

---

## 📚 More Information

- **QUICK_START.md** - Quick setup guide
- **IMPLEMENTATION_GUIDE.md** - Detailed implementation
- **README.md** - Project overview
- **ML_INTEGRATION_GUIDE.md** - ML service details
- **DASHBOARD_UPDATE_SUMMARY.md** - Dashboard changes

---

**Ready to run OrangeChain? Start with the Quick Start section above! 🚀**

