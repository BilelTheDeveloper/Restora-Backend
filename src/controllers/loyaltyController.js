import LoyaltyProgram from '../models/LoyaltyProgram.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import Customer from '../models/Customer.js';
import { success } from '../utils/apiResponse.js';

export const getProgram = async (req, res) => {
  try {
    let program = await LoyaltyProgram.findOne({ restaurant: req.user.restaurant });
    if (!program) program = await LoyaltyProgram.create({ restaurant: req.user.restaurant });
    success(res, program);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateProgram = async (req, res) => {
  try {
    const program = await LoyaltyProgram.findOneAndUpdate(
      { restaurant: req.user.restaurant },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    success(res, program);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const getLoyaltyStats = async (req, res) => {
  try {
    const rid = req.user.restaurant;
    const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalMembers, activeMembers, earnTxns, redeemTxns] = await Promise.all([
      Customer.countDocuments({ restaurant: rid, 'loyalty.points': { $gt: 0 } }),
      Customer.countDocuments({ restaurant: rid, lastVisit: { $gte: thirtyAgo } }),
      LoyaltyTransaction.aggregate([
        { $match: { restaurant: rid, type: 'earn', createdAt: { $gte: thirtyAgo } } },
        { $group: { _id: null, total: { $sum: '$points' } } },
      ]),
      LoyaltyTransaction.aggregate([
        { $match: { restaurant: rid, type: 'redeem', createdAt: { $gte: thirtyAgo } } },
        { $group: { _id: null, total: { $sum: '$points' } } },
      ]),
    ]);
    const program = await LoyaltyProgram.findOne({ restaurant: rid });
    const tiers = program?.tiers || [];
    const tierCounts = await Promise.all(
      tiers.map(async tier => {
        const nextTier = tiers.find(t => t.minPoints > tier.minPoints);
        const count = await Customer.countDocuments({
          restaurant: rid,
          'loyalty.points': { $gte: tier.minPoints, ...(nextTier ? { $lt: nextTier.minPoints } : {}) },
        });
        return { name: tier.name, color: tier.color, count };
      })
    );
    success(res, {
      totalMembers,
      activeMembers,
      pointsEarned: earnTxns[0]?.total || 0,
      pointsRedeemed: redeemTxns[0]?.total || 0,
      redemptionRate: earnTxns[0]?.total > 0 ? ((redeemTxns[0]?.total || 0) / earnTxns[0].total * 100).toFixed(1) : 0,
      tierCounts,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getMembers = async (req, res) => {
  try {
    const { page = 1, limit = 50, tier } = req.query;
    const program = await LoyaltyProgram.findOne({ restaurant: req.user.restaurant });
    const tiers = program?.tiers || [];
    let filter = { restaurant: req.user.restaurant };
    if (tier) {
      const t = tiers.find(t => t.name.toLowerCase() === tier.toLowerCase());
      const next = t ? tiers.find(x => x.minPoints > t.minPoints) : null;
      if (t) filter['loyalty.points'] = { $gte: t.minPoints, ...(next ? { $lt: next.minPoints } : {}) };
    }
    const members = await Customer.find(filter)
      .sort({ 'loyalty.points': -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('name phone email vipStatus loyalty totalSpend totalVisits lastVisit');
    const withTier = members.map(m => {
      const pts = m.loyalty?.points || 0;
      const currentTier = [...tiers].reverse().find(t => pts >= t.minPoints) || tiers[0];
      return { ...m.toObject(), currentTier: currentTier?.name, tierColor: currentTier?.color };
    });
    success(res, withTier);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const adjustPoints = async (req, res) => {
  try {
    const { customerId, points, type = 'adjust', note } = req.body;
    const customer = await Customer.findOne({ _id: customerId, restaurant: req.user.restaurant });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const currentBalance = customer.loyalty?.points || 0;
    const newBalance = Math.max(0, currentBalance + points);
    await Customer.findByIdAndUpdate(customerId, {
      'loyalty.points': newBalance,
      $inc: { 'loyalty.lifetimePoints': points > 0 ? points : 0 },
    });
    const tx = await LoyaltyTransaction.create({
      restaurant: req.user.restaurant,
      customer: customerId,
      type,
      points,
      balance: newBalance,
      note,
    });
    success(res, { newBalance, transaction: tx });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const getTransactions = async (req, res) => {
  try {
    const { customerId } = req.query;
    const filter = { restaurant: req.user.restaurant };
    if (customerId) filter.customer = customerId;
    const txns = await LoyaltyTransaction.find(filter)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(100);
    success(res, txns);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
