import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  source: { type: String, enum: ['google', 'tripadvisor', 'facebook', 'internal', 'manual'], required: true },
  reviewerName: { type: String, trim: true },
  reviewerAvatar: String,
  rating: { type: Number, min: 1, max: 5, required: true },
  text: { type: String, trim: true },
  date: { type: Date, required: true, default: Date.now },
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
  categories: [{
    type: String,
    enum: ['waiting_time', 'food_quality', 'service', 'price', 'ambiance', 'cleanliness', 'delivery', 'packaging'],
  }],
  replied: { type: Boolean, default: false },
  replyText: String,
  repliedAt: Date,
  sourceId: String,
  sourceUrl: String,
  isPublic: { type: Boolean, default: true },
  helpful: { type: Number, default: 0 },
  flagged: { type: Boolean, default: false },
}, { timestamps: true });

ReviewSchema.index({ restaurant: 1, source: 1 });
ReviewSchema.index({ restaurant: 1, rating: 1 });
ReviewSchema.index({ restaurant: 1, date: -1 });
ReviewSchema.index({ restaurant: 1, sentiment: 1 });

export default mongoose.model('Review', ReviewSchema);
