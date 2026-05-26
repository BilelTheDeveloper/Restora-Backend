import mongoose from 'mongoose';

const LoyaltyTransactionSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: {
    type: String,
    enum: ['earn', 'redeem', 'bonus', 'birthday', 'referral', 'expire', 'adjust', 'welcome'],
    required: true,
  },
  points: { type: Number, required: true },
  balance: { type: Number, required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  note: String,
  expiresAt: Date,
}, { timestamps: true });

LoyaltyTransactionSchema.index({ restaurant: 1, customer: 1 });
LoyaltyTransactionSchema.index({ restaurant: 1, createdAt: -1 });
LoyaltyTransactionSchema.index({ restaurant: 1, type: 1 });

export default mongoose.model('LoyaltyTransaction', LoyaltyTransactionSchema);
