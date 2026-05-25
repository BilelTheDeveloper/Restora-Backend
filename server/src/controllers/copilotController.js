import Order from '../models/Order.js';
import Table from '../models/Table.js';
import Customer from '../models/Customer.js';
import Ingredient from '../models/Ingredient.js';
import Reservation from '../models/Reservation.js';
import StaffShift from '../models/StaffShift.js';
import { success } from '../utils/apiResponse.js';

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d;
}

const INTENTS = [
  { keys: ['revenue low', 'sales down', 'revenue drop', 'slow day', 'bad day', 'revenue today'], fn: 'analyzeRevenue' },
  { keys: ['profit', 'increase profit', 'improve profit', 'margin', 'money'], fn: 'analyzeProfit' },
  { keys: ['staff', 'waiter', 'employee', 'team', 'headcount', 'overstaffed', 'understaffed'], fn: 'analyzeStaffing' },
  { keys: ['table', 'seating', 'capacity', 'occupancy'], fn: 'analyzeTable' },
  { keys: ['busy', 'peak', 'rush hour', 'when'], fn: 'analyzePeakHours' },
  { keys: ['menu', 'dish', 'food', 'item', 'best seller', 'popular'], fn: 'analyzeMenu' },
  { keys: ['customer', 'guest', 'vip', 'loyal', 'return'], fn: 'analyzeCustomers' },
  { keys: ['stock', 'inventory', 'ingredient', 'supply'], fn: 'analyzeInventory' },
];

function detectIntent(question) {
  const q = question.toLowerCase();
  for (const intent of INTENTS) {
    if (intent.keys.some(k => q.includes(k))) return intent.fn;
  }
  return 'general';
}

// ── Analysis functions ─────────────────────────────────────────
async function analyzeRevenue(rid) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);

  const [todayAgg, weekAgg, hourlyAgg, typeAgg] = await Promise.all([
    Order.aggregate([
      { $match: { restaurant: rid, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus','paid'] }, '$total', 0] } }, orders: { $sum: 1 }, avgValue: { $avg: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { restaurant: rid, paymentStatus: 'paid', createdAt: { $gte: daysAgo(7) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, rev: { $sum: '$total' } } },
      { $group: { _id: null, avg: { $avg: '$rev' } } },
    ]),
    Order.aggregate([
      { $match: { restaurant: rid, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
    ]),
    Order.aggregate([
      { $match: { restaurant: rid, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
  ]);

  const today   = todayAgg[0] || { revenue: 0, orders: 0, avgValue: 0 };
  const avgDay  = weekAgg[0]?.avg || 0;
  const diff    = avgDay > 0 ? Math.round(((today.revenue - avgDay) / avgDay) * 100) : 0;
  const peakHour = hourlyAgg.sort((a, b) => b.count - a.count)[0]?._id ?? null;

  const insights = [];
  if (diff < -20) insights.push(`Revenue is ${Math.abs(diff)}% below your weekly average — something impacted sales today.`);
  else if (diff > 20) insights.push(`Strong day — revenue is ${diff}% above your weekly average.`);
  else insights.push(`Revenue is within normal range (${diff > 0 ? '+' : ''}${diff}% vs weekly avg).`);

  if (peakHour !== null) insights.push(`Busiest period today was around ${peakHour}:00–${peakHour + 1}:00.`);

  return {
    answer: diff < -10
      ? `Today's revenue (${today.revenue.toFixed(0)} TND) is ${Math.abs(diff)}% below your ${today.orders} orders average.`
      : `Today: ${today.revenue.toFixed(0)} TND across ${today.orders} orders. Avg order: ${(today.avgValue || 0).toFixed(1)} TND.`,
    dataPoints: [
      { label: "Today's Revenue", value: `${today.revenue.toFixed(0)} TND` },
      { label: 'Orders Today', value: today.orders },
      { label: 'vs Weekly Avg', value: `${diff > 0 ? '+' : ''}${diff}%` },
      { label: 'Avg Order Value', value: `${(today.avgValue || 0).toFixed(1)} TND` },
    ],
    insights,
    recommendations: diff < -15
      ? ['Check if any popular items were unavailable today', 'Look at kitchen prep times — slow service reduces covers', 'Consider a quick promotion to boost dinner covers']
      : ['Maintain current service pace', 'Upsell desserts and drinks to increase avg order value'],
  };
}

async function analyzeProfit(rid) {
  const items = await Order.aggregate([
    { $match: { restaurant: rid, createdAt: { $gte: daysAgo(30) } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.name', count: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price','$items.quantity'] } }, price: { $first: '$items.price' } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  return {
    answer: `Your top 5 revenue-generating items in the last 30 days drive the majority of profit. Focus on promoting Stars and fixing Puzzles.`,
    dataPoints: items.map(i => ({ label: i._id, value: `${i.revenue.toFixed(0)} TND (${i.count} sold)` })),
    insights: [
      'Items with high orders but low price — consider marginal price increases (5-8%)',
      'Items with low orders — promote via daily specials or remove',
      'Pair high-margin items with popular ones for combos',
    ],
    recommendations: [
      'Run Menu Engineering to classify Stars / Puzzles / Dogs',
      'Check recipes in Inventory to see true dish margins',
      'Feature high-margin items first in QR menu ordering',
    ],
  };
}

async function analyzeStaffing(rid) {
  const today = new Date();
  const dow = today.getDay();

  const historicalOrders = await Order.aggregate([
    { $match: { restaurant: rid, createdAt: { $gte: daysAgo(56) }, $expr: { $eq: [{ $dayOfWeek: '$createdAt' }, dow + 1] } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $group: { _id: null, avgOrders: { $avg: '$count' } } },
  ]);

  const avgOrders = historicalOrders[0]?.avgOrders || 0;
  const suggestedWaiters = Math.max(1, Math.ceil(avgOrders / 15));

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  return {
    answer: `Based on historical ${days[dow]} data (avg ${Math.round(avgOrders)} orders), you typically need ${suggestedWaiters} waiters on the floor.`,
    dataPoints: [
      { label: `Avg ${days[dow]} Orders`, value: Math.round(avgOrders) },
      { label: 'Suggested Waiters', value: suggestedWaiters },
      { label: 'Orders per Waiter', value: '~15 orders/shift' },
    ],
    insights: [`${days[dow]}s historically average ${Math.round(avgOrders)} orders`, `Staff 1 waiter per 15 orders as a baseline`],
    recommendations: [`Schedule ${suggestedWaiters} waiters for tonight`, 'Check VIP reservations — add 1 dedicated waiter for VIP tables', 'Review last week\'s shift notes for service issues'],
  };
}

async function analyzeTable(rid) {
  const rows = await Order.aggregate([
    { $match: { restaurant: rid, type: 'dine-in', table: { $ne: null }, createdAt: { $gte: daysAgo(30) } } },
    { $group: { _id: '$table', revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  const tables = await Table.find({ restaurant: rid, _id: { $in: rows.map(r => r._id) } }).select('number floor capacity');
  const tableMap = Object.fromEntries(tables.map(t => [t._id.toString(), t]));

  return {
    answer: `Top revenue-generating tables in the last 30 days:`,
    dataPoints: rows.map(r => ({
      label: `Table ${tableMap[r._id.toString()]?.number || r._id} (${tableMap[r._id.toString()]?.floor || ''})`,
      value: `${r.revenue.toFixed(0)} TND (${r.count} covers)`,
    })),
    insights: ['Tables near windows or with better views consistently generate more revenue', 'High-traffic tables turn over faster — great for revenue/seat/hour'],
    recommendations: ['Assign experienced waiters to your top revenue tables', 'Ensure VIP floor plan highlights your best tables', 'Track avg dining duration per table to optimize turnover'],
  };
}

async function analyzePeakHours(rid) {
  const matrix = await Order.aggregate([
    { $match: { restaurant: rid, createdAt: { $gte: daysAgo(30) } } },
    { $group: { _id: { dow: { $dayOfWeek: '$createdAt' }, hour: { $hour: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const days = ['','Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return {
    answer: `Your busiest periods based on the last 30 days:`,
    dataPoints: matrix.map(r => ({ label: `${days[r._id.dow]} ${r._id.hour}:00`, value: `${r.count} orders` })),
    insights: ['Plan kitchen prep 45min before predicted peak', 'Schedule max staff 30min before busy periods'],
    recommendations: ['Pre-prep high-demand items before peak starts', 'Enable reservation overbooking protection near peak hours', 'Brief kitchen on expected volume at shift start'],
  };
}

async function analyzeMenu(rid) {
  const items = await Order.aggregate([
    { $match: { restaurant: rid, createdAt: { $gte: daysAgo(30) } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.name', count: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price','$items.quantity'] } } } },
    { $sort: { count: -1 } },
  ]);

  const avgCount = items.reduce((s, i) => s + i.count, 0) / (items.length || 1);
  const stars = items.filter(i => i.count >= avgCount).slice(0, 3);
  const dogs  = items.filter(i => i.count < avgCount * 0.3).slice(0, 3);

  return {
    answer: `Menu performance over the last 30 days: ${stars.length} Star items, ${dogs.length} underperforming items.`,
    dataPoints: [
      ...stars.map(i => ({ label: `⭐ ${i._id}`, value: `${i.count} orders` })),
      ...dogs.map(i => ({ label: `🐕 ${i._id}`, value: `${i.count} orders` })),
    ],
    insights: ['Your Stars drive volume — keep them premium quality', 'Dog items use kitchen time without return — review and cut'],
    recommendations: ['Open Revenue Engine for full menu engineering matrix', 'Feature Stars at top of QR menu', `Consider removing: ${dogs.map(i => i._id).join(', ')}`],
  };
}

async function analyzeCustomers(rid) {
  const fortyFive = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
  const [total, vip, inactive] = await Promise.all([
    Customer.countDocuments({ restaurant: rid }),
    Customer.countDocuments({ restaurant: rid, vipStatus: true }),
    Customer.countDocuments({ restaurant: rid, lastVisit: { $lt: fortyFive } }),
  ]);

  return {
    answer: `You have ${total} customers in CRM: ${vip} VIP, ${inactive} inactive (45+ days).`,
    dataPoints: [
      { label: 'Total Customers', value: total },
      { label: 'VIP Guests', value: vip },
      { label: 'Inactive 45+ days', value: inactive },
      { label: 'Active', value: total - inactive },
    ],
    insights: ['Inactive customers respond well to "We miss you" offers', 'VIP guests drive disproportionate revenue — prioritize their experience'],
    recommendations: ['Contact inactive customers with a personalized offer', 'Invite top spenders to VIP status', 'Set birthday reminders to delight returning guests'],
  };
}

async function analyzeInventory(rid) {
  const lowItems = await Ingredient.find({ restaurant: rid, isActive: true, $expr: { $lte: ['$currentStock', '$minStock'] } });
  return {
    answer: lowItems.length > 0 ? `${lowItems.length} ingredients need restocking immediately.` : 'Inventory looks healthy — no critical shortages.',
    dataPoints: lowItems.map(i => ({ label: i.name, value: `${i.currentStock} ${i.unit} (min: ${i.minStock})` })),
    insights: lowItems.length > 0 ? ['Low stock items can cause menu unavailability during service'] : ['Continue monitoring daily to avoid surprise shortages'],
    recommendations: lowItems.length > 0 ? ['Order these ingredients before next service', 'Set up supplier contacts for quick restocks'] : ['Schedule a weekly inventory review', 'Add recipes to track auto-deductions'],
  };
}

async function generalResponse() {
  return {
    answer: 'I can help you understand your restaurant\'s performance. Try asking:',
    dataPoints: [],
    insights: [],
    recommendations: [],
    suggestions: [
      'Why was revenue low today?',
      'What should I promote on the menu?',
      'How many staff do I need tonight?',
      'Which tables generate most revenue?',
      'When are my peak hours?',
      'How are my customers doing?',
    ],
  };
}

// ── Ask Copilot ────────────────────────────────────────────────
export const askCopilot = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) { res.status(400); return next(new Error('Question is required')); }

    const intent = detectIntent(question);
    const rid    = req.user.restaurant;

    const fnMap = { analyzeRevenue, analyzeProfit, analyzeStaffing, analyzeTable, analyzePeakHours, analyzeMenu, analyzeCustomers, analyzeInventory, general: generalResponse };
    const fn = fnMap[intent] || generalResponse;
    const result = await fn(rid);

    success(res, { question, intent, ...result, timestamp: new Date() });
  } catch (err) {
    next(err);
  }
};
