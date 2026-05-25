import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import { success, created, paginated } from '../utils/apiResponse.js';

// ── List Customers ─────────────────────────────────────────────
export const listCustomers = async (req, res, next) => {
  try {
    const { search, segment, page = 1, limit = 30 } = req.query;
    const filter = { restaurant: req.user.restaurant };

    if (search) {
      const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name:  { $regex: esc, $options: 'i' } },
        { phone: { $regex: esc, $options: 'i' } },
        { email: { $regex: esc, $options: 'i' } },
      ];
    }

    const now = new Date();
    const fortyFiveDaysAgo = new Date(now - 45 * 24 * 60 * 60 * 1000);

    if (segment === 'vip')      filter.vipStatus = true;
    if (segment === 'new')      filter.totalVisits = { $lte: 1 };
    if (segment === 'regular')  filter.totalVisits = { $gte: 3 };
    if (segment === 'inactive') filter.lastVisit = { $lt: fortyFiveDaysAgo };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Customer.countDocuments(filter);
    const customers = await Customer.find(filter)
      .sort({ lastVisit: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-visitHistory');

    paginated(res, customers, { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// ── Get Customer ───────────────────────────────────────────────
export const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, restaurant: req.user.restaurant })
      .populate('visitHistory.tableId', 'number floor')
      .populate('preferences.preferredTable', 'number floor');
    if (!customer) { res.status(404); return next(new Error('Customer not found')); }
    success(res, customer);
  } catch (err) {
    next(err);
  }
};

// ── Upsert Customer ────────────────────────────────────────────
export const upsertCustomer = async (req, res, next) => {
  try {
    const { phone, name, email, birthday, allergies, preferences, internalNotes, vipStatus, tags } = req.body;
    if (!phone?.trim()) { res.status(400); return next(new Error('Phone is required')); }

    const customer = await Customer.findOneAndUpdate(
      { restaurant: req.user.restaurant, phone: phone.trim() },
      {
        $setOnInsert: { restaurant: req.user.restaurant, phone: phone.trim() },
        $set: {
          ...(name          && { name: name.trim() }),
          ...(email         && { email: email.toLowerCase().trim() }),
          ...(birthday      && { birthday }),
          ...(allergies     && { allergies }),
          ...(preferences   && { preferences }),
          ...(internalNotes !== undefined && { internalNotes }),
          ...(vipStatus     !== undefined && { vipStatus }),
          ...(tags          && { tags }),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    success(res, customer);
  } catch (err) {
    next(err);
  }
};

// ── Add Visit Note ─────────────────────────────────────────────
export const addVisitNote = async (req, res, next) => {
  try {
    const { notes, spend = 0, partySize = 1 } = req.body;
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      {
        $push: { visitHistory: { date: new Date(), notes, spend, partySize } },
        $inc:  { totalVisits: 1, totalSpend: spend },
        $set:  { lastVisit: new Date() },
      },
      { new: true }
    );
    if (!customer) { res.status(404); return next(new Error('Customer not found')); }
    customer.averageSpend = customer.totalVisits > 0 ? customer.totalSpend / customer.totalVisits : 0;
    await customer.save();
    success(res, customer);
  } catch (err) {
    next(err);
  }
};

// ── Customer Stats ─────────────────────────────────────────────
export const getCustomerStats = async (req, res, next) => {
  try {
    const rid = req.user.restaurant;
    const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);

    const [total, vip, inactive, newThisMonth] = await Promise.all([
      Customer.countDocuments({ restaurant: rid }),
      Customer.countDocuments({ restaurant: rid, vipStatus: true }),
      Customer.countDocuments({ restaurant: rid, lastVisit: { $lt: fortyFiveDaysAgo } }),
      Customer.countDocuments({ restaurant: rid, createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }),
    ]);

    success(res, { total, vip, inactive, newThisMonth, regular: total - newThisMonth });
  } catch (err) {
    next(err);
  }
};
