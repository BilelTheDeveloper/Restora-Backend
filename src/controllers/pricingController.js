import PricingRule from '../models/PricingRule.js';
import { success, created } from '../utils/apiResponse.js';

export const getRules = async (req, res) => {
  try {
    const rules = await PricingRule.find({ restaurant: req.user.restaurant }).sort({ priority: -1, createdAt: -1 });
    success(res, rules);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createRule = async (req, res) => {
  try {
    const rule = await PricingRule.create({ ...req.body, restaurant: req.user.restaurant });
    created(res, rule);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const updateRule = async (req, res) => {
  try {
    const rule = await PricingRule.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      req.body, { new: true }
    );
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    success(res, rule);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const deleteRule = async (req, res) => {
  try {
    await PricingRule.findOneAndDelete({ _id: req.params.id, restaurant: req.user.restaurant });
    success(res, { deleted: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getActiveRules = async (req, res) => {
  try {
    const now = new Date();
    const hour = now.getHours();
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = days[now.getDay()];
    const rules = await PricingRule.find({ restaurant: req.user.restaurant, isActive: true });
    const active = rules.filter(r => {
      if (!r.trigger) return true;
      const t = r.trigger;
      if (t.conditionType === 'time' && t.startTime && t.endTime) {
        return timeStr >= t.startTime && timeStr <= t.endTime;
      }
      if (t.conditionType === 'day_of_week' && t.days?.length) {
        return t.days.includes(todayName);
      }
      return true;
    });
    success(res, active);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getPricingStats = async (req, res) => {
  try {
    const rid = req.user.restaurant;
    const [total, active, monthly] = await Promise.all([
      PricingRule.countDocuments({ restaurant: rid }),
      PricingRule.countDocuments({ restaurant: rid, isActive: true }),
      PricingRule.aggregate([{ $match: { restaurant: rid } }, { $group: { _id: null, totalUsage: { $sum: '$usageCount' } } }]),
    ]);
    success(res, { totalRules: total, activeRules: active, totalUsage: monthly[0]?.totalUsage || 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
