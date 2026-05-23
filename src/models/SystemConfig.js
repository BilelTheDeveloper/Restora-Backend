import mongoose from 'mongoose';

// Singleton document — always queried by key: 'global'
const systemConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    maintenance: {
      enabled:        { type: Boolean,  default: false },
      message:        { type: String,   default: "We're performing scheduled maintenance. We'll be back shortly!" },
      scheduledUntil: { type: Date,     default: null },
      enabledAt:      { type: Date,     default: null },
      enabledBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.model('SystemConfig', systemConfigSchema);
