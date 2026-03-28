# OrangeChain — How to Run

## Requirements
- Node.js 18+
- MongoDB running locally on port 27017
- Python 3.8+

---

## Step 1 — Python Blockchain Service (port 5001)
```bash
cd backend
pip install flask flask-cors
python blockchain.py
```

## Step 2 — Node.js Backend (port 5000)
```bash
cd backend
npm install
npm start
```

## Step 3 — React Frontend (port 5173)
```bash
# from orange-chain root
npm install
npm run dev
```

---

## Full Workflow
1. Register as **Farmer** → List produce (with AI grading)
2. Register as **Buyer** → Browse market → Initiate escrow
3. Buyer: advance escrow steps (Deposited → In Transit)
4. Buyer: click **"Confirm Delivery (Mine Block)"**
   - This calls `/api/blockchain/confirm/:id`
   - Node backend sends tx to Python blockchain
   - Python mines a block (Proof-of-Work, 3 leading zeros)
   - Block hash stored in MongoDB
5. View mined blocks in **Blockchain Ledger** (Wallet tab)
6. Mission Control shows live blockchain ticker from real data

## API Endpoints
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET  /api/auth/me`

### Farmer
- `POST /api/farmer/produce`
- `GET  /api/farmer/produce`
- `DELETE /api/farmer/produce/:id`
- `GET  /api/farmer/transactions`

### Buyer
- `GET  /api/buyer/produce`
- `POST /api/buyer/buy/:id`
- `GET  /api/buyer/transactions`

### Blockchain
- `GET  /api/blockchain/chain`
- `GET  /api/blockchain/pending`
- `POST /api/blockchain/confirm/:transactionId`
- `PUT  /api/blockchain/status/:transactionId`

### Python Blockchain (direct)
- `GET  http://localhost:5001/get_chain`
- `POST http://localhost:5001/add_transaction`
- `POST http://localhost:5001/mine_block`
- `GET  http://localhost:5001/pending_transactions`
