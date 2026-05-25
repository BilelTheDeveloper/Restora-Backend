import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema(
  {
    restaurant:   { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    staff:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:         { type: Date, required: true },
    startTime:    { type: String, required: true },
    endTime:      { type: String, required: true },
    role:         { type: String },
    status:       { type: String, enum: ['scheduled', 'present', 'late', 'absent', 'left_early'], default: 'scheduled' },
    minutesLate:  { type: Number, default: 0 },
    checkIn:      { type: Date },
    checkOut:     { type: Date },
    notes:        { type: String },
  },
  { timestamps: true }
);

shiftSchema.index({ restaurant: 1, date: 1 });
shiftSchema.index({ restaurant: 1, staff: 1, date: 1 });

export default mongoose.model('StaffShift', shiftSchema);
