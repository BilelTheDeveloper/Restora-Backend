import Order from '../models/Order.js';
import { success } from '../utils/apiResponse.js';

const PLATFORMS = [
  { id: 'uber_eats', name: 'Uber Eats', color: '#06b6d4', connected: false },
  { id: 'glovo', name: 'Glovo', color: '#f59e0b', connected: false },
  { id: 'deliveroo', name: 'Deliveroo', color: '#10b981', connected: false },
  { id: 'internal', name: 'Direct Delivery', color: '#f97316', connected: true },
];

export const getPlatforms = async (req, res) => {
  success(res, PLATFORMS);
};

export const getDeliveryOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { restaurant: req.user.restaurant, type: { $in: ['delivery', 'takeaway'] } };
    if (status) filter.status = status;
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .select('orderNumber type status total items createdAt deliveryAddress customer');
    const withPlatform = orders.map(o => ({ ...o.toObject(), platform: 'internal', platformName: 'Direct Delivery' }));
    success(res, withPlatform);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getDeliveryStats = async (req, res) => {
  try {
    const rid = req.user.restaurant;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [todayOrders, monthOrders, avgDeliveryTime, byType] = await Promise.all([
      Order.countDocuments({ restaurant: rid, type: { $in: ['delivery', 'takeaway'] }, createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { restaurant: rid, type: { $in: ['delivery', 'takeaway'] }, createdAt: { $gte: thirtyAgo }, status: { $nin: ['cancelled'] } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { restaurant: rid, type: 'delivery', status: 'delivered', createdAt: { $gte: thirtyAgo }, completedAt: { $exists: true } } },
        { $project: { duration: { $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 60000] } } },
        { $group: { _id: null, avg: { $avg: '$duration' } } },
      ]),
      Order.aggregate([
        { $match: { restaurant: rid, type: { $in: ['delivery', 'takeaway'] }, createdAt: { $gte: thirtyAgo } } },
        { $group: { _id: '$type', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
      ]),
    ]);
    success(res, {
      todayOrders,
      monthOrders: monthOrders[0]?.count || 0,
      monthRevenue: monthOrders[0]?.revenue || 0,
      avgDeliveryMinutes: Math.round(avgDeliveryTime[0]?.avg || 35),
      byType,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const connectPlatform = async (req, res) => {
  success(res, { message: `Integration with ${req.params.platform} is coming soon. You've been added to the waitlist.`, status: 'pending_activation' });
};
