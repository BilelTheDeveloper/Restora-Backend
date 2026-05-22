import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { success, created } from '../utils/apiResponse.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400);
      return next(new Error('Email already registered'));
    }

    const user = await User.create({ name, email, password, phone, role: 'owner' });
    const token = generateToken(user._id);

    created(res, {
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, verificationStatus: user.verificationStatus },
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    if (!user.isActive) {
      res.status(403);
      return next(new Error('Account is deactivated'));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    success(res, {
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, restaurant: user.restaurant, verificationStatus: user.verificationStatus },
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('restaurant', 'name slug logo');
    success(res, user);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, avatar }, { new: true, runValidators: true });
    success(res, user);
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      res.status(400);
      return next(new Error('Current password is incorrect'));
    }

    user.password = newPassword;
    await user.save();
    success(res, null, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
};

export const submitKYC = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.verificationStatus === 'approved') {
      return success(res, { verificationStatus: 'approved' }, 'Already verified');
    }
    await User.findByIdAndUpdate(req.user._id, { verificationStatus: 'under_review' });
    success(res, { verificationStatus: 'under_review' }, 'KYC submitted — under review');
  } catch (err) {
    next(err);
  }
};

export const getVerificationStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('verificationStatus rejectionReason');
    success(res, { verificationStatus: user.verificationStatus, rejectionReason: user.rejectionReason });
  } catch (err) {
    next(err);
  }
};
