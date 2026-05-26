import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  category: {
    type: String,
    enum: ['rent', 'utilities', 'payroll', 'ingredients', 'equipment', 'marketing', 'insurance', 'maintenance', 'licenses', 'packaging', 'other'],
    required: true,
  },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  paymentMethod: { type: String, enum: ['cash', 'card', 'bank_transfer', 'check'], default: 'cash' },
  vendor: { type: String, trim: true },
  invoiceNumber: String,
  invoiceImage: String,
  isRecurring: { type: Boolean, default: false },
  recurringPeriod: { type: String, enum: ['weekly', 'monthly', 'yearly'] },
  tags: [String],
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

ExpenseSchema.index({ restaurant: 1, date: -1 });
ExpenseSchema.index({ restaurant: 1, category: 1 });

export default mongoose.model('Expense', ExpenseSchema);
