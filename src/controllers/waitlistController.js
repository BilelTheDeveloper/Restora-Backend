import Waitlist from '../models/Waitlist.js';
import Table from '../models/Table.js';
import { success, created } from '../utils/apiResponse.js';

export const getWaitlist = async (req, res) => {
  try {
    const { status = 'waiting' } = req.query;
    const filter = { restaurant: req.user.restaurant };
    if (status !== 'all') filter.status = status;
    const entries = await Waitlist.find(filter)
      .populate('table', 'number capacity')
      .sort({ priority: -1, createdAt: 1 });
    success(res, entries);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const addToWaitlist = async (req, res) => {
  try {
    const waiting = await Waitlist.countDocuments({ restaurant: req.user.restaurant, status: 'waiting' });
    const avgWait = Math.max(5, waiting * 12);
    const entry = await Waitlist.create({
      ...req.body,
      restaurant: req.user.restaurant,
      estimatedWait: avgWait,
      queuePosition: waiting + 1,
    });
    created(res, entry);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const updateWaitlistEntry = async (req, res) => {
  try {
    const update = { ...req.body };
    if (req.body.status === 'notified') update.notifiedAt = new Date();
    if (req.body.status === 'seated') update.seatedAt = new Date();
    if (req.body.status === 'cancelled') update.cancelledAt = new Date();
    const entry = await Waitlist.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      update, { new: true }
    ).populate('table', 'number capacity');
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    success(res, entry);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const getWaitlistStats = async (req, res) => {
  try {
    const rid = req.user.restaurant;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [waiting, seated, noShow, cancelled] = await Promise.all([
      Waitlist.countDocuments({ restaurant: rid, status: 'waiting' }),
      Waitlist.countDocuments({ restaurant: rid, status: 'seated', seatedAt: { $gte: today } }),
      Waitlist.countDocuments({ restaurant: rid, status: 'no_show', createdAt: { $gte: today } }),
      Waitlist.countDocuments({ restaurant: rid, status: 'cancelled', createdAt: { $gte: today } }),
    ]);
    const avgWaitAgg = await Waitlist.aggregate([
      { $match: { restaurant: rid, status: 'seated', seatedAt: { $gte: today } } },
      { $project: { waitMinutes: { $divide: [{ $subtract: ['$seatedAt', '$createdAt'] }, 60000] } } },
      { $group: { _id: null, avg: { $avg: '$waitMinutes' } } },
    ]);
    success(res, {
      currentWaiting: waiting,
      seatedToday: seated,
      noShowToday: noShow,
      cancelledToday: cancelled,
      avgWaitMinutes: Math.round(avgWaitAgg[0]?.avg || 0),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getAvailableTables = async (req, res) => {
  try {
    const { partySize } = req.query;
    const filter = { restaurant: req.user.restaurant, status: 'available' };
    if (partySize) filter.capacity = { $gte: parseInt(partySize) };
    const tables = await Table.find(filter).sort({ capacity: 1 }).select('number capacity floor status');
    success(res, tables);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
