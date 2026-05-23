import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String },
  price:       { type: Number, required: true, min: 0 },
  image:       { type: String },
  available:   { type: Boolean, default: true },
});

const menuCategorySchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true },
  items:    [menuItemSchema],
});

const restaurantSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    slug:      { type: String, required: true, unique: true, lowercase: true },
    owner:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String },
    logo:        { type: String },
    coverImage:  { type: String },
    images:      [{ type: String }],
    cuisine:     [{ type: String }],

    address: {
      street:  String,
      city:    String,
      state:   String,
      country: { type: String, default: 'Tunisia' },
      coordinates: { lat: Number, lng: Number },
    },

    contact: {
      phone:    String,
      email:    String,
      whatsapp: String,
      website:  String,
    },

    googleMapsLink: { type: String },

    socialMedia: {
      facebook:  { type: String },
      instagram: { type: String },
      tiktok:    { type: String },
    },

    about: {
      text:  { type: String },
      image: { type: String },
    },

    menu: [menuCategorySchema],

    openingHours: [
      {
        day:      { type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] },
        open:     String,
        close:    String,
        isClosed: { type: Boolean, default: false },
      },
    ],

    settings: {
      currency:            { type: String, default: 'TND' },
      language:            { type: String, default: 'fr' },
      taxRate:             { type: Number, default: 0 },
      serviceCharge:       { type: Number, default: 0 },
      acceptsReservations: { type: Boolean, default: true },
      acceptsDelivery:     { type: Boolean, default: false },
      acceptsPickup:       { type: Boolean, default: true },
      minOrderAmount:      { type: Number, default: 0 },
    },

    subscription: {
      plan:      { type: String, enum: ['trial', 'basic', 'pro', 'enterprise'], default: 'trial' },
      status:    { type: String, enum: ['active', 'suspended', 'cancelled'], default: 'active' },
      expiresAt: { type: Date },
    },

    template: {
      id:             { type: String, default: 'classic' },
      slogan:         { type: String },
      heroBackground: { type: String },
      primaryColor:   { type: String, default: '#f97316' },
      badge:          { type: String },
      footerText:     { type: String },
      showMenu:       { type: Boolean, default: true },
      showGallery:    { type: Boolean, default: true },
      showAbout:      { type: Boolean, default: true },
      showHours:      { type: Boolean, default: false },
      ctaText:        { type: String, default: 'Reserve a Table' },
      discoverText:   { type: String, default: 'Discover More' },
      vipCtaText:     { type: String, default: 'Book VIP Table' },
    },

    vipService: {
      enabled:     { type: Boolean, default: false },
      description: { type: String, default: '' },
      minSpend:    { type: Number, default: 0 },
    },

    isPublished: { type: Boolean, default: false },

    rating:      { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isVerified:  { type: Boolean, default: true },
    isActive:    { type: Boolean, default: true },
    isHalal:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

restaurantSchema.index({ 'address.city': 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ rating: -1 });

export default mongoose.model('Restaurant', restaurantSchema);
