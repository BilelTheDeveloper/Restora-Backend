import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'low_stock', 'out_of_stock',
        'slow_kitchen', 'kitchen_bottleneck',
        'no_show_risk',
        'revenue_anomaly', 'revenue_milestone',
        'peak_hour_approaching', 'peak_hour_active',
        'vip_returning', 'vip_inactive',
        'table_idle', 'table_delayed',
        'staff_underperformance',
        'reservation_new', 'reservation_confirmed', 'reservation_cancelled',
        'system',
      ],
    },
    severity:    { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    title:       { type: String, required: true },
    message:     { type: String, required: true },
    data:        { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead:      { type: Boolean, default: false },
    isDismissed: { type: Boolean, default: false },
    actionLink:  { type: String },
    expiresAt:   { type: Date },
  },
  { timestamps: true }
);

alertSchema.index({ restaurant: 1, isRead: 1, createdAt: -1 });
alertSchema.index({ restaurant: 1, type: 1, createdAt: -1 });
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Alert', alertSchema);
