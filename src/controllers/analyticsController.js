import Order from '../models/Order.js';
import Table from '../models/Table.js';
import Reservation from '../models/Reservation.js';
import Customer from '../models/Customer.js';
import { success } from '../utils/apiResponse.js';

function startOfDay(d = new Date()) {
  const s = new Date(d); s.setHours(0, 0, 0, 0); return s;
}
function endOfDay(d = new Date()) {
  const e = new Date(d); e.setHours(23, 59, 59, 999); return e;
}
function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d;
}

// ── Dashboard Stats ────────────────────────────────────────────
export const getDashboardStats = async (req, res, next) => {
  try {
    const rid = req.user.restaurant;
    const todayStart = startOfDay();
    const todayEnd   = endOfDay();
    const weekAgo    = daysAgo(7);

    const [todayAgg, weekAgg, activeOrders, activeTables, totalCustomers, pendingReservations] = await Promise.all([
      Order.aggregate([
        { $match: { restaurant: rid, createdAt: { $gte: todayStart, $lte: todayEnd } } },
        { $group: {
          _id: null,
          revenue:  { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } },
          orders:   { $sum: 1 },
          avgValue: { $avg: '$total' },
        }},
      ]),
      Order.aggregate([
        { $match: { restaurant: rid, createdAt: { $gte: weekAgo } } },
        { $group: {
          _id: null,
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } },
          orders:  { $sum: 1 },
        }},
      ]),
      Order.countDocuments({ restaurant: rid, status: { $in: ['pending','confirmed','preparing','ready'] } }),
      Table.countDocuments({ restaurant: rid, status: 'occupied', isActive: true }),
      Customer.countDocuments({ restaurant: rid }),
      Reservation.countDocuments({ restaurant: rid, status: 'pending', date: { $gte: todayStart } }),
    ]);

    const today = todayAgg[0] || { revenue: 0, orders: 0, avgValue: 0 };
    const week  = weekAgg[0]  || { revenue: 0, orders: 0 };

    success(res, {
      today: {
        revenue:      Math.round(today.revenue * 100) / 100,
        orders:       today.orders,
        avgValue:     Math.round((today.avgValue || 0) * 100) / 100,
        activeOrders,
        activeTables,
      },
      week: {
        revenue: Math.round(week.revenue * 100) / 100,
        orders:  week.orders,
      },
      totalCustomers,
      pendingReservations,
    });
  } catch (err) {
    next(err);
  }
};

// ── Revenue Chart (last N days) ────────────────────────────────
export const getRevenueChart = async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days || '30', 10), 90);
    const rid  = req.user.restaurant;
    const from = daysAgo(days - 1);

    const rows = await Order.aggregate([
      { $match: { restaurant: rid, paymentStatus: 'paid', createdAt: { $gte: from } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders:  { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    // Fill gaps
    const map = Object.fromEntries(rows.map(r => [r._id, r]));
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, revenue: Math.round((map[key]?.revenue || 0) * 100) / 100, orders: map[key]?.orders || 0 });
    }

    success(res, result);
  } catch (err) {
    next(err);
  }
};

// ── Top Menu Items ─────────────────────────────────────────────
export const getTopItems = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const rid  = req.user.restaurant;

    const items = await Order.aggregate([
      { $match: { restaurant: rid, createdAt: { $gte: daysAgo(days) } } },
      { $unwind: '$items' },
      { $group: {
        _id:     '$items.name',
        count:   { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        avgPrice:{ $avg: '$items.price' },
      }},
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    success(res, items);
  } catch (err) {
    next(err);
  }
};

// ── Table Occupancy & Revenue ──────────────────────────────────
export const getTableOccupancy = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const rid  = req.user.restaurant;

    const rows = await Order.aggregate([
      { $match: { restaurant: rid, type: 'dine-in', table: { $ne: null }, createdAt: { $gte: daysAgo(days) } } },
      { $group: {
        _id:        '$table',
        revenue:    { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } },
        orderCount: { $sum: 1 },
        avgSpend:   { $avg: '$total' },
      }},
      { $sort: { revenue: -1 } },
    ]);

    const tables = await Table.find({ restaurant: rid, isActive: true }).select('number floor capacity shape');
    const tableMap = Object.fromEntries(tables.map(t => [t._id.toString(), t]));

    const result = rows.map(r => ({
      tableId:    r._id,
      table:      tableMap[r._id.toString()] || null,
      revenue:    Math.round(r.revenue * 100) / 100,
      orderCount: r.orderCount,
      avgSpend:   Math.round(r.avgSpend * 100) / 100,
    }));

    success(res, result);
  } catch (err) {
    next(err);
  }
};

// ── Hourly Heatmap ─────────────────────────────────────────────
export const getHourlyHeatmap = async (req, res, next) => {
  try {
    const rid  = req.user.restaurant;
    const rows = await Order.aggregate([
      { $match: { restaurant: rid, createdAt: { $gte: daysAgo(60) } } },
      { $group: {
        _id: {
          dow:  { $dayOfWeek: '$createdAt' },
          hour: { $hour: '$createdAt' },
        },
        count:   { $sum: 1 },
        revenue: { $sum: '$total' },
      }},
    ]);

    // Build 7×24 matrix: dow 1=Sun…7=Sat
    const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
    rows.forEach(r => {
      const dow  = (r._id.dow - 1) % 7; // 0=Sun
      const hour = r._id.hour;
      matrix[dow][hour] = r.count;
    });

    success(res, { matrix, days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] });
  } catch (err) {
    next(err);
  }
};

// ── Menu Engineering ───────────────────────────────────────────
export const getMenuEngineering = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const rid  = req.user.restaurant;

    const items = await Order.aggregate([
      { $match: { restaurant: rid, createdAt: { $gte: daysAgo(days) } } },
      { $unwind: '$items' },
      { $group: {
        _id:     '$items.name',
        count:   { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        price:   { $first: '$items.price' },
      }},
      { $sort: { count: -1 } },
    ]);

    if (!items.length) return success(res, []);

    const avgCount   = items.reduce((s, i) => s + i.count, 0) / items.length;
    const avgRevenue = items.reduce((s, i) => s + i.revenue, 0) / items.length;

    const classified = items.map(item => {
      const highPop = item.count >= avgCount;
      const highRev = item.revenue >= avgRevenue;
      let quadrant, recommendation;
      if (highPop && highRev)  { quadrant = 'star';      recommendation = 'Promote prominently'; }
      else if (highPop)         { quadrant = 'workhorse'; recommendation = 'Optimize cost or raise price slightly'; }
      else if (highRev)         { quadrant = 'puzzle';    recommendation = 'Promote more — high margin, low visibility'; }
      else                      { quadrant = 'dog';       recommendation = 'Consider removing or reworking'; }
      return { ...item, quadrant, recommendation, popularity: item.count, profit: item.revenue };
    });

    success(res, classified);
  } catch (err) {
    next(err);
  }
};

// ── Order Type Breakdown ───────────────────────────────────────
export const getOrderTypeBreakdown = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '7', 10);
    const rid  = req.user.restaurant;

    const rows = await Order.aggregate([
      { $match: { restaurant: rid, createdAt: { $gte: daysAgo(days) } } },
      { $group: { _id: '$type', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]);

    success(res, rows);
  } catch (err) {
    next(err);
  }
};
