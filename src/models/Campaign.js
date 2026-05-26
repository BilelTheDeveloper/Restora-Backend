import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['email', 'sms', 'whatsapp', 'push'], default: 'sms' },
  trigger: {
    type: String,
    enum: ['manual', 'birthday', 'inactive', 'big_spender', 'low_occupancy', 'new_customer', 'abandoned_reservation', 'winback'],
    default: 'manual',
  },
  status: { type: String, enum: ['draft', 'scheduled', 'running', 'completed', 'paused'], default: 'draft' },
  subject: String,
  message: { type: String, required: true },
  segment: {
    type: { type: String, enum: ['all', 'vip', 'inactive', 'new', 'birthday', 'high_spender', 'custom'], default: 'all' },
    minSpend: Number,
    inactiveDays: Number,
    tags: [String],
  },
  scheduledAt: Date,
  sentAt: Date,
  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
  },
  couponCode: String,
  discountPercent: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

CampaignSchema.index({ restaurant: 1, status: 1 });
CampaignSchema.index({ restaurant: 1, createdAt: -1 });

export default mongoose.model('Campaign', CampaignSchema);
