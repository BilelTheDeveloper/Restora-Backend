import Campaign from '../models/Campaign.js';
import Customer from '../models/Customer.js';
import { success, created } from '../utils/apiResponse.js';

export const getCampaigns = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = { restaurant: req.user.restaurant };
    if (status) filter.status = status;
    if (type) filter.type = type;
    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 });
    success(res, campaigns);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.create({ ...req.body, restaurant: req.user.restaurant, createdBy: req.user._id });
    created(res, campaign);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      req.body, { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    success(res, campaign);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const deleteCampaign = async (req, res) => {
  try {
    await Campaign.findOneAndDelete({ _id: req.params.id, restaurant: req.user.restaurant });
    success(res, { deleted: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const sendCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, restaurant: req.user.restaurant });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.status === 'completed') return res.status(400).json({ message: 'Campaign already completed' });
    const filter = { restaurant: req.user.restaurant };
    const seg = campaign.segment;
    if (seg?.type === 'vip') filter.vipStatus = true;
    if (seg?.type === 'inactive' && seg.inactiveDays) {
      filter.lastVisit = { $lte: new Date(Date.now() - seg.inactiveDays * 24 * 60 * 60 * 1000) };
    }
    if (seg?.type === 'high_spender' && seg.minSpend) filter.totalSpend = { $gte: seg.minSpend };
    const audience = await Customer.countDocuments(filter);
    await Campaign.findByIdAndUpdate(campaign._id, {
      status: 'completed',
      sentAt: new Date(),
      'stats.sent': audience,
      'stats.delivered': Math.floor(audience * 0.95),
    });
    success(res, { message: `Campaign queued for ${audience} recipients`, audienceSize: audience });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getCampaignStats = async (req, res) => {
  try {
    const rid = req.user.restaurant;
    const [total, running, completed, sent] = await Promise.all([
      Campaign.countDocuments({ restaurant: rid }),
      Campaign.countDocuments({ restaurant: rid, status: 'running' }),
      Campaign.countDocuments({ restaurant: rid, status: 'completed' }),
      Campaign.aggregate([
        { $match: { restaurant: rid } },
        { $group: { _id: null, totalSent: { $sum: '$stats.sent' }, totalDelivered: { $sum: '$stats.delivered' }, totalOpened: { $sum: '$stats.opened' } } },
      ]),
    ]);
    const s = sent[0] || {};
    success(res, {
      totalCampaigns: total,
      running,
      completed,
      totalSent: s.totalSent || 0,
      totalDelivered: s.totalDelivered || 0,
      openRate: s.totalDelivered > 0 ? ((s.totalOpened || 0) / s.totalDelivered * 100).toFixed(1) : 0,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
