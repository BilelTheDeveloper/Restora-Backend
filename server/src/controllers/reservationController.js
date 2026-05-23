import Reservation from '../models/Reservation.js';
import Table from '../models/Table.js';
import Restaurant from '../models/Restaurant.js';
import { success, created } from '../utils/apiResponse.js';

// ── Public: create a VIP reservation ────────────────────────
export const createPublicReservation = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug, isActive: true, isPublished: true })
      .select('_id vipService');
    if (!restaurant) { res.status(404); return next(new Error('Restaurant not found')); }

    const { tableId, customerName, customerPhone, customerEmail, date, time, partySize, notes } = req.body;

    if (!customerName || !customerPhone || !date || !time || !partySize) {
      res.status(400); return next(new Error('Name, phone, date, time and party size are required'));
    }

    if (tableId) {
      const table = await Table.findOne({ _id: tableId, restaurant: restaurant._id, isActive: true });
      if (!table) { res.status(400); return next(new Error('Invalid table selected')); }

      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      const conflict = await Reservation.findOne({
        restaurant: restaurant._id,
        table: tableId,
        date: { $gte: start, $lte: end },
        time,
        status: { $in: ['pending', 'confirmed', 'seated'] },
      });
      if (conflict) { res.status(409); return next(new Error('This table is already reserved for that time slot')); }
    }

    const reservation = await Reservation.create({
      restaurant: restaurant._id,
      table: tableId || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail?.trim() || undefined,
      date: new Date(date),
      time,
      partySize: Number(partySize),
      notes: notes?.trim() || undefined,
    });

    created(res, reservation, 'Reservation created — we will confirm shortly!');
  } catch (err) { next(err); }
};

// ── Owner: get all reservations ──────────────────────────────
export const getMyReservations = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id }).select('_id');
    if (!restaurant) { res.status(404); return next(new Error('Restaurant not found')); }

    const { status, date } = req.query;
    const query = { restaurant: restaurant._id };
    if (status && status !== 'all') query.status = status;
    if (date) {
      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const reservations = await Reservation.find(query)
      .populate('table', 'number capacity shape')
      .sort({ date: 1, time: 1 });
    success(res, reservations);
  } catch (err) { next(err); }
};

// ── Owner: update reservation status ────────────────────────
export const updateReservationStatus = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id }).select('_id');
    if (!restaurant) { res.status(404); return next(new Error('Restaurant not found')); }

    const VALID = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'];
    if (!VALID.includes(req.body.status)) { res.status(400); return next(new Error('Invalid status')); }

    const reservation = await Reservation.findOneAndUpdate(
      { _id: req.params.id, restaurant: restaurant._id },
      { status: req.body.status },
      { new: true }
    ).populate('table', 'number capacity shape');

    if (!reservation) { res.status(404); return next(new Error('Reservation not found')); }
    success(res, reservation);
  } catch (err) { next(err); }
};
