import Order from '../models/Order.js';
import Alert from '../models/Alert.js';
import Ingredient from '../models/Ingredient.js';
import Reservation from '../models/Reservation.js';
import Restaurant from '../models/Restaurant.js';
import { emitToRestaurant } from '../socket.js';

async function createAlert(restaurantId, data) {
  // Prevent duplicate alerts of same type within 2 hours
  const twoHrsAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const existing = await Alert.findOne({
    restaurant: restaurantId,
    type: data.type,
    createdAt: { $gte: twoHrsAgo },
    isDismissed: false,
  });
  if (existing) return null;

  const alert = await Alert.create({ restaurant: restaurantId, ...data });
  emitToRestaurant(restaurantId, 'alert:new', alert);
  return alert;
}

// ── Kitchen Slowdown Detection ─────────────────────────────────
async function checkKitchenSlowdown(restaurantId) {
  const now = new Date();
  const thirtyMin = new Date(now - 30 * 60 * 1000);
  const twoHrAgo  = new Date(now - 2 * 60 * 60 * 1000);

  const [recentOrders, historicalOrders] = await Promise.all([
    Order.find({
      restaurant: restaurantId,
      status: 'preparing',
      createdAt: { $gte: thirtyMin },
    }),
    Order.find({
      restaurant: restaurantId,
      status: { $in: ['served', 'completed'] },
      completedAt: { $exists: true },
      createdAt: { $gte: twoHrAgo, $lt: thirtyMin },
    }),
  ]);

  if (recentOrders.length < 2) return;

  const avgRecent = recentOrders.reduce((s, o) => {
    return s + (now - o.createdAt);
  }, 0) / recentOrders.length / 60000; // minutes

  if (historicalOrders.length >= 2) {
    const avgHistorical = historicalOrders.reduce((s, o) => {
      return s + (o.completedAt - o.createdAt);
    }, 0) / historicalOrders.length / 60000;

    if (avgRecent > avgHistorical * 1.2) {
      await createAlert(restaurantId, {
        type: 'slow_kitchen',
        severity: 'warning',
        title: 'Kitchen Running Slow',
        message: `Average prep time is ${Math.round(avgRecent)}min — ${Math.round(((avgRecent / avgHistorical) - 1) * 100)}% above normal.`,
        data: { avgRecent: Math.round(avgRecent), avgHistorical: Math.round(avgHistorical) },
        actionLink: '/admin/kitchen',
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      });
    }
  }
}

// ── Revenue Anomaly ────────────────────────────────────────────
async function checkRevenueAnomaly(restaurantId) {
  const today = new Date();
  const hour  = today.getHours();
  if (hour < 13 || hour > 21) return; // Only check during meal hours

  const start = new Date(today); start.setHours(0, 0, 0, 0);
  const end   = new Date(today); end.setHours(23, 59, 59, 999);

  const [todayAgg, histAgg] = await Promise.all([
    Order.aggregate([
      { $match: { restaurant: restaurantId, paymentStatus: 'paid', createdAt: { $gte: start, $lte: new Date() } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          paymentStatus: 'paid',
          createdAt: { $gte: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), $lt: start },
          $expr: { $eq: [{ $dayOfWeek: '$createdAt' }, today.getDay() + 1] },
        },
      },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, rev: { $sum: '$total' } } },
      { $group: { _id: null, avg: { $avg: '$rev' } } },
    ]),
  ]);

  const todayRev = todayAgg[0]?.revenue || 0;
  const histAvg  = histAgg[0]?.avg || 0;

  if (histAvg > 0 && todayRev < histAvg * 0.6) {
    await createAlert(restaurantId, {
      type: 'revenue_anomaly',
      severity: 'warning',
      title: 'Revenue Below Average',
      message: `Today's revenue (${todayRev.toFixed(0)} TND) is ${Math.round((1 - todayRev / histAvg) * 100)}% below your ${today.toLocaleDateString('en', { weekday: 'long' })} average.`,
      data: { todayRev, histAvg: Math.round(histAvg) },
      actionLink: '/admin/analytics',
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
    });
  }
}

// ── Low Stock Alerts ───────────────────────────────────────────
async function checkLowStock(restaurantId) {
  const lowItems = await Ingredient.find({
    restaurant: restaurantId,
    isActive: true,
    $expr: { $lte: ['$currentStock', '$minStock'] },
  }).limit(5);

  for (const item of lowItems) {
    await createAlert(restaurantId, {
      type: item.currentStock === 0 ? 'out_of_stock' : 'low_stock',
      severity: item.currentStock === 0 ? 'critical' : 'warning',
      title: item.currentStock === 0 ? `${item.name} — Out of Stock` : `${item.name} — Low Stock`,
      message: item.currentStock === 0
        ? `${item.name} is completely out of stock.`
        : `${item.name} has only ${item.currentStock} ${item.unit} left (minimum: ${item.minStock}).`,
      data: { ingredientId: item._id, currentStock: item.currentStock, minStock: item.minStock, unit: item.unit },
      actionLink: '/admin/inventory',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }
}

// ── No-Show Risk ───────────────────────────────────────────────
async function checkNoShowRisk(restaurantId) {
  const nowPlus2hr = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const now = new Date();

  const upcoming = await Reservation.find({
    restaurant: restaurantId,
    status: 'pending',
    date: { $gte: now, $lte: nowPlus2hr },
  }).populate('customer', 'totalVisits');

  for (const res of upcoming) {
    let risk = 0;
    if (!res.customer || res.customer.totalVisits === 0) risk += 30;
    if (res.partySize >= 6) risk += 20;
    const hour = new Date(res.date).getHours();
    if (hour >= 19) risk += 10;

    if (risk >= 40) {
      await createAlert(restaurantId, {
        type: 'no_show_risk',
        severity: risk >= 60 ? 'critical' : 'warning',
        title: 'High No-Show Risk',
        message: `Reservation at ${res.time} for ${res.partySize} guests (${res.customerName}) — ${risk}% no-show risk.`,
        data: { reservationId: res._id, riskScore: risk, customerName: res.customerName, time: res.time },
        actionLink: '/admin/reservations',
        expiresAt: new Date(res.date).setHours(new Date(res.date).getHours() + 1),
      });
    }
  }
}

// ── Main engine — runs every 5 minutes ─────────────────────────
export function startAlertEngine() {
  const run = async () => {
    try {
      const restaurants = await Restaurant.find({ isActive: true, isPublished: true }).select('_id');
      for (const r of restaurants) {
        await Promise.allSettled([
          checkKitchenSlowdown(r._id),
          checkRevenueAnomaly(r._id),
          checkLowStock(r._id),
          checkNoShowRisk(r._id),
        ]);
      }
    } catch (err) {
      console.error('[AlertEngine]', err.message);
    }
  };

  run(); // immediate first run
  return setInterval(run, 5 * 60 * 1000);
}
