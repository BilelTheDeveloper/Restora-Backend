import mongoose from 'mongoose';

const WaitlistSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  partySize: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['waiting', 'notified', 'seated', 'cancelled', 'no_show'], default: 'waiting' },
  priority: { type: String, enum: ['normal', 'vip'], default: 'normal' },
  notes: String,
  estimatedWait: { type: Number, default: 0 },
  notifiedAt: Date,
  seatedAt: Date,
  cancelledAt: Date,
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  queuePosition: Number,
  smsNotifications: { type: Boolean, default: true },
  source: { type: String, enum: ['walk_in', 'phone', 'app', 'qr'], default: 'walk_in' },
}, { timestamps: true });

WaitlistSchema.index({ restaurant: 1, status: 1, createdAt: 1 });

export default mongoose.model('Waitlist', WaitlistSchema);
