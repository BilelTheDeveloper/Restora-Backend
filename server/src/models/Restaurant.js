import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String },
    logo: { type: String },
    coverImage: { type: String },
    images: [{ type: String }],
    cuisine: [{ type: String }],
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'Tunisia' },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    contact: {
      phone: String,
      email: String,
      whatsapp: String,
      website: String,
    },
    openingHours: [
      {
        day: { type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] },
        open: String,
        close: String,
        isClosed: { type: Boolean, default: false },
      },
    ],
    settings: {
      currency: { type: String, default: 'TND' },
      language: { type: String, default: 'fr' },
      taxRate: { type: Number, default: 0 },
      serviceCharge: { type: Number, default: 0 },
      acceptsReservations: { type: Boolean, default: true },
      acceptsDelivery: { type: Boolean, default: false },
      acceptsPickup: { type: Boolean, default: true },
      minOrderAmount: { type: Number, default: 0 },
    },
    subscription: {
      plan: { type: String, enum: ['trial', 'basic', 'pro', 'enterprise'], default: 'trial' },
      status: { type: String, enum: ['active', 'suspended', 'cancelled'], default: 'active' },
      expiresAt: { type: Date },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isHalal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

restaurantSchema.index({ slug: 1 });
restaurantSchema.index({ 'address.city': 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ rating: -1 });

export default mongoose.model('Restaurant', restaurantSchema);
