/**
 * ML Routes - Node.js proxy to the Python FastAPI ML service (port 8000)
 * Wraps all Orange Intelligence prediction endpoints.
 */
import express from 'express';

const router = express.Router();
const ML_URL = process.env.ML_URL || 'http://localhost:8000';

async function callML(endpoint) {
  const res = await fetch(`${ML_URL}${endpoint}`);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ML service error (${res.status}): ${errText}`);
  }
  return res.json();
}

// ─── GET /api/ml/predict?market=...&date=... ──────────────────────────────
// Price prediction + demand signal + sell recommendation for one market
router.get('/predict', async (req, res) => {
  const { market = 'Nagpur APMC', date } = req.query;
  const qs = new URLSearchParams({ market, ...(date ? { date } : {}) });
  try {
    const data = await callML(`/predict?${qs}`);
    res.json(data);
  } catch (err) {
    console.error('[ML] predict failed:', err.message);
    res.status(503).json({ error: 'ML service unavailable', details: err.message });
  }
});

// ─── GET /api/ml/forecast?market=...&days=... ─────────────────────────────
// 7-day rolling price forecast with trend
router.get('/forecast', async (req, res) => {
  const { market = 'Nagpur APMC', days = 7 } = req.query;
  const qs = new URLSearchParams({ market, days });
  try {
    const data = await callML(`/forecast?${qs}`);
    res.json(data);
  } catch (err) {
    console.error('[ML] forecast failed:', err.message);
    res.status(503).json({ error: 'ML service unavailable', details: err.message });
  }
});

// ─── GET /api/ml/compare-markets?date=... ────────────────────────────────
// All markets ranked by net profit after transport
router.get('/compare-markets', async (req, res) => {
  const { date } = req.query;
  const qs = date ? new URLSearchParams({ date }) : '';
  try {
    const data = await callML(`/compare-markets${qs ? '?' + qs : ''}`);
    res.json(data);
  } catch (err) {
    console.error('[ML] compare-markets failed:', err.message);
    res.status(503).json({ error: 'ML service unavailable', details: err.message });
  }
});

// ─── GET /api/ml/storage-optimizer?market=...&quantity=...&days=... ───────
// Optimal hold days vs sell now analysis
router.get('/storage-optimizer', async (req, res) => {
  const { market = 'Nagpur APMC', quantity = 10, days = 28 } = req.query;
  const qs = new URLSearchParams({ market, quantity, days });
  try {
    const data = await callML(`/storage-optimizer?${qs}`);
    res.json(data);
  } catch (err) {
    console.error('[ML] storage-optimizer failed:', err.message);
    res.status(503).json({ error: 'ML service unavailable', details: err.message });
  }
});

// ─── GET /api/ml/historical?market=...&days=... ───────────────────────────
// Historical prices + volume for chart rendering
router.get('/historical', async (req, res) => {
  const { market = 'Nagpur APMC', days = 90 } = req.query;
  const qs = new URLSearchParams({ market, days });
  try {
    const data = await callML(`/historical?${qs}`);
    res.json(data);
  } catch (err) {
    console.error('[ML] historical failed:', err.message);
    res.status(503).json({ error: 'ML service unavailable', details: err.message });
  }
});

// ─── GET /api/ml/demand-signal?market=... ────────────────────────────────
// Oversupply / undersupply signal
router.get('/demand-signal', async (req, res) => {
  const { market = 'Nagpur APMC' } = req.query;
  const qs = new URLSearchParams({ market });
  try {
    const data = await callML(`/demand-signal?${qs}`);
    res.json(data);
  } catch (err) {
    console.error('[ML] demand-signal failed:', err.message);
    res.status(503).json({ error: 'ML service unavailable', details: err.message });
  }
});

// ─── GET /api/ml/markets ─────────────────────────────────────────────────
// List all available markets
router.get('/markets', async (req, res) => {
  try {
    const data = await callML('/markets');
    res.json(data);
  } catch (err) {
    console.error('[ML] markets failed:', err.message);
    res.status(503).json({ error: 'ML service unavailable', details: err.message });
  }
});

// ─── GET /api/ml/health ───────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const data = await callML('/');
    res.json({ status: 'ML service online', ...data });
  } catch (err) {
    res.status(503).json({ status: 'ML service offline', error: err.message });
  }
});

export default router;
