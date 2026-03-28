import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import farmerRoutes from './routes/farmer.js';
import buyerRoutes from './routes/buyer.js';
import blockchainRoutes from './routes/blockchain.js';
import mlRoutes from './routes/ml.js';
import paymentRoutes from './routes/payment.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/farmer',     farmerRoutes);
app.use('/api/buyer',      buyerRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/payment',    paymentRoutes);

// ─── Simulation Route ──────────────────────────────────────────────────────
app.post('/api/simulation/trigger', (req, res) => {
  res.json({ message: 'Simulation triggered: Oversupply Event. Truck rerouting initiated.' });
});

// ─── AI Grade Endpoint (image quality grading — still mock, ML model is price-based) ─
app.post('/api/ai/grade', (req, res) => {
  const qualities = ['Premium', 'Standard', 'Substandard'];
  res.json({
    quality: qualities[Math.floor(Math.random() * qualities.length)],
    confidence: (Math.random() * (99 - 85) + 85).toFixed(2),
    estimatedValue: Math.floor(Math.random() * (500 - 100) + 100)
  });
});

// ─── AI Predict Endpoint — proxies to real ML service ────────────────────
// Legacy endpoint kept for backward compatibility with existing frontend calls.
// Forwards to /api/ml/predict internally.
app.post('/api/ai/predict', async (req, res) => {
  const ML_URL = process.env.ML_URL || 'http://localhost:8000';
  try {
    const market = req.body?.market || 'Nagpur APMC';
    const mlRes = await fetch(`${ML_URL}/predict?market=${encodeURIComponent(market)}`);
    if (mlRes.ok) {
      const mlData = await mlRes.json();
      // Return in the shape the existing frontend expects + enriched ML data
      res.json({
        predictedPrice: mlData.predicted_prices?.modal_price || 200,
        trend: mlData.demand_signal?.pressure === 'UNDERSUPPLY' ? 'Surging' :
               mlData.demand_signal?.pressure === 'OVERSUPPLY'  ? 'Falling' : 'Stable',
        bestMarket: market,
        // Enriched ML fields
        net_price: mlData.net_price,
        transport_cost: mlData.transport_cost,
        recommendation: mlData.recommendation,
        demand_signal: mlData.demand_signal,
        retail_per_kg: mlData.retail_per_kg,
      });
    } else {
      throw new Error('ML service unavailable');
    }
  } catch {
    // Fallback to mock if ML is down
    res.json({
      predictedPrice: Math.floor(Math.random() * (300 - 150) + 150),
      trend: Math.random() > 0.5 ? 'Up' : 'Down',
      bestMarket: 'Nagpur APMC'
    });
  }
});

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OrangeChain backend running', port: PORT });
});

// ─── DB + Server Start ─────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/orangechain')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    app.listen(PORT, () => console.log(`⚠️  Backend running on port ${PORT} (no DB)`));
  });
