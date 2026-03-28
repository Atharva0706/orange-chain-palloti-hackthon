import mongoose from 'mongoose';

const produceSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true }, // in kg
  pricePerKg: { type: Number, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ['Available', 'In Escrow', 'Sold'], default: 'Available' },
  aiGrade: { type: String }, // Premium, Standard, Substandard
  marketSuggestion: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Produce', produceSchema);
