/**
 * Blockchain Routes - Node.js proxy to Python Flask blockchain service
 * These routes are called from the frontend to interact with the blockchain.
 * The actual blockchain logic lives in blockchain.py (port 5001).
 */
import express from 'express';
import Transaction from '../models/Transaction.js';
import { authMiddleware } from './auth.js';

const router = express.Router();
const BLOCKCHAIN_URL = process.env.BLOCKCHAIN_URL || 'http://localhost:5001';

// ─── Helper: call the Python blockchain service ─────────────────────────────
async function callBlockchain(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BLOCKCHAIN_URL}${endpoint}`, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Blockchain service error (${res.status}): ${errText}`);
  }
  return res.json();
}

// ─── GET /api/blockchain/chain - Full chain for UI display ──────────────────
router.get('/chain', async (req, res) => {
  try {
    const data = await callBlockchain('/get_chain');
    res.json(data);
  } catch (err) {
    console.error('[Blockchain] get_chain failed:', err.message);
    res.status(503).json({ error: 'Blockchain service unavailable', details: err.message });
  }
});

// ─── GET /api/blockchain/pending - Pending transaction pool ─────────────────
router.get('/pending', async (req, res) => {
  try {
    const data = await callBlockchain('/pending_transactions');
    res.json(data);
  } catch (err) {
    res.status(503).json({ error: 'Blockchain service unavailable' });
  }
});

// ─── POST /api/blockchain/confirm/:transactionId ────────────────────────────
// Called by buyer after delivery confirmation.
// Flow: marks MongoDB tx as Delivered → adds to blockchain pool → mines block → stores hash
router.post('/confirm/:transactionId', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('produceId', ['name', 'quantity'])
      .populate('farmerId', ['name', 'email'])
      .populate('buyerId', ['name', 'email']);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only the buyer or farmer can confirm delivery
    const userId = req.user.id;
    const isBuyer = transaction.buyerId._id.toString() === userId;
    const isFarmer = transaction.farmerId._id.toString() === userId;
    if (!isBuyer && !isFarmer) {
      return res.status(403).json({ error: 'Not authorized to confirm this transaction' });
    }

    // Only confirm if in 'In Transit' status
    if (transaction.escrowStatus !== 'In Transit') {
      return res.status(400).json({
        error: `Cannot confirm delivery. Current status: ${transaction.escrowStatus}. Must be 'In Transit'.`
      });
    }

    // Step 1: Update MongoDB status to Delivered
    transaction.escrowStatus = 'Delivered';
    await transaction.save();

    // Step 2: Add transaction to blockchain pending pool
    const blockchainTx = {
      transactionId: transaction._id.toString(),
      produceId: transaction.produceId?._id?.toString() || '',
      produceName: transaction.produceId?.name || 'Orange',
      farmerId: transaction.farmerId?._id?.toString() || transaction.farmerId.toString(),
      farmerName: transaction.farmerId?.name || 'Unknown',
      buyerId: transaction.buyerId?._id?.toString() || transaction.buyerId.toString(),
      buyerName: transaction.buyerId?.name || 'Unknown',
      amount: transaction.amount,
      escrowStatus: 'Delivered',
      timestamp: new Date().toISOString()
    };

    await callBlockchain('/add_transaction', 'POST', blockchainTx);

    // Step 3: Mine the block
    const mineResult = await callBlockchain('/mine_block', 'POST');
    const minedBlock = mineResult.block;

    // Step 4: Store block hash + update final status in MongoDB
    transaction.escrowStatus = 'Payment Released';
    transaction.blockHash = minedBlock.hash;
    transaction.blockIndex = minedBlock.index;
    await transaction.save();

    res.json({
      message: 'Delivery confirmed. Transaction mined to blockchain.',
      transaction: {
        id: transaction._id,
        escrowStatus: transaction.escrowStatus,
        blockHash: transaction.blockHash,
        blockIndex: transaction.blockIndex,
        amount: transaction.amount
      },
      block: minedBlock
    });

  } catch (err) {
    console.error('[Blockchain] confirm failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/blockchain/status/:transactionId - Update escrow step ─────────
// Advances escrow: Pending Deposit → Deposited → In Transit
router.put('/status/:transactionId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending Deposit', 'Deposited', 'In Transit', 'Delivered', 'Payment Released'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    transaction.escrowStatus = status;
    await transaction.save();
    res.json({ message: 'Status updated', transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
