#!/bin/bash

# OrangeChain Complete Project - Setup and Run Guide
# This script provides all commands to set up and run the complete OrangeChain project

set -e

echo "=================================================="
echo "  OrangeChain Complete Project Setup"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Error: package.json not found!${NC}"
    echo "Please run this script from the OrangeChain project root directory"
    exit 1
fi

echo -e "${BLUE}Step 1: Installing Dependencies${NC}"
echo "This will install all required npm packages..."
echo ""

# Install dependencies
npm install

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}Step 2: Checking Backend Requirements${NC}"
echo "The following services need to be running:"
echo "  - MongoDB (default: localhost:27017)"
echo "  - ML Service (default: localhost:8000)"
echo "  - Blockchain Service (default: localhost:5001)"
echo ""
echo "Make sure these are running before starting the application!"
echo ""

echo -e "${BLUE}Step 3: Environment Variables${NC}"
if [ ! -f "backend/.env" ]; then
    echo "Creating .env file in backend directory..."
    mkdir -p backend
    cat > backend/.env << 'EOF'
# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/orangechain

# Server
PORT=5000
NODE_ENV=development

# Blockchain
BLOCKCHAIN_URL=http://localhost:5001

# ML Service
ML_URL=http://localhost:8000

# JWT
JWT_SECRET=your_jwt_secret_key_change_this

# Cors
CORS_ORIGIN=http://localhost:5173
EOF
    echo -e "${GREEN}✓ Created backend/.env file${NC}"
else
    echo -e "${GREEN}✓ backend/.env already exists${NC}"
fi

echo ""
echo "=================================================="
echo "  Commands to Run OrangeChain"
echo "=================================================="
echo ""

echo -e "${BLUE}Option 1: Run Everything Together${NC}"
echo "---"
echo "# Terminal 1 - Start Backend Server"
echo "cd backend && npm start"
echo ""
echo "# Terminal 2 - Start Frontend"
echo "npm run dev"
echo ""
echo "# Terminal 3 - Start Blockchain Service"
echo "cd backend && python blockchain.py"
echo ""
echo "# Terminal 4 - Start ML Service (if separate)"
echo "cd ml_service && python app.py  # Or wherever your ML service is"
echo ""

echo -e "${BLUE}Option 2: Run in One Terminal (Using start.sh)${NC}"
echo "---"
echo "chmod +x start.sh"
echo "./start.sh"
echo ""

echo -e "${BLUE}Option 3: Individual Commands${NC}"
echo "---"
echo ""

echo "# Start Backend Server"
echo "cd backend && npm start"
echo ""

echo "# Start Frontend (in new terminal)"
echo "npm run dev"
echo ""

echo "# Start Blockchain Service (in new terminal)"
echo "cd backend && python blockchain.py"
echo ""

echo "=================================================="
echo "  After Services Start"
echo "=================================================="
echo ""

echo -e "${GREEN}Frontend will be available at:${NC}"
echo "  http://localhost:5173"
echo ""

echo -e "${GREEN}Backend API will be at:${NC}"
echo "  http://localhost:5000"
echo ""

echo -e "${GREEN}Blockchain service at:${NC}"
echo "  http://localhost:5001"
echo ""

echo "=================================================="
echo "  Database Setup"
echo "=================================================="
echo ""

echo "First time setup - Create default admin:"
echo ""
echo "# POST to create user"
echo "curl -X POST http://localhost:5000/api/auth/signup \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"username\": \"farmer1\", \"email\": \"farmer@example.com\", \"password\": \"password123\", \"role\": \"farmer\"}'"
echo ""

echo "=================================================="
echo "  Project Features"
echo "=================================================="
echo ""

echo -e "${GREEN}✓ Payment System${NC}"
echo "  - UPI integration with QR codes"
echo "  - Automatic status updates"
echo "  - Blockchain mining on delivery"
echo ""

echo -e "${GREEN}✓ ML Integration${NC}"
echo "  - Price prediction for multiple markets"
echo "  - Real-time recommendations (BUY/SELL/HOLD)"
echo "  - Historical data analysis"
echo "  - Demand signal monitoring"
echo ""

echo -e "${GREEN}✓ Dashboards${NC}"
echo "  - Farmer Dashboard with price predictions"
echo "  - Trader Dashboard with market analysis"
echo "  - Historic data visualization"
echo ""

echo -e "${GREEN}✓ Blockchain${NC}"
echo "  - Immutable transaction records"
echo "  - Proof-of-Work consensus"
echo "  - Cryptographic verification"
echo ""

echo "=================================================="
echo "  Troubleshooting"
echo "=================================================="
echo ""

echo "If MongoDB is not running:"
echo "  mongod"
echo ""

echo "If you get CORS errors:"
echo "  - Check CORS_ORIGIN in backend/.env matches your frontend URL"
echo "  - Restart backend server"
echo ""

echo "If ML predictions not loading:"
echo "  - Verify ML service is running"
echo "  - Check ML_URL in backend/.env"
echo "  - Verify /api/ml/predict endpoint is accessible"
echo ""

echo "If Blockchain is not working:"
echo "  - Check Python 3 is installed"
echo "  - Install Flask: pip install flask flask-cors"
echo "  - Verify port 5001 is not in use"
echo ""

echo "=================================================="
echo "  Next Steps"
echo "=================================================="
echo ""

echo "1. Ensure MongoDB is running:"
echo "   mongod"
echo ""

echo "2. Open 3-4 terminals and run:"
echo "   Terminal 1: cd backend && npm start"
echo "   Terminal 2: npm run dev"
echo "   Terminal 3: cd backend && python blockchain.py"
echo "   Terminal 4: cd backend && python ml_service.py (if separate)"
echo ""

echo "3. Open http://localhost:5173 in your browser"
echo ""

echo "4. Create a test account:"
echo "   - Sign up as a Farmer"
echo "   - Try the Price Prediction tab"
echo "   - Check Historic Data tab"
echo ""

echo -e "${GREEN}Setup complete!${NC}"
echo ""
