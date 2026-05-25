import User from '../models/User.js';
import StaffShift from '../models/StaffShift.js';
import Order from '../models/Order.js';
import { success, created } from '../utils/apiResponse.js';
import bcrypt from 'bcryptjs';

// ── Get Staff ──────────────────────────────────────────────────
export const getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({
      restaurant: req.user.restaurant,
      role: { $in: ['manager', 'cashier', 'waiter', 'kitchen', 'driver'] },
    }).select('name email phone role avatar isActive lastLogin createdAt');
    success(res, staff);
  } catch (err) {
    next(err);
  }
};

// ── Invite Staff ───────────────────────────────────────────────
export const inviteStaff = async (req, res, next) => {
  try {
    const { name, email, phone, role, temporaryPassword } = req.body;
    const ALLOWED_ROLES = ['manager', 'cashier', 'waiter', 'kitchen', 'driver'];

    if (!ALLOWED_ROLES.includes(role)) { res.status(400); return next(new Error('Invalid role')); }
    if (!name?.trim() || !email?.trim() || !temporaryPassword) {
      res.status(400); return next(new Error('Name, email, and temporary password are required'));
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) { res.status(400); return next(new Error('Email already registered')); }

    const member = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      password: temporaryPassword,
      role,
      restaurant: req.user.restaurant,
      verificationStatus: 'approved',
    });

    created(res, { _id: member._id, name: member.name, email: member.email, role: member.role });
  } catch (err) {
    next(err);
  }
};

// ── Update Staff Member ────────────────────────────────────────
export const updateStaff = async (req, res, next) => {
  try {
    const { name, phone, role, isActive } = req.body;
    const member = await User.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      { $set: { ...(name && { name }), ...(phone && { phone }), ...(role && { role }), ...(isActive !== undefined && { isActive }) } },
      { new: true }
    ).select('name email phone role avatar isActive');
    if (!member) { res.status(404); return next(new Error('Staff member not found')); }
    success(res, member);
  } catch (err) {
    next(err);
  }
};

// ── Shifts ─────────────────────────────────────────────────────
export const getShifts = async (req, res, next) => {
  try {
    const { weekStart } = req.query;
    const start = weekStart ? new Date(weekStart) : (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; })();
    const end   = new Date(start); end.setDate(end.getDate() + 6); end.setHours(23, 59, 59, 999);

    const shifts = await StaffShift.find({
      restaurant: req.user.restaurant,
      date: { $gte: start, $lte: end },
    }).populate('staff', 'name role avatar');

    success(res, shifts);
  } catch (err) {
    next(err);
  }
};

export const createShift = async (req, res, next) => {
  try {
    const { staffId, date, startTime, endTime, role } = req.body;
    const shift = await StaffShift.create({
      restaurant: req.user.restaurant,
      staff: staffId,
      date: new Date(date),
      startTime,
      endTime,
      role,
    });
    const populated = await shift.populate('staff', 'name role avatar');
    created(res, populated);
  } catch (err) {
    next(err);
  }
};

export const updateShift = async (req, res, next) => {
  try {
    const { startTime, endTime, status, minutesLate, notes } = req.body;
    const shift = await StaffShift.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      { $set: { ...(startTime && { startTime }), ...(endTime && { endTime }), ...(status && { status }), ...(minutesLate !== undefined && { minutesLate }), ...(notes && { notes }) } },
      { new: true }
    ).populate('staff', 'name role avatar');
    if (!shift) { res.status(404); return next(new Error('Shift not found')); }
    success(res, shift);
  } catch (err) {
    next(err);
  }
};

export const deleteShift = async (req, res, next) => {
  try {
    await StaffShift.findOneAndDelete({ _id: req.params.id, restaurant: req.user.restaurant });
    success(res, null, 'Shift deleted');
  } catch (err) {
    next(err);
  }
};

// ── Staff Performance ──────────────────────────────────────────
export const getStaffPerformance = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const rid  = req.user.restaurant;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const staff = await User.find({
      restaurant: rid,
      role: { $in: ['waiter', 'cashier'] },
    }).select('name role avatar');

    const performance = await Promise.all(staff.map(async (member) => {
      const [orderAgg, shiftAgg] = await Promise.all([
        Order.aggregate([
          { $match: { restaurant: rid, waiter: member._id, createdAt: { $gte: from } } },
          { $group: {
            _id: null,
            ordersHandled: { $sum: 1 },
            revenueGenerated: { $sum: '$total' },
          }},
        ]),
        StaffShift.aggregate([
          { $match: { restaurant: rid, staff: member._id, date: { $gte: from }, status: { $in: ['present', 'late'] } } },
          { $group: {
            _id: null,
            shiftsWorked: { $sum: 1 },
            totalLate:    { $sum: '$minutesLate' },
          }},
        ]),
      ]);

      return {
        staff: member,
        ordersHandled:    orderAgg[0]?.ordersHandled || 0,
        revenueGenerated: Math.round((orderAgg[0]?.revenueGenerated || 0) * 100) / 100,
        shiftsWorked:     shiftAgg[0]?.shiftsWorked || 0,
        avgLateMinutes:   shiftAgg[0]?.totalLate && shiftAgg[0]?.shiftsWorked
          ? Math.round(shiftAgg[0].totalLate / shiftAgg[0].shiftsWorked)
          : 0,
      };
    }));

    success(res, performance);
  } catch (err) {
    next(err);
  }
};
