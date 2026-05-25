import Reservation from '../models/Reservation.js';
import Table       from '../models/Table.js';
import Restaurant  from '../models/Restaurant.js';
import Alert       from '../models/Alert.js';
import { success, created } from '../utils/apiResponse.js';
import { emitToRestaurant } from '../socket.js';

// ── helpers ─────────────────────────────────────────────────────
function dayRange(dateStr) {
  const d     = new Date(dateStr);
  const start = new Date(d); start.setHours(0,  0,  0,   0);
  const end   = new Date(d); end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Minimum party size for a given table capacity:
// - 2-seat  → min 2 (exact)
// - 4-seat  → min 4 (exact)
// - 6-seat  → min 4 (capacity - 2)
// - 8-seat  → min 6 (capacity - 2)
// - 10-seat → min 8 (capacity - 2)
function minPartyForCapacity(capacity) {
  return capacity <= 4 ? capacity : capacity - 2;
}

// ── Public: create a VIP reservation ────────────────────────────
export const createPublicReservation = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug, isActive: true, isPublished: true })
      .select('_id name vipService');
    if (!restaurant) { res.status(404); return next(new Error('Restaurant not found')); }

    const { tableId, customerName, customerPhone, customerEmail, date, time, partySize, notes } = req.body;

    if (!customerName || !customerPhone || !date || !time || !partySize) {
      res.status(400); return next(new Error('Name, phone, date, time and party size are required'));
    }

    const party = Number(partySize);

    // ── Table validations ──────────────────────────────────────
    if (tableId) {
      const table = await Table.findOne({ _id: tableId, restaurant: restaurant._id, isActive: true });
      if (!table) { res.status(400); return next(new Error('Invalid table selected')); }

      // Party size must not exceed table capacity
      if (party > table.capacity) {
        res.status(400);
        return next(new Error(
          `Table ${table.number} seats ${table.capacity} — your party of ${party} is too large. Please select a bigger table.`
        ));
      }

      // Party size must meet the minimum for this table
      const minParty = minPartyForCapacity(table.capacity);
      if (party < minParty) {
        res.status(400);
        return next(new Error(
          `Table ${table.number} (${table.capacity} seats) requires a minimum of ${minParty} guests. Please select a smaller table or add more guests.`
        ));
      }

      // Check for existing reservation at this table/date/time
      const { start, end } = dayRange(date);
      const conflict = await Reservation.findOne({
        restaurant: rid,
        table: tableId,
        date: { $gte: start, $lte: end },
        time,
        status: { $in: ['pending', 'confirmed', 'seated'] },
      });
      if (conflict) {
        res.status(409);
        return next(new Error('This table is already reserved for that time slot — please choose a different time or table.'));
      }
    }

    // ── Create reservation ────────────────────────────────────
    const reservation = await Reservation.create({
      restaurant:    restaurant._id,
      table:         tableId || undefined,
      customerName:  customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail?.trim() || undefined,
      date:          new Date(date),
      time,
      partySize:     party,
      notes:         notes?.trim() || undefined,
    });

    // Populate table for the socket payload
    await reservation.populate('table', 'number capacity shape floor');

    // ── Create alert for the owner ─────────────────────────────
    const tableLabel = reservation.table ? `Table ${reservation.table.number}` : 'any table';
    const alert = await Alert.create({
      restaurant: restaurant._id,
      type:       'reservation_new',
      severity:   'info',
      title:      `New reservation — ${customerName.trim()}`,
      message:    `${party} guests · ${tableLabel} · ${date} at ${time}`,
      data:       { reservationId: reservation._id, customerName: customerName.trim(), partySize: party, date, time, tableId },
      actionLink: '/admin/reservations',
    });

    // ── Emit real-time events ──────────────────────────────────
    emitToRestaurant(restaurant._id, 'reservation:new', {
      reservation: reservation.toObject(),
      alert:       alert.toObject(),
    });

    created(res, reservation, 'Reservation submitted — the restaurant will confirm shortly!');
  } catch (err) { next(err); }
};

// ── Owner: get all reservations ──────────────────────────────────
export const getMyReservations = async (req, res, next) => {
  try {
    const rid = req.user.restaurant;
    if (!rid) { res.status(404); return next(new Error('No restaurant linked to this account')); }

    const { status, date } = req.query;
    const query = { restaurant: rid };
    if (status && status !== 'all') query.status = status;
    if (date) {
      const { start, end } = dayRange(date);
      query.date = { $gte: start, $lte: end };
    }

    const reservations = await Reservation.find(query)
      .populate('table', 'number capacity shape floor')
      .sort({ date: 1, time: 1 });

    success(res, reservations);
  } catch (err) { next(err); }
};

// ── Owner: update reservation status ────────────────────────────
export const updateReservationStatus = async (req, res, next) => {
  try {
    const rid = req.user.restaurant;
    if (!rid) { res.status(404); return next(new Error('No restaurant linked to this account')); }

    const VALID = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'];
    if (!VALID.includes(req.body.status)) { res.status(400); return next(new Error('Invalid status')); }

    const reservation = await Reservation.findOneAndUpdate(
      { _id: req.params.id, restaurant: rid },
      { status: req.body.status },
      { new: true }
    ).populate('table', 'number capacity shape floor');

    if (!reservation) { res.status(404); return next(new Error('Reservation not found')); }

    // ── Emit real-time update ─────────────────────────────────
    emitToRestaurant(rid, 'reservation:updated', reservation.toObject());

    // ── Create alert when owner confirms/cancels ───────────────
    if (req.body.status === 'confirmed') {
      const tableLabel = reservation.table ? `Table ${reservation.table.number}` : 'walk-in';
      await Alert.create({
        restaurant: rid,
        type:       'reservation_confirmed',
        severity:   'info',
        title:      `Reservation confirmed — ${reservation.customerName}`,
        message:    `${reservation.partySize} guests · ${tableLabel} · ${new Date(reservation.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at ${reservation.time}`,
        data:       { reservationId: reservation._id },
        actionLink: '/admin/reservations',
      });
    }

    if (req.body.status === 'cancelled') {
      await Alert.create({
        restaurant: rid,
        type:       'reservation_cancelled',
        severity:   'warning',
        title:      `Reservation cancelled — ${reservation.customerName}`,
        message:    `${reservation.partySize} guests · ${new Date(reservation.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at ${reservation.time}`,
        data:       { reservationId: reservation._id },
        actionLink: '/admin/reservations',
      });
    }

    success(res, reservation);
  } catch (err) { next(err); }
};

