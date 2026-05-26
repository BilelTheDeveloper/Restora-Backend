import Review from '../models/Review.js';
import { success, created } from '../utils/apiResponse.js';

function analyzeSentiment(text, rating) {
  if (!text) return rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';
  const positive = ['great', 'excellent', 'amazing', 'love', 'wonderful', 'fantastic', 'perfect', 'best', 'delicious', 'recommended'];
  const negative = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'disappointing', 'slow', 'cold', 'dirty', 'rude'];
  const lower = text.toLowerCase();
  const posScore = positive.filter(w => lower.includes(w)).length;
  const negScore = negative.filter(w => lower.includes(w)).length;
  if (rating >= 4 || posScore > negScore) return 'positive';
  if (rating <= 2 || negScore > posScore) return 'negative';
  return 'neutral';
}

function extractCategories(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const cats = [];
  if (/wait|slow|long|queue/.test(lower)) cats.push('waiting_time');
  if (/food|taste|delicious|flavor|dish/.test(lower)) cats.push('food_quality');
  if (/staff|service|waiter|friendly|rude/.test(lower)) cats.push('service');
  if (/price|expensive|cheap|value/.test(lower)) cats.push('price');
  if (/ambiance|atmosphere|decor|music|cozy/.test(lower)) cats.push('ambiance');
  if (/clean|dirty|hygiene/.test(lower)) cats.push('cleanliness');
  return cats;
}

export const getReviews = async (req, res) => {
  try {
    const { source, sentiment, page = 1, limit = 30 } = req.query;
    const filter = { restaurant: req.user.restaurant };
    if (source) filter.source = source;
    if (sentiment) filter.sentiment = sentiment;
    const [reviews, total] = await Promise.all([
      Review.find(filter).sort({ date: -1 }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit)),
      Review.countDocuments(filter),
    ]);
    success(res, { reviews, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createReview = async (req, res) => {
  try {
    const { text, rating } = req.body;
    const review = await Review.create({
      ...req.body,
      restaurant: req.user.restaurant,
      sentiment: analyzeSentiment(text, rating),
      categories: extractCategories(text),
    });
    created(res, review);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const replyToReview = async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      { replied: true, replyText: req.body.replyText, repliedAt: new Date() },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: 'Review not found' });
    success(res, review);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const deleteReview = async (req, res) => {
  try {
    await Review.findOneAndDelete({ _id: req.params.id, restaurant: req.user.restaurant });
    success(res, { deleted: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getReviewStats = async (req, res) => {
  try {
    const rid = req.user.restaurant;
    const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [overall, recent, bySource, bySentiment, byCategory, ratingDist] = await Promise.all([
      Review.aggregate([{ $match: { restaurant: rid } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
      Review.aggregate([{ $match: { restaurant: rid, date: { $gte: thirtyAgo } } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
      Review.aggregate([{ $match: { restaurant: rid } }, { $group: { _id: '$source', count: { $sum: 1 }, avg: { $avg: '$rating' } } }]),
      Review.aggregate([{ $match: { restaurant: rid } }, { $group: { _id: '$sentiment', count: { $sum: 1 } } }]),
      Review.aggregate([{ $match: { restaurant: rid } }, { $unwind: '$categories' }, { $group: { _id: '$categories', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Review.aggregate([{ $match: { restaurant: rid } }, { $group: { _id: '$rating', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ]);
    success(res, {
      avgRating: Math.round((overall[0]?.avg || 0) * 10) / 10,
      totalReviews: overall[0]?.count || 0,
      recentAvg: Math.round((recent[0]?.avg || 0) * 10) / 10,
      recentCount: recent[0]?.count || 0,
      bySource,
      bySentiment,
      topComplaints: byCategory.filter(c => ['waiting_time', 'service', 'price'].includes(c._id)),
      ratingDistribution: ratingDist,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
