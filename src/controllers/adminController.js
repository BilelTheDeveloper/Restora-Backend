import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import { success } from '../utils/apiResponse.js';

export const getPlatformStats = async (req, res, next) => {
  try {
    const [totalRestaurants, activeRestaurants, pendingKYC, totalOwners] = await Promise.all([
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'owner', verificationStatus: 'under_review' }),
      User.countDocuments({ role: 'owner' }),
    ]);
    success(res, { totalRestaurants, activeRestaurants, pendingKYC, totalOwners });
  } catch (err) { next(err); }
};

export const getKYCQueue = async (req, res, next) => {
  try {
    const { status = 'under_review' } = req.query;
    const users = await User.find({ role: 'owner', verificationStatus: status })
      .select('name email phone verificationStatus kycData rejectionReason createdAt restaurant')
      .populate('restaurant', 'name address slug')
      .sort({ createdAt: -1 });
    success(res, users);
  } catch (err) { next(err); }
};

export const reviewKYC = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); return next(new Error('User not found')); }

    if (action === 'approve') {
      user.verificationStatus = 'approved';
      user.rejectionReason = undefined;
    } else if (action === 'reject') {
      user.verificationStatus = 'rejected';
      user.rejectionReason = rejectionReason || 'KYC documents not accepted';
    } else {
      res.status(400);
      return next(new Error("Invalid action — use 'approve' or 'reject'"));
    }

    await user.save({ validateBeforeSave: false });
    success(res, { verificationStatus: user.verificationStatus }, `KYC ${action}d successfully`);
  } catch (err) { next(err); }
};

export const getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find()
      .select('name slug address cuisine rating isActive subscription createdAt')
      .populate('owner', 'name email verificationStatus')
      .sort({ createdAt: -1 });
    success(res, restaurants);
  } catch (err) { next(err); }
};
