import express from 'express';
import Produce from '../models/Produce.js';
import Transaction from '../models/Transaction.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

// ─── POST add new produce listing ─────────────────────────────────────────
router.post('/produce', authMiddleware, async (req, res) => {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({ msg: 'Only farmers can list produce' });
  }
  try {
    const { name, quantity, pricePerKg, location, aiGrade, marketSuggestion } = req.body;
    if (!name || !quantity || !pricePerKg || !location) {
      return res.status(400).json({ msg: 'name, quantity, pricePerKg, and location are required' });
    }
    const produce = new Produce({
      farmerId: req.user.id,
      name,
      quantity,
      pricePerKg,
      location,
      aiGrade: aiGrade || null,
      marketSuggestion: marketSuggestion || null
    });
    await produce.save();
    res.json(produce);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── GET farmer's own produce listings ───────────────────────────────────
router.get('/produce', authMiddleware, async (req, res) => {
  try {
    const produce = await Produce.find({ farmerId: req.user.id }).sort({ createdAt: -1 });
    res.json(produce);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── DELETE a produce listing (only if still Available) ───────────────────
router.delete('/produce/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'farmer') return res.status(403).json({ msg: 'Access denied' });
  try {
    const produce = await Produce.findOne({ _id: req.params.id, farmerId: req.user.id });
    if (!produce) return res.status(404).json({ msg: 'Produce not found' });
    if (produce.status !== 'Available') {
      return res.status(400).json({ msg: 'Cannot delete produce that is in escrow or sold' });
    }
    await produce.deleteOne();
    res.json({ msg: 'Produce listing removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── PATCH confirm shipment (farmer marks as In Transit) ─────────────────
router.patch('/transactions/:id/ship', authMiddleware, async (req, res) => {
  if (req.user.role !== 'farmer') return res.status(403).json({ msg: 'Access denied' });
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, farmerId: req.user.id });
    if (!tx) return res.status(404).json({ msg: 'Transaction not found' });
    if (tx.escrowStatus !== 'Deposited') {
      return res.status(400).json({ msg: 'Can only ship after buyer has deposited payment' });
    }
    tx.escrowStatus = 'In Transit';
    tx.shippedAt = new Date();
    await tx.save();
    res.json({ msg: 'Shipment confirmed. Status updated to In Transit.', transaction: tx });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── GET farmer's transactions ────────────────────────────────────────────
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ farmerId: req.user.id })
      .populate('produceId', ['name', 'quantity', 'location'])
      .populate('buyerId', ['name', 'email', 'trustScore'])
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
