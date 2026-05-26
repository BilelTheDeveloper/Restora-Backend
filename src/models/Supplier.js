import mongoose from 'mongoose';

const PriceHistorySchema = new mongoose.Schema({
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
  ingredientName: String,
  price: Number,
  unit: String,
  date: { type: Date, default: Date.now },
});

const SupplierSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  contactPerson: { type: String, trim: true },
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  category: {
    type: String,
    enum: ['meat', 'produce', 'dairy', 'dry', 'beverages', 'seafood', 'bakery', 'cleaning', 'other'],
    default: 'other',
  },
  tags: [String],
  rating: { type: Number, min: 1, max: 5 },
  notes: String,
  isActive: { type: Boolean, default: true },
  leadTimeDays: { type: Number, default: 1 },
  minimumOrderAmount: { type: Number, default: 0 },
  paymentTerms: { type: String, enum: ['cod', 'net_7', 'net_15', 'net_30', 'prepaid'], default: 'cod' },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    rib: String,
  },
  priceHistory: [PriceHistorySchema],
  totalOrders: { type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 },
  lastOrderDate: Date,
}, { timestamps: true });

SupplierSchema.index({ restaurant: 1 });
SupplierSchema.index({ restaurant: 1, isActive: 1 });

export default mongoose.model('Supplier', SupplierSchema);
