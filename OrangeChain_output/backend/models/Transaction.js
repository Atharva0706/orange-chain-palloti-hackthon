import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  produceId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Produce', required: true },
  buyerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  farmerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  amount:      { type: Number, required: true },
  escrowStatus: {
    type: String,
    enum: ['Pending Deposit', 'Deposited', 'In Transit', 'Delivered', 'Payment Released'],
    default: 'Pending Deposit'
  },
  // ── Payment fields (added by payment system) ────────────────────────────
  paymentStatus:       { type: String, default: 'Pending' }, // Pending | Confirmed
  paymentReference:    { type: String, default: null },      // Unique ref code per payment
  paymentInitiatedAt:  { type: Date,   default: null },
  paymentConfirmedAt:  { type: Date,   default: null },

  // ── Shipping fields ──────────────────────────────────────────────────────
  shippedAt:           { type: Date,   default: null },
  deliveredAt:         { type: Date,   default: null },

  // ── Blockchain fields — populated after mining ───────────────────────────
  blockHash:   { type: String, default: null },
  blockIndex:  { type: Number, default: null },
  minedAt:     { type: Date,   default: null },

  createdAt:   { type: Date, default: Date.now }
});

export default mongoose.model('Transaction', transactionSchema);
