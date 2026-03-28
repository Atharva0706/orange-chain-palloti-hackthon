# OrangeChain — How to Start (Arch Linux / any distro)

Extract the zip first. You should have this structure:
```
OrangeChain_Fixed/
├── backend/
│   ├── blockchain.py
│   ├── server.js
│   ├── requirements.txt
│   └── ...
├── src/
├── package.json
└── ...
```

---

## Terminal 1 — Python Blockchain (port 5001)

```bash
cd OrangeChain_Fixed/backend

python -m venv venv
source venv/bin/activate

pip install flask flask-cors
python blockchain.py
```

You should see:
```
==================================================
  OrangeChain Blockchain Node
  Running on http://localhost:5001
==================================================
```

Keep this terminal open.

---

## Terminal 2 — Node.js Backend (port 5000)

```bash
cd OrangeChain_Fixed/backend
npm install
npm start
```

You should see:
```
✅ Connected to MongoDB
✅ Backend running on port 5000
```

> MongoDB must be running. On Arch: `sudo systemctl start mongodb`
> Or install it: `sudo pacman -S mongodb-bin` (from AUR)

Keep this terminal open.

---

## Terminal 3 — React Frontend (port 5173)

```bash
cd OrangeChain_Fixed
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Quick Re-start (after first setup)

```bash
# Terminal 1
cd OrangeChain_Fixed/backend && source venv/bin/activate && python blockchain.py

# Terminal 2
cd OrangeChain_Fixed/backend && npm start

# Terminal 3
cd OrangeChain_Fixed && npm run dev
```
