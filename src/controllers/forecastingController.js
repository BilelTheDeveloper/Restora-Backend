import Order from '../models/Order.js';
import Reservation from '../models/Reservation.js';
import Ingredient from '../models/Ingredient.js';
import { success } from '../utils/apiResponse.js';

export const getRevenueForecast = async (req, res) => {
  try {
    const rid = req.user.restaurant;
    const historical = await Order.aggregate([
      { $match: { restaurant: rid, createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, status: { $nin: ['cancelled'] } } },
      { $group: { _id: { $dayOfWeek: '$createdAt' }, avgRevenue: { $avg: '$total' }, count: { $sum: 1 } } },
    ]);
    const dayAvg = {};
    historical.forEach(h => { dayAvg[h._id] = { avg: h.avgRevenue, samples: h.count }; });
    const last7 = await Order.aggregate([
      { $match: { restaurant: rid, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, status: { $nin: ['cancelled'] } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const recentAvg = last7.length > 0 ? last7.reduce((s, d) => s + d.revenue, 0) / last7.length : 0;
    const forecast = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dow = d.getDay() + 1;
      const hist = dayAvg[dow];
      const base = hist?.avg || recentAvg;
      const trend = recentAvg > 0 && hist?.avg > 0 ? (recentAvg / hist.avg) : 1;
      const predicted = Math.round(base * Math.min(Math.max(trend, 0.7), 1.5));
      const conf = hist?.samples >= 10 ? 'high' : hist?.samples >= 4 ? 'medium' : 'low';
      forecast.push({ date: d.toISOString().split('T')[0], dayName: d.toLocaleDateString('en', { weekday: 'short' }), predicted, confidence: conf, low: Math.round(predicted * 0.85), high: Math.round(predicted * 1.15) });
    }
    success(res, { forecast, recentAvgDaily: Math.round(recentAvg) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getNoShowForecast = async (req, res) => {
  try {
    const rid = req.user.restaurant;
    const next48h = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const reservations = await Reservation.find({
      restaurant: rid, status: 'confirmed',
      date: { $gte: new Date(), $lte: next48h },
    }).populate('customer', 'name totalVisits');
    const predictions = reservations.map(r => {
      let noShowScore = 20;
      if (!r.customer || r.customer.totalVisits === 0) noShowScore += 30;
      if (r.partySize >= 6) noShowScore += 15;
      const hour = parseInt(r.time?.split(':')[0] || 0);
      if (hour >= 19 && hour <= 21) noShowScore += 10;
      if (!r.phone) noShowScore += 15;
      noShowScore = Math.min(95, noShowScore);
      return {
        reservation: { _id: r._id, date: r.date, time: r.time, partySize: r.partySize, customerName: r.customerName || r.customer?.name },
        noShowProbability: noShowScore,
        risk: noShowScore >= 60 ? 'high' : noShowScore >= 35 ? 'medium' : 'low',
      };
    });
    predictions.sort((a, b) => b.noShowProbability - a.noShowProbability);
    success(res, predictions);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getStockForecast = async (req, res) => {
  try {
    const rid = req.user.restaurant;
    const ingredients = await Ingredient.find({ restaurant: rid });
    const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orderCount = await Order.countDocuments({ restaurant: rid, createdAt: { $gte: thirtyAgo }, status: { $nin: ['cancelled'] } });
    const dailyOrderRate = orderCount / 30;
    const predictions = ingredients.map(ing => {
      const dailyUsage = (ing.currentStock > ing.minStock) ? (ing.currentStock - ing.minStock) / 30 : dailyOrderRate * 0.1;
      const daysRemaining = dailyUsage > 0 ? Math.floor(ing.currentStock / dailyUsage) : 999;
      return {
        ingredient: { _id: ing._id, name: ing.name, unit: ing.unit, currentStock: ing.currentStock, minStock: ing.minStock },
        dailyUsageEstimate: Math.round(dailyUsage * 100) / 100,
        daysRemaining: Math.min(daysRemaining, 999),
        depletionDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        risk: daysRemaining <= 3 ? 'critical' : daysRemaining <= 7 ? 'high' : daysRemaining <= 14 ? 'medium' : 'low',
      };
    });
    predictions.sort((a, b) => a.daysRemaining - b.daysRemaining);
    success(res, predictions.filter(p => p.daysRemaining < 30));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getPeakHourForecast = async (req, res) => {
  try {
    const rid = req.user.restaurant;
    const heatmap = await Order.aggregate([
      { $match: { restaurant: rid, createdAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }, status: { $nin: ['cancelled'] } } },
      { $group: { _id: { dow: { $dayOfWeek: '$createdAt' }, hour: { $hour: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { count: -1 } },
    ]);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const peaks = heatmap.slice(0, 10).map(h => ({
      day: days[h._id.dow - 1],
      hour: `${String(h._id.hour).padStart(2, '0')}:00`,
      avgOrders: Math.round(h.count / (60 / 7)),
      avgRevenue: Math.round(h.revenue / (60 / 7)),
    }));
    success(res, peaks);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
