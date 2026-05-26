import mongoose from 'mongoose';

const TierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  minPoints: { type: Number, required: true },
  color: { type: String, default: '#f97316' },
  badge: String,
  benefits: [String],
  bonusMultiplier: { type: Number, default: 1 },
}, { _id: false });

const LoyaltyProgramSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, unique: true },
  name: { type: String, default: 'Loyalty Program' },
  isActive: { type: Boolean, default: true },
  pointsPerDinar: { type: Number, default: 1 },
  pointsValue: { type: Number, default: 0.1 },
  tiers: {
    type: [TierSchema],
    default: [
      { name: 'Bronze', minPoints: 0, color: '#cd7f32', benefits: ['1 point per TND'], bonusMultiplier: 1 },
      { name: 'Silver', minPoints: 500, color: '#9ca3af', benefits: ['1.25x points', 'Priority seating'], bonusMultiplier: 1.25 },
      { name: 'Gold', minPoints: 1500, color: '#eab308', benefits: ['1.5x points', 'Free dessert monthly', 'Priority seating'], bonusMultiplier: 1.5 },
      { name: 'Platinum', minPoints: 5000, color: '#8b5cf6', benefits: ['2x points', 'Dedicated table', 'Monthly gift', 'Birthday month double points'], bonusMultiplier: 2 },
    ],
  },
  birthdayBonus: { type: Number, default: 100 },
  referralBonus: { type: Number, default: 50 },
  welcomeBonus: { type: Number, default: 50 },
  expiryMonths: { type: Number, default: 12 },
  winbackDays: { type: Number, default: 45 },
  cashbackPercent: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('LoyaltyProgram', LoyaltyProgramSchema);
