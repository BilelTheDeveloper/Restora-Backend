import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  modifiers: [{ name: String, option: String, price: Number }],
  notes: { type: String },
  status: { type: String, enum: ['pending', 'preparing', 'ready', 'served'], default: 'pending' },
});

const orderSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    orderNumber: { type: String, required: true },
    type: { type: String, enum: ['dine-in', 'takeaway', 'delivery', 'qr'], required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'delivered', 'cancelled'],
      default: 'pending',
    },
    items: [orderItemSchema],
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String },
    customerPhone: { type: String },
    waiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveryAddress: {
      street: String,
      city: String,
      notes: String,
    },
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cash', 'card', 'online', 'unpaid'], default: 'unpaid' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    notes: { type: String },
    estimatedTime: { type: Number },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ restaurant: 1, status: 1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1, restaurant: 1 }, { unique: true });

export default mongoose.model('Order', orderSchema);
