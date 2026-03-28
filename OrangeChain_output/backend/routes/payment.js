/**
 * Payment Routes - UPI Payment Integration with Automatic Blockchain Status Updates
 * 
 * Flow:
 * 1. User initiates purchase (Status: "Pending Deposit")
 * 2. User makes UPI payment (Status auto-updates to "Deposited")
 * 3. Farmer ships product (Farmer updates status to "In Transit")
 * 4. Buyer receives & confirms delivery (Status: "Delivered", then mined to blockchain)
 * 5. Transaction is recorded immutably on blockchain (Status: "Payment Released")
 */

import express from 'express';
import Transaction from '../models/Transaction.js';
import Produce from '../models/Produce.js';
import User from '../models/User.js';
import { authMiddleware } from './auth.js';
import crypto from 'crypto';

const router = express.Router();
const BLOCKCHAIN_URL = process.env.BLOCKCHAIN_URL || 'http://localhost:5001';

// ────────────────────────────────────────────────────────────────────────────
// STEP 1: Generate UPI Payment Link
// ────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/payment/generate-upi/:transactionId
 * Generates UPI link for payment
 * 
 * Response:
 * {
 *   "transactionId": "...",
 *   "amount": 12500,
 *   "upiLink": "upi://pay?pa=...",
 *   "qrCode": "https://api.qrserver.com/v1/create-qr-code/..."
 * }
 */
router.post('/generate-upi/:transactionId', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('farmerId', ['name', 'walletAddress'])
      .populate('buyerId');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only buyer can generate payment link
    if (transaction.buyerId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only buyer can generate payment link' });
    }

    // Check status is still "Pending Deposit"
    if (transaction.escrowStatus !== 'Pending Deposit') {
      return res.status(400).json({
        error: `Cannot generate payment. Current status: ${transaction.escrowStatus}`
      });
    }

    // Use farmer's UPI ID (stored in wallet address field)
    const farmerUPI = transaction.farmerId.walletAddress || 'orangechain@okaxis';
    const amount = Math.floor(transaction.amount);
    const name = 'OrangeChain';
    
    // Create UPI link
    const upiLink = `upi://pay?pa=${farmerUPI}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=Orange%20Purchase`;
    
    // Generate QR code using third-party service
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;

    // Store payment request with a unique reference
    const paymentReference = crypto.randomBytes(8).toString('hex').toUpperCase();
    transaction.paymentReference = paymentReference;
    transaction.paymentInitiatedAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      transactionId: transaction._id,
      paymentReference,
      amount,
      farmerName: transaction.farmerId.name,
      upiLink,
      qrCode,
      message: 'UPI payment link generated successfully'
    });

  } catch (err) {
    console.error('[Payment] generate-upi failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ────────────────────────────────────────────────────────────────────────────
// STEP 2: Confirm Payment & Auto-Update Status to "Deposited"
// ────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/payment/confirm/:transactionId
 * Called after buyer confirms UPI payment (clicked "I Have Paid" button)
 * Automatically updates status to "Deposited"
 * 
 * Response:
 * {
 *   "message": "Payment confirmed. Funds held in escrow.",
 *   "transaction": {
 *     "id": "...",
 *     "escrowStatus": "Deposited",
 *     "amount": 12500,
 *     "confirmationTime": "2024-03-28T10:30:00Z"
 *   }
 * }
 */
router.post('/confirm/:transactionId', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('buyerId', ['name', 'email'])
      .populate('farmerId', ['name', 'email'])
      .populate('produceId', ['name', 'quantity']);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only buyer can confirm payment
    if (transaction.buyerId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only buyer can confirm payment' });
    }

    // Check current status is "Pending Deposit"
    if (transaction.escrowStatus !== 'Pending Deposit') {
      return res.status(400).json({
        error: `Cannot confirm payment. Current status: ${transaction.escrowStatus}`
      });
    }

    // ✅ AUTO-UPDATE: Status changes to "Deposited"
    transaction.escrowStatus = 'Deposited';
    transaction.paymentConfirmedAt = new Date();
    transaction.paymentStatus = 'Confirmed';
    await transaction.save();

    res.json({
      success: true,
      message: 'Payment confirmed! Funds are now held in escrow.',
      transaction: {
        id: transaction._id,
        escrowStatus: transaction.escrowStatus,
        paymentStatus: transaction.paymentStatus,
        amount: transaction.amount,
        buyerName: transaction.buyerId.name,
        farmerName: transaction.farmerId.name,
        produceName: transaction.produceId.name,
        confirmationTime: transaction.paymentConfirmedAt
      }
    });

  } catch (err) {
    console.error('[Payment] confirm failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ────────────────────────────────────────────────────────────────────────────
// STEP 3: Farmer Marks as "In Transit"
// ────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/payment/mark-shipped/:transactionId
 * Called by farmer when product is shipped
 * Automatically updates status to "In Transit"
 */
router.post('/mark-shipped/:transactionId', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('farmerId')
      .populate('produceId');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only farmer can mark as shipped
    if (transaction.farmerId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only farmer can mark as shipped' });
    }

    // Check current status is "Deposited"
    if (transaction.escrowStatus !== 'Deposited') {
      return res.status(400).json({
        error: `Cannot mark shipped. Current status: ${transaction.escrowStatus}`
      });
    }

    // ✅ AUTO-UPDATE: Status changes to "In Transit"
    transaction.escrowStatus = 'In Transit';
    transaction.shippedAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      message: 'Product marked as shipped!',
      transaction: {
        id: transaction._id,
        escrowStatus: transaction.escrowStatus,
        produceName: transaction.produceId.name,
        shippedAt: transaction.shippedAt
      }
    });

  } catch (err) {
    console.error('[Payment] mark-shipped failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ────────────────────────────────────────────────────────────────────────────
// STEP 4: Buyer Confirms Delivery & Auto-Mine to Blockchain
// ────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/payment/confirm-delivery/:transactionId
 * Called by buyer when product is received
 * Automatically:
 *   1. Updates status to "Delivered"
 *   2. Adds transaction to blockchain pending pool
 *   3. Mines the block
 *   4. Updates final status to "Payment Released"
 * 
 * Response:
 * {
 *   "message": "Delivery confirmed. Transaction mined to blockchain.",
 *   "transaction": {...},
 *   "block": {...}
 * }
 */
router.post('/confirm-delivery/:transactionId', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('produceId', ['name', 'quantity'])
      .populate('farmerId', ['name', 'email', 'walletAddress'])
      .populate('buyerId', ['name', 'email']);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only buyer can confirm delivery
    if (transaction.buyerId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only buyer can confirm delivery' });
    }

    // Check current status is "In Transit"
    if (transaction.escrowStatus !== 'In Transit') {
      return res.status(400).json({
        error: `Cannot confirm delivery. Current status: ${transaction.escrowStatus}`
      });
    }

    // ✅ STEP 1: Update MongoDB status to "Delivered"
    transaction.escrowStatus = 'Delivered';
    transaction.deliveredAt = new Date();
    await transaction.save();

    // ✅ STEP 2: Add transaction to blockchain pending pool
    const blockchainTx = {
      transactionId: transaction._id.toString(),
      produceId: transaction.produceId?._id?.toString() || '',
      produceName: transaction.produceId?.name || 'Orange',
      farmerId: transaction.farmerId?._id?.toString() || '',
      farmerName: transaction.farmerId?.name || 'Unknown Farmer',
      buyerId: transaction.buyerId?._id?.toString() || '',
      buyerName: transaction.buyerId?.name || 'Unknown Buyer',
      amount: transaction.amount,
      escrowStatus: 'Delivered',
      timestamp: new Date().toISOString()
    };

    await fetch(`${BLOCKCHAIN_URL}/add_transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blockchainTx)
    });

    // ✅ STEP 3: Mine the block
    const mineResponse = await fetch(`${BLOCKCHAIN_URL}/mine_block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!mineResponse.ok) {
      throw new Error('Failed to mine blockchain block');
    }

    const mineResult = await mineResponse.json();
    const minedBlock = mineResult.block;

    // ✅ STEP 4: Update final status to "Payment Released" and store block info
    transaction.escrowStatus = 'Payment Released';
    transaction.blockHash = minedBlock.hash;
    transaction.blockIndex = minedBlock.index;
    transaction.minedAt = new Date();
    await transaction.save();

    // ✅ STEP 5: Update produce status to "Sold"
    const produce = await Produce.findById(transaction.produceId);
    if (produce) {
      produce.status = 'Sold';
      await produce.save();
    }

    // ✅ STEP 6: Update farmer wallet/trust score
    const farmer = await User.findById(transaction.farmerId);
    if (farmer) {
      farmer.totalSales = (farmer.totalSales || 0) + 1;
      farmer.totalRevenue = (farmer.totalRevenue || 0) + transaction.amount;
      farmer.trustScore = Math.min(100, (farmer.trustScore || 50) + 2);
      await farmer.save();
    }

    res.json({
      success: true,
      message: 'Delivery confirmed! Transaction mined to blockchain. Payment releasing to farmer.',
      transaction: {
        id: transaction._id,
        escrowStatus: transaction.escrowStatus,
        blockHash: transaction.blockHash,
        blockIndex: transaction.blockIndex,
        amount: transaction.amount,
        farmerName: transaction.farmerId.name,
        deliveredAt: transaction.deliveredAt,
        minedAt: transaction.minedAt
      },
      block: {
        index: minedBlock.index,
        hash: minedBlock.hash,
        timestamp: minedBlock.timestamp,
        transactionCount: minedBlock.transactions.length
      }
    });

  } catch (err) {
    console.error('[Payment] confirm-delivery failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ────────────────────────────────────────────────────────────────────────────
// Helper: Get transaction status and payment details
// ────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/payment/status/:transactionId
 * Get current transaction and payment status
 */
router.get('/status/:transactionId', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('produceId', ['name', 'quantity', 'pricePerKg'])
      .populate('farmerId', ['name', 'email'])
      .populate('buyerId', ['name', 'email']);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      success: true,
      transaction: {
        id: transaction._id,
        escrowStatus: transaction.escrowStatus,
        paymentStatus: transaction.paymentStatus || 'Pending',
        amount: transaction.amount,
        produceName: transaction.produceId?.name,
        farmerName: transaction.farmerId?.name,
        buyerName: transaction.buyerId?.name,
        timeline: {
          createdAt: transaction.createdAt,
          paymentConfirmedAt: transaction.paymentConfirmedAt || null,
          shippedAt: transaction.shippedAt || null,
          deliveredAt: transaction.deliveredAt || null,
          minedAt: transaction.minedAt || null
        },
        blockchain: transaction.blockHash ? {
          hash: transaction.blockHash,
          index: transaction.blockIndex,
          immutable: true
        } : null
      }
    });

  } catch (err) {
    console.error('[Payment] status failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ────────────────────────────────────────────────────────────────────────────
// Helper: Get buyer's all transactions with payment status
// ────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/payment/my-transactions
 * Get all transactions for current buyer with their payment status
 */
router.get('/my-transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ buyerId: req.user.id })
      .populate('produceId', ['name', 'quantity'])
      .populate('farmerId', ['name', 'trustScore'])
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions: transactions.map(tx => ({
        id: tx._id,
        product: tx.produceId?.name,
        farmer: tx.farmerId?.name,
        amount: tx.amount,
        escrowStatus: tx.escrowStatus,
        paymentStatus: tx.paymentStatus || 'Pending',
        blockHash: tx.blockHash || null,
        createdAt: tx.createdAt,
        deliveredAt: tx.deliveredAt,
        minedAt: tx.minedAt
      }))
    });

  } catch (err) {
    console.error('[Payment] my-transactions failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
