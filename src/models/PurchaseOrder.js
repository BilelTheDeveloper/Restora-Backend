import mongoose from 'mongoose';

const PurchaseItemSchema = new mongoose.Schema({
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: String,
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, default: 0 },
  receivedQuantity: { type: Number, default: 0 },
  notes: String,
}, { _id: false });

const PurchaseOrderSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  orderNumber: { type: String, unique: true },
  status: {
    type: String,
    enum: ['draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled'],
    default: 'draft',
  },
  items: [PurchaseItemSchema],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  expectedDelivery: Date,
  actualDelivery: Date,
  invoiceNumber: String,
  invoiceImage: String,
  notes: String,
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  paymentDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

PurchaseOrderSchema.index({ restaurant: 1, status: 1 });
PurchaseOrderSchema.index({ restaurant: 1, supplier: 1 });
PurchaseOrderSchema.index({ restaurant: 1, createdAt: -1 });

PurchaseOrderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const d = new Date();
    const rand = String(Math.floor(Math.random() * 9000) + 1000);
    this.orderNumber = `PO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${rand}`;
  }
  this.items.forEach(item => { item.totalPrice = item.quantity * item.unitPrice; });
  this.subtotal = this.items.reduce((s, i) => s + (i.totalPrice || 0), 0);
  this.total = this.subtotal + (this.tax || 0);
  next();
});

export default mongoose.model('PurchaseOrder', PurchaseOrderSchema);
