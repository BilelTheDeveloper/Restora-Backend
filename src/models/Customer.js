import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  date:       { type: Date, default: Date.now },
  orderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  spend:      { type: Number, default: 0 },
  partySize:  { type: Number, default: 1 },
  tableId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  notes:      { type: String },
}, { _id: false });

const customerSchema = new mongoose.Schema(
  {
    restaurant:   { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name:         { type: String, required: true, trim: true },
    phone:        { type: String, required: true, trim: true },
    email:        { type: String, trim: true, lowercase: true },

    vipStatus:    { type: Boolean, default: false },
    birthday:     { type: Date },

    preferences: {
      favoriteItems:    [{ type: String }],
      preferredTable:   { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
      seatingPreference: { type: String, enum: ['indoor', 'outdoor', 'quiet', 'bar', 'any'], default: 'any' },
      dietaryNotes:     { type: String },
    },

    allergies:    [{ type: String }],
    internalNotes: { type: String },

    visitHistory: [visitSchema],

    totalVisits:   { type: Number, default: 0 },
    totalSpend:    { type: Number, default: 0 },
    averageSpend:  { type: Number, default: 0 },
    lastVisit:     { type: Date },

    tags: [{ type: String }],
  },
  { timestamps: true }
);

customerSchema.index({ restaurant: 1, phone: 1 }, { unique: true });
customerSchema.index({ restaurant: 1, name: 1 });
customerSchema.index({ restaurant: 1, lastVisit: -1 });

export default mongoose.model('Customer', customerSchema);
