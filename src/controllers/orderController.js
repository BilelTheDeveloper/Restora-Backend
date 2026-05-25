import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import Customer from '../models/Customer.js';
import Recipe from '../models/Recipe.js';
import Ingredient from '../models/Ingredient.js';
import { emitToRestaurant } from '../socket.js';
import { success, created, paginated } from '../utils/apiResponse.js';

// ── Helpers ────────────────────────────────────────────────────
let _orderCounter = {};

async function nextOrderNumber(restaurantId) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const key = `${restaurantId}:${today}`;
  if (!_orderCounter[key]) {
    const last = await Order.findOne({
      restaurant: restaurantId,
      orderNumber: new RegExp(`^ORD-${today}`),
    }).sort({ orderNumber: -1 });
    _orderCounter[key] = last
      ? parseInt(last.orderNumber.split('-')[2] || '0', 10)
      : 0;
  }
  _orderCounter[key] += 1;
  return `ORD-${today}-${String(_orderCounter[key]).padStart(4, '0')}`;
}

async function deductIngredients(restaurantId, items) {
  for (const item of items) {
    const recipe = await Recipe.findOne({ restaurant: restaurantId, menuItemName: item.name })
      .populate('ingredients.ingredient');
    if (!recipe) continue;
    for (const ri of recipe.ingredients) {
      if (!ri.ingredient) continue;
      const deduct = ri.quantity * item.quantity;
      await Ingredient.findByIdAndUpdate(ri.ingredient._id, {
        $inc: { currentStock: -deduct },
      });
    }
  }
}

// ── Create Order ───────────────────────────────────────────────
export const createOrder = async (req, res, next) => {
  try {
    const { type, items, tableId, customerName, customerPhone, deliveryAddress, notes, paymentMethod } = req.body;

    if (!type || !items?.length) {
      res.status(400);
      return next(new Error('Order type and items are required'));
    }

    const restaurant = await Restaurant.findById(req.user.restaurant);
    if (!restaurant) {
      res.status(404);
      return next(new Error('Restaurant not found'));
    }

    // Calculate totals from menu
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      let menuItem = null;
      for (const cat of restaurant.menu) {
        menuItem = cat.items.find(i => i._id.toString() === item.menuItemId || i.name === item.name);
        if (menuItem) break;
      }
      if (!menuItem) {
        res.status(400);
        return next(new Error(`Menu item not found: ${item.name || item.menuItemId}`));
      }
      const lineTotal = menuItem.price * (item.quantity || 1);
      subtotal += lineTotal;
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity || 1,
        notes: item.notes || '',
        status: 'pending',
      });
    }

    const taxAmount = subtotal * (restaurant.settings.taxRate / 100);
    const serviceCharge = subtotal * (restaurant.settings.serviceCharge / 100);
    const total = subtotal + taxAmount + serviceCharge;
    const orderNumber = await nextOrderNumber(req.user.restaurant);

    const order = await Order.create({
      restaurant: req.user.restaurant,
      orderNumber,
      type,
      items: orderItems,
      table: tableId || null,
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      deliveryAddress: deliveryAddress || {},
      notes: notes || '',
      subtotal,
      taxAmount,
      serviceCharge,
      total,
      paymentMethod: paymentMethod || 'unpaid',
      paymentStatus: 'pending',
      status: 'pending',
    });

    // Link table → occupied
    if (tableId && type === 'dine-in') {
      await Table.findByIdAndUpdate(tableId, { status: 'occupied', currentOrder: order._id });
      emitToRestaurant(req.user.restaurant, 'table:status_changed', { tableId, status: 'occupied' });
    }

    // Deduct ingredients async (non-blocking)
    deductIngredients(req.user.restaurant, orderItems).catch(() => {});

    // Upsert customer profile
    if (customerPhone) {
      Customer.findOneAndUpdate(
        { restaurant: req.user.restaurant, phone: customerPhone },
        {
          $setOnInsert: { name: customerName || customerPhone, restaurant: req.user.restaurant, phone: customerPhone },
          $inc: { totalVisits: 1, totalSpend: total },
          $set: { lastVisit: new Date() },
          $push: { visitHistory: { date: new Date(), orderId: order._id, spend: total } },
        },
        { upsert: true, new: true }
      ).then(c => {
        if (c) {
          const avg = c.totalVisits > 0 ? c.totalSpend / c.totalVisits : total;
          c.updateOne({ averageSpend: avg }).catch(() => {});
        }
      }).catch(() => {});
    }

    const populated = await order.populate('table', 'number floor');
    emitToRestaurant(req.user.restaurant, 'order:new', populated);

    created(res, populated);
  } catch (err) {
    next(err);
  }
};

// ── Get Orders ─────────────────────────────────────────────────
export const getOrders = async (req, res, next) => {
  try {
    const { status, type, date, page = 1, limit = 50 } = req.query;
    const filter = { restaurant: req.user.restaurant };

    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;
    if (date) {
      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    } else {
      // Default: today
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end   = new Date(); end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('table', 'number floor')
      .populate('waiter', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    paginated(res, orders, { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// ── Get Single Order ───────────────────────────────────────────
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, restaurant: req.user.restaurant })
      .populate('table', 'number floor capacity')
      .populate('waiter', 'name avatar');
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }
    success(res, order);
  } catch (err) {
    next(err);
  }
};

// ── Update Order Status ────────────────────────────────────────
const VALID_TRANSITIONS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready:     ['served', 'delivered'],
  served:    ['completed'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({ _id: req.params.id, restaurant: req.user.restaurant });
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      res.status(400);
      return next(new Error(`Cannot transition from '${order.status}' to '${status}'`));
    }

    order.status = status;
    if (status === 'completed' || status === 'delivered' || status === 'served') {
      order.completedAt = new Date();
    }
    await order.save();

    // Free table on completion/cancellation
    if (order.table && ['completed', 'cancelled'].includes(status)) {
      await Table.findByIdAndUpdate(order.table, { status: 'cleaning', currentOrder: null });
      emitToRestaurant(req.user.restaurant, 'table:status_changed', { tableId: order.table, status: 'cleaning' });
    }

    emitToRestaurant(req.user.restaurant, 'order:status_changed', { orderId: order._id, status, orderNumber: order.orderNumber });

    success(res, order);
  } catch (err) {
    next(err);
  }
};

// ── Process Payment ────────────────────────────────────────────
export const processPayment = async (req, res, next) => {
  try {
    const { paymentMethod } = req.body;
    const order = await Order.findOne({ _id: req.params.id, restaurant: req.user.restaurant });
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }
    order.paymentMethod = paymentMethod || 'cash';
    order.paymentStatus = 'paid';
    if (['pending','confirmed','preparing','ready','served'].includes(order.status)) {
      order.status = 'completed';
      order.completedAt = new Date();
    }
    await order.save();

    if (order.table) {
      await Table.findByIdAndUpdate(order.table, { status: 'cleaning', currentOrder: null });
      emitToRestaurant(req.user.restaurant, 'table:status_changed', { tableId: order.table, status: 'cleaning' });
    }

    emitToRestaurant(req.user.restaurant, 'order:status_changed', {
      orderId: order._id, status: order.status, paymentStatus: 'paid', orderNumber: order.orderNumber,
    });

    success(res, order);
  } catch (err) {
    next(err);
  }
};

// ── Add Item to Order ──────────────────────────────────────────
export const addOrderItem = async (req, res, next) => {
  try {
    const { menuItemId, name, quantity = 1, notes } = req.body;
    const order = await Order.findOne({ _id: req.params.id, restaurant: req.user.restaurant });
    if (!order) { res.status(404); return next(new Error('Order not found')); }
    if (['completed','cancelled'].includes(order.status)) {
      res.status(400); return next(new Error('Cannot modify a closed order'));
    }

    const restaurant = await Restaurant.findById(req.user.restaurant);
    let menuItem = null;
    for (const cat of restaurant.menu) {
      menuItem = cat.items.find(i => i._id.toString() === menuItemId || i.name === name);
      if (menuItem) break;
    }
    if (!menuItem) { res.status(400); return next(new Error('Menu item not found')); }

    const existing = order.items.find(i => i.menuItem?.toString() === menuItem._id.toString());
    if (existing) {
      existing.quantity += quantity;
    } else {
      order.items.push({ menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity, notes: notes || '', status: 'pending' });
    }

    order.subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
    order.total = order.subtotal + order.taxAmount + order.serviceCharge - order.discountAmount;
    await order.save();

    emitToRestaurant(req.user.restaurant, 'order:updated', { orderId: order._id, orderNumber: order.orderNumber });
    success(res, order);
  } catch (err) {
    next(err);
  }
};

// ── Today's Summary (for dashboard) ────────────────────────────
export const getOrderSummary = async (req, res, next) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);

    const [result] = await Order.aggregate([
      { $match: { restaurant: req.user.restaurant, createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          totalRevenue:  { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } },
          totalOrders:   { $sum: 1 },
          paidOrders:    { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
          avgOrderValue: { $avg: '$total' },
          dineIn:        { $sum: { $cond: [{ $eq: ['$type', 'dine-in'] }, 1, 0] } },
          takeaway:      { $sum: { $cond: [{ $eq: ['$type', 'takeaway'] }, 1, 0] } },
          delivery:      { $sum: { $cond: [{ $eq: ['$type', 'delivery'] }, 1, 0] } },
          qr:            { $sum: { $cond: [{ $eq: ['$type', 'qr'] }, 1, 0] } },
        },
      },
    ]);

    const activeOrders = await Order.countDocuments({
      restaurant: req.user.restaurant,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] },
    });

    success(res, {
      ...(result || { totalRevenue: 0, totalOrders: 0, paidOrders: 0, avgOrderValue: 0, dineIn: 0, takeaway: 0, delivery: 0, qr: 0 }),
      activeOrders,
    });
  } catch (err) {
    next(err);
  }
};

// ── QR Public Order ────────────────────────────────────────────
export const createQROrder = async (req, res, next) => {
  try {
    const { slug, tableId } = req.params;
    const { items, customerName, customerPhone, notes } = req.body;

    if (!items?.length) { res.status(400); return next(new Error('Items required')); }

    const restaurant = await Restaurant.findOne({ slug, isPublished: true });
    if (!restaurant) { res.status(404); return next(new Error('Restaurant not found')); }

    const table = await Table.findOne({ _id: tableId, restaurant: restaurant._id, isActive: true });
    if (!table) { res.status(404); return next(new Error('Table not found')); }

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      let menuItem = null;
      for (const cat of restaurant.menu) {
        menuItem = cat.items.find(i => i._id.toString() === item.menuItemId || i.name === item.name);
        if (menuItem) break;
      }
      if (!menuItem) continue;
      subtotal += menuItem.price * (item.quantity || 1);
      orderItems.push({ menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: item.quantity || 1, notes: item.notes || '', status: 'pending' });
    }

    if (!orderItems.length) { res.status(400); return next(new Error('No valid items')); }

    const taxAmount = subtotal * (restaurant.settings.taxRate / 100);
    const total = subtotal + taxAmount;
    const orderNumber = await nextOrderNumber(restaurant._id);

    const order = await Order.create({
      restaurant: restaurant._id,
      orderNumber,
      type: 'qr',
      items: orderItems,
      table: tableId,
      customerName: customerName || 'QR Guest',
      customerPhone: customerPhone || '',
      notes: notes || '',
      subtotal, taxAmount, total,
      paymentMethod: 'unpaid',
      paymentStatus: 'pending',
      status: 'pending',
    });

    await Table.findByIdAndUpdate(tableId, { status: 'occupied', currentOrder: order._id });
    emitToRestaurant(restaurant._id, 'table:status_changed', { tableId, status: 'occupied' });
    emitToRestaurant(restaurant._id, 'order:new', order);

    created(res, { orderId: order._id, orderNumber: order.orderNumber, total });
  } catch (err) {
    next(err);
  }
};

// ── Table Request (call waiter / bill) ─────────────────────────
export const tableRequest = async (req, res, next) => {
  try {
    const { slug, tableId } = req.params;
    const { requestType } = req.body; // 'waiter' | 'bill'

    const restaurant = await Restaurant.findOne({ slug, isPublished: true });
    if (!restaurant) { res.status(404); return next(new Error('Restaurant not found')); }

    emitToRestaurant(restaurant._id, 'table:request', { tableId, requestType, restaurantId: restaurant._id });
    success(res, null, 'Request sent');
  } catch (err) {
    next(err);
  }
};
