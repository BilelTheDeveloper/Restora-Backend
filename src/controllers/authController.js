import User from '../models/User.js';
import SecurityLog from '../models/SecurityLog.js';
import generateToken from '../utils/generateToken.js';
import { validateBase64Size } from '../middleware/security.js';
import { success, created } from '../utils/apiResponse.js';

const logEvent = (event, severity, data) =>
  SecurityLog.create({ event, severity, ...data }).catch(() => {});

const getClientInfo = (req) => ({
  ip: req.ip || req.socket?.remoteAddress || 'unknown',
  userAgent: req.headers['user-agent'] || 'unknown',
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400);
      return next(new Error('Name, email and password are required'));
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400);
      return next(new Error('Invalid email format'));
    }

    if (password.length < 8) {
      res.status(400);
      return next(new Error('Password must be at least 8 characters'));
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      res.status(400);
      return next(new Error('Email already registered'));
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone?.trim(),
      role: 'owner',
    });

    logEvent('register', 'info', {
      userId: user._id,
      email: user.email,
      ...getClientInfo(req),
      message: 'New account registered',
    });

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
    const clientInfo = getClientInfo(req);

    if (!email?.trim() || !password) {
      res.status(400);
      return next(new Error('Email and password are required'));
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      // Log failed attempt — use generic message to prevent user enumeration
      logEvent('login_failed', 'warning', {
        email: email.toLowerCase().trim(),
        ...clientInfo,
        message: 'Failed login attempt',
      });
      res.status(401);
      return next(new Error('Invalid credentials'));
    }

    if (!user.isActive) {
      logEvent('account_deactivated', 'alert', {
        userId: user._id,
        email: user.email,
        ...clientInfo,
        message: 'Login attempt on deactivated account',
      });
      res.status(403);
      return next(new Error('Account is deactivated'));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logEvent('login_success', 'info', {
      userId: user._id,
      email: user.email,
      ...clientInfo,
      message: 'Successful login',
    });

    const token = generateToken(user._id);
    success(res, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurant: user.restaurant,
        verificationStatus: user.verificationStatus,
      },
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
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name?.trim(), phone: phone?.trim(), avatar },
      { new: true, runValidators: true }
    );
    success(res, user);
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      res.status(400);
      return next(new Error('New password must be at least 8 characters'));
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      res.status(400);
      return next(new Error('Current password is incorrect'));
    }

    user.password = newPassword;
    await user.save();

    logEvent('password_change', 'info', {
      userId: user._id,
      email: user.email,
      ...getClientInfo(req),
      message: 'Password changed successfully',
    });

    success(res, null, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
};

const MAX_B64_SIZE_MB = 5;
const VALID_DOC_TYPES = ['national_id', 'passport', 'drivers_license'];

export const submitKYC = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.verificationStatus === 'approved') {
      return success(res, { verificationStatus: 'approved' }, 'Already verified');
    }

    const { documentType, documentFront, documentBack, selfies } = req.body;

    // Validate document type
    if (!VALID_DOC_TYPES.includes(documentType)) {
      res.status(400);
      return next(new Error('Invalid document type'));
    }

    // Validate base64 image sizes
    if (!documentFront || !validateBase64Size(documentFront, MAX_B64_SIZE_MB)) {
      res.status(400);
      return next(new Error('Document front image is missing or too large (max 5MB)'));
    }
    if (documentBack && !validateBase64Size(documentBack, MAX_B64_SIZE_MB)) {
      res.status(400);
      return next(new Error('Document back image is too large (max 5MB)'));
    }
    if (!Array.isArray(selfies) || selfies.length !== 3 || !selfies.every(s => validateBase64Size(s, MAX_B64_SIZE_MB))) {
      res.status(400);
      return next(new Error('Exactly 3 valid selfie images are required (max 5MB each)'));
    }

    await User.findByIdAndUpdate(req.user._id, {
      verificationStatus: 'under_review',
      kycData: { documentType, documentFront, documentBack, selfies },
    });

    logEvent('kyc_submit', 'info', {
      userId: user._id,
      email: user.email,
      ...getClientInfo(req),
      message: 'KYC documents submitted for review',
    });

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
