import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      enum: [
        'login_success', 'login_failed', 'logout',
        'register', 'password_change',
        'kyc_submit', 'kyc_approved', 'kyc_rejected',
        'rate_limit_hit', 'unauthorized_access', 'suspicious_request',
        'token_invalid', 'account_deactivated',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'alert', 'critical'],
      default: 'info',
    },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    email:     { type: String, index: true },
    ip:        { type: String },
    userAgent: { type: String },
    message:   { type: String },
    metadata:  { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// TTL: auto-delete logs older than 90 days
securityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

export default mongoose.model('SecurityLog', securityLogSchema);
