import mongoose from 'mongoose';
import crypto from 'crypto';

const otpSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    code:     { type: String, required: true },
    type:     { type: String, enum: ['email_change', 'phone_change', 'password_reset'], required: true },
    newValue: { type: String },
    expiresAt:{ type: Date, required: true },
    used:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

// MongoDB TTL: auto-purge expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const generateOTPCode = () => String(crypto.randomInt(100000, 999999));

export default mongoose.model('OTP', otpSchema);
