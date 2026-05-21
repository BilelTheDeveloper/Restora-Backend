import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    partySize: { type: Number, required: true, min: 1 },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    status: { type: String, enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'], default: 'pending' },
    notes: { type: String },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reservationSchema.index({ restaurant: 1, date: 1 });

export default mongoose.model('Reservation', reservationSchema);
