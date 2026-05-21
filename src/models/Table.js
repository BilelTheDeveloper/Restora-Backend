import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    number: { type: String, required: true },
    capacity: { type: Number, required: true, default: 4 },
    status: { type: String, enum: ['available', 'occupied', 'reserved', 'cleaning'], default: 'available' },
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    position: { x: Number, y: Number },
    shape: { type: String, enum: ['square', 'round', 'rectangle'], default: 'square' },
    floor: { type: String, default: 'main' },
    qrCode: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

tableSchema.index({ restaurant: 1, number: 1 }, { unique: true });

export default mongoose.model('Table', tableSchema);
