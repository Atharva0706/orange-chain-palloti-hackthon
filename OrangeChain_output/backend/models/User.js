import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['farmer', 'buyer', 'admin'], default: 'farmer' },
  walletAddress: { type: String, default: '' },
  trustScore:    { type: Number, default: 100 },
  totalSales:    { type: Number, default: 0 },
  totalRevenue:  { type: Number, default: 0 },
  createdAt:     { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
