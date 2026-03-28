import express from 'express';
import Produce from '../models/Produce.js';
import Transaction from '../models/Transaction.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

// ─── GET all available produce (public) ───────────────────────────────────
router.get('/produce', async (req, res) => {
  try {
    const produce = await Produce.find({ status: 'Available' })
      .populate('farmerId', ['name', 'trustScore', 'walletAddress']);
    res.json(produce);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── POST create buy transaction / initiate escrow ────────────────────────
router.post('/buy/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'buyer') {
    return res.status(403).json({ msg: 'Only buyers can initiate purchases' });
  }
  try {
    const produce = await Produce.findById(req.params.id);
    if (!produce) return res.status(404).json({ msg: 'Produce not found' });
    if (produce.status !== 'Available') {
      return res.status(400).json({ msg: 'Produce is no longer available' });
    }

    produce.status = 'In Escrow';
    await produce.save();

    const transaction = new Transaction({
      produceId: produce._id,
      buyerId:   req.user.id,
      farmerId:  produce.farmerId,
      amount:    produce.quantity * produce.pricePerKg,
      escrowStatus: 'Pending Deposit'
    });
    await transaction.save();

    res.json({
      msg: 'Transaction created. Awaiting escrow deposit.',
      transaction
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── GET buyer's own transactions ─────────────────────────────────────────
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ buyerId: req.user.id })
      .populate('produceId', ['name', 'quantity', 'location'])
      .populate('farmerId', ['name', 'trustScore'])
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
