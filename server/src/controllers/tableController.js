import Table from '../models/Table.js';
import Restaurant from '../models/Restaurant.js';
import Reservation from '../models/Reservation.js';
import { success, created } from '../utils/apiResponse.js';

// ── Owner: get all tables ────────────────────────────────────
export const getMyTables = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id }).select('_id');
    if (!restaurant) { res.status(404); return next(new Error('Restaurant not found')); }
    const tables = await Table.find({ restaurant: restaurant._id, isActive: true }).sort('number');
    success(res, tables);
  } catch (err) { next(err); }
};

// ── Owner: create table ──────────────────────────────────────
export const createTable = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id }).select('_id');
    if (!restaurant) { res.status(404); return next(new Error('Restaurant not found')); }
    const { capacity, shape, position, floor } = req.body;
    let { number } = req.body;

    // Resolve duplicate table numbers gracefully
    if (number) {
      const conflict = await Table.findOne({ restaurant: restaurant._id, number });
      if (conflict) {
        let n = (await Table.countDocuments({ restaurant: restaurant._id })) + 1;
        while (await Table.findOne({ restaurant: restaurant._id, number: String(n) })) n++;
        number = String(n);
      }
    } else {
      let n = (await Table.countDocuments({ restaurant: restaurant._id })) + 1;
      while (await Table.findOne({ restaurant: restaurant._id, number: String(n) })) n++;
      number = String(n);
    }

    const table = await Table.create({
      restaurant: restaurant._id,
      number,
      capacity: capacity ?? 4,
      shape:    shape    ?? 'round',
      position: position ?? { x: 200, y: 200 },
      floor:    floor    ?? 'main',
    });
    created(res, table);
  } catch (err) { next(err); }
};

// ── Owner: update table ──────────────────────────────────────
export const updateTable = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id }).select('_id');
    if (!restaurant) { res.status(404); return next(new Error('Restaurant not found')); }
    const { number, capacity, shape, position, floor } = req.body;
    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurant: restaurant._id },
      { ...(number !== undefined && { number }), ...(capacity !== undefined && { capacity }), ...(shape !== undefined && { shape }), ...(position !== undefined && { position }), ...(floor !== undefined && { floor }) },
      { new: true, runValidators: true }
    );
    if (!table) { res.status(404); return next(new Error('Table not found')); }
    success(res, table);
  } catch (err) { next(err); }
};

// ── Owner: delete table ──────────────────────────────────────
export const deleteTable = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id }).select('_id');
    if (!restaurant) { res.status(404); return next(new Error('Restaurant not found')); }
    await Table.findOneAndDelete({ _id: req.params.id, restaurant: restaurant._id });
    success(res, null, 'Table deleted');
  } catch (err) { next(err); }
};

// ── Public: get tables for a restaurant (VIP booking) ───────
// Note: isPublished is NOT required here — the page layer handles that.
// We only require isActive + vipService.enabled so previews and staging work.
export const getPublicTables = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug, isActive: true })
      .select('_id vipService');
    if (!restaurant?.vipService?.enabled) return success(res, { tables: [], zones: [], room: null });
    const tables = await Table.find({ restaurant: restaurant._id, isActive: true })
      .select('number capacity shape position floor')
      .sort('number');
    success(res, {
      tables,
      zones: restaurant.vipService.zones ?? [],
      room:  restaurant.vipService.room  ?? null,
    });
  } catch (err) { next(err); }
};

// ── Public: table availability for a date + time ─────────────
export const getTableAvailability = async (req, res, next) => {
  try {
    const { date, time } = req.query;
    if (!date || !time) return success(res, { bookedTableIds: [] });
    const restaurant = await Restaurant.findOne({ slug: req.params.slug, isActive: true }).select('_id');
    if (!restaurant) return success(res, { bookedTableIds: [] });
    const d = new Date(date);
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end   = new Date(d); end.setHours(23, 59, 59, 999);
    const reservations = await Reservation.find({
      restaurant: restaurant._id,
      date: { $gte: start, $lte: end },
      time,
      status: { $in: ['pending', 'confirmed', 'seated'] },
      table: { $ne: null },
    }).select('table');
    success(res, { bookedTableIds: reservations.map(r => r.table?.toString()).filter(Boolean) });
  } catch (err) { next(err); }
};
