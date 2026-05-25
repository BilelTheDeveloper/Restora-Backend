import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import { success } from '../utils/apiResponse.js';

// ── QR Menu (public) ───────────────────────────────────────────
export const getQRMenu = async (req, res, next) => {
  try {
    const { slug, tableId } = req.params;

    const restaurant = await Restaurant.findOne({ slug, isPublished: true, isActive: true })
      .select('name slug logo coverImage menu settings template description contact openingHours');
    if (!restaurant) { res.status(404); return next(new Error('Restaurant not found')); }

    const table = await Table.findOne({ _id: tableId, restaurant: restaurant._id, isActive: true })
      .select('number floor capacity status currentOrder');
    if (!table) { res.status(404); return next(new Error('Table not found')); }

    success(res, { restaurant, table });
  } catch (err) {
    next(err);
  }
};

// ── Get Table QR Data (admin) ──────────────────────────────────
export const getTableQRData = async (req, res, next) => {
  try {
    const tables = await Table.find({ restaurant: req.user.restaurant, isActive: true })
      .select('number floor capacity status shape');

    const clientUrl = process.env.CLIENT_URL?.split(',')[0]?.trim() || 'http://localhost:5173';

    const result = tables.map(t => ({
      ...t.toObject(),
      qrUrl:  `${clientUrl}/qr/${req.restaurantSlug || 'my-restaurant'}/${t._id}`,
      qrData: `${clientUrl}/qr/${req.restaurantSlug || 'my-restaurant'}/${t._id}`,
    }));

    success(res, result);
  } catch (err) {
    next(err);
  }
};

// ── Middleware to inject slug for QR controller ────────────────
export const injectSlug = async (req, res, next) => {
  try {
    const { Restaurant: R } = await import('../models/Restaurant.js');
    const r = await R.findById(req.user.restaurant).select('slug');
    req.restaurantSlug = r?.slug || 'restaurant';
    next();
  } catch {
    next();
  }
};
