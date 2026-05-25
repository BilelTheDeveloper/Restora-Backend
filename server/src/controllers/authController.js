import crypto from 'crypto';
import User from '../models/User.js';
import OTP, { generateOTPCode } from '../models/OTP.js';
import SecurityLog from '../models/SecurityLog.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  getRefreshCookie,
} from '../utils/generateToken.js';
import { validateBase64Size } from '../middleware/security.js';
import { success, created } from '../utils/apiResponse.js';

const logEvent = (event, severity, data) =>
  SecurityLog.create({ event, severity, ...data }).catch(() => {});

const getClientInfo = (req) => ({
  ip:        req.ip || req.socket?.remoteAddress || 'unknown',
  userAgent: req.headers['user-agent'] || 'unknown',
});

// Safe user payload — never expose password, tokens, or lock fields to client
const safeUser = (u) => ({
  _id:                u._id,
  name:               u.name,
  email:              u.email,
  role:               u.role,
  restaurant:         u.restaurant,
  verificationStatus: u.verificationStatus,
  avatar:             u.avatar,
  phone:              u.phone,
});

// Issue both tokens and set cookie in one call
const issueTokens = async (res, user) => {
  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  setRefreshCookie(res, refreshToken);
  await user.addRefreshToken(refreshToken);
  return { accessToken };
};

// ── Register ───────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400);
      return next(new Error('Name, email and password are required'));
    }
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
      name:  name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone?.trim(),
      role:  'owner',
    });

    logEvent('register', 'info', {
      userId:  user._id,
      email:   user.email,
      ...getClientInfo(req),
      message: 'New account registered',
    });

    const { accessToken } = await issueTokens(res, user);
    created(res, { user: safeUser(user), accessToken });
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const clientInfo = getClientInfo(req);

    if (!email?.trim() || !password) {
      res.status(400);
      return next(new Error('Email and password are required'));
    }

    // Fetch with lockout fields
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password +loginAttempts +lockUntil +refreshTokens');

    // Account locked check
    if (user?.isLocked) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      logEvent('login_failed', 'warning', {
        email: email.toLowerCase().trim(),
        ...clientInfo,
        message: `Login blocked — account locked for ${remaining} more min`,
      });
      res.status(423);
      return next(new Error(`Account locked due to too many failed attempts. Try again in ${remaining} minutes.`));
    }

    const passwordOk = user && await user.matchPassword(password);

    if (!user || !passwordOk) {
      // Increment lockout counter even for unknown emails (prevents user enumeration)
      if (user) await user.incLoginAttempts();
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
        userId:  user._id,
        email:   user.email,
        ...clientInfo,
        message: 'Login attempt on deactivated account',
      });
      res.status(403);
      return next(new Error('Account is deactivated'));
    }

    // Success — reset lockout, update last login
    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logEvent('login_success', 'info', {
      userId:  user._id,
      email:   user.email,
      ...clientInfo,
      message: 'Successful login',
    });

    const { accessToken } = await issueTokens(res, user);
    success(res, { user: safeUser(user), accessToken });
  } catch (err) {
    next(err);
  }
};

// ── Refresh — rotate refresh token, issue new access token ─
export const refresh = async (req, res, next) => {
  try {
    const token = getRefreshCookie(req);
    if (!token) {
      res.status(401);
      return next(new Error('No refresh token'));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      clearRefreshCookie(res);
      res.status(401);
      return next(new Error('Invalid or expired refresh token'));
    }

    if (decoded.type !== 'refresh') {
      clearRefreshCookie(res);
      res.status(401);
      return next(new Error('Wrong token type'));
    }

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.isActive) {
      clearRefreshCookie(res);
      res.status(401);
      return next(new Error('User not found or inactive'));
    }

    // Verify the token is in our store (rotation check — detects token reuse)
    const stored = user.refreshTokens.some(t => t.token === token);
    if (!stored) {
      // Possible token theft — invalidate ALL refresh tokens for this user
      await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: [] } });
      clearRefreshCookie(res);
      logEvent('suspicious_request', 'critical', {
        userId:  user._id,
        email:   user.email,
        ip:      req.ip,
        message: 'Refresh token reuse detected — all sessions invalidated',
      });
      res.status(401);
      return next(new Error('Session compromised — please log in again'));
    }

    // Rotate: remove old, issue new
    await user.removeRefreshToken(token);
    const newRefreshToken = generateRefreshToken(user._id);
    setRefreshCookie(res, newRefreshToken);
    await user.addRefreshToken(newRefreshToken);

    const accessToken = generateAccessToken(user._id);
    success(res, { accessToken });
  } catch (err) {
    next(err);
  }
};

// ── Logout ─────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    const token = getRefreshCookie(req);
    if (token && req.user) {
      await req.user.removeRefreshToken(token).catch(() => {});
    }
    clearRefreshCookie(res);

    if (req.user) {
      logEvent('logout', 'info', {
        userId:  req.user._id,
        email:   req.user.email,
        ...getClientInfo(req),
        message: 'User logged out',
      });
    }

    success(res, null, 'Logged out');
  } catch (err) {
    next(err);
  }
};

// ── Get me ─────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('restaurant', 'name slug logo');
    success(res, user);
  } catch (err) {
    next(err);
  }
};

// ── Update profile ─────────────────────────────���───────────
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

// ── Change password ────────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      res.status(400);
      return next(new Error('New password must be at least 8 characters'));
    }

    const user = await User.findById(req.user._id).select('+password +refreshTokens');
    if (!(await user.matchPassword(currentPassword))) {
      res.status(400);
      return next(new Error('Current password is incorrect'));
    }

    // Password change invalidates ALL sessions (force re-login everywhere)
    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();
    clearRefreshCookie(res);

    logEvent('password_change', 'info', {
      userId:  user._id,
      email:   user.email,
      ...getClientInfo(req),
      message: 'Password changed — all sessions invalidated',
    });

    success(res, null, 'Password updated. Please log in again.');
  } catch (err) {
    next(err);
  }
};

// ── KYC ───────────────────────────────────────────────────
const MAX_B64_SIZE_MB  = 5;
const VALID_DOC_TYPES  = ['national_id', 'passport', 'drivers_license'];

export const submitKYC = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.verificationStatus === 'approved') {
      return success(res, { verificationStatus: 'approved' }, 'Already verified');
    }

    const { documentType, documentFront, documentBack, selfies } = req.body;

    if (!VALID_DOC_TYPES.includes(documentType)) {
      res.status(400);
      return next(new Error('Invalid document type'));
    }
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
      userId:  user._id,
      email:   user.email,
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

// ── OTP ───────────────────────────────────────────────────
export const requestOTP = async (req, res, next) => {
  try {
    const { type, newValue } = req.body;

    const VALID_TYPES = ['email_change', 'phone_change', 'password_reset'];
    if (!VALID_TYPES.includes(type)) {
      res.status(400);
      return next(new Error('Invalid OTP type'));
    }
    if (['email_change', 'phone_change'].includes(type) && !newValue?.trim()) {
      res.status(400);
      return next(new Error('New value is required'));
    }
    if (type === 'email_change' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue.trim())) {
      res.status(400);
      return next(new Error('Invalid email format'));
    }
    if (type === 'email_change') {
      const taken = await User.findOne({ email: newValue.toLowerCase().trim() });
      if (taken && taken._id.toString() !== req.user._id.toString()) {
        res.status(400);
        return next(new Error('Email already in use'));
      }
    }

    const recentCount = await OTP.countDocuments({
      userId:    req.user._id,
      type,
      createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) },
    });
    if (recentCount >= 3) {
      res.status(429);
      return next(new Error('Too many OTP requests. Please try again in an hour.'));
    }

    await OTP.deleteMany({ userId: req.user._id, type, used: false });

    const code      = generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OTP.create({ userId: req.user._id, code, type, newValue: newValue?.trim(), expiresAt });

    // In production: send via email/SMS transactional provider
    const isDev = process.env.NODE_ENV !== 'production';
    success(res, isDev ? { code, expiresIn: '10 minutes' } : {}, 'Verification code sent');
  } catch (err) {
    next(err);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { type, code, newPassword } = req.body;

    if (!type || !code) {
      res.status(400);
      return next(new Error('Type and code are required'));
    }
    if (type === 'password_reset' && (!newPassword || newPassword.length < 8)) {
      res.status(400);
      return next(new Error('New password must be at least 8 characters'));
    }

    const otp = await OTP.findOne({
      userId:    req.user._id,
      type,
      used:      false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp || otp.code !== String(code)) {
      res.status(400);
      return next(new Error('Invalid or expired verification code'));
    }

    otp.used = true;
    await otp.save();

    const user = await User.findById(req.user._id);

    if (type === 'email_change') {
      user.email = otp.newValue.toLowerCase().trim();
      await user.save({ validateBeforeSave: false });
      return success(res, { email: user.email }, 'Email updated successfully');
    }
    if (type === 'phone_change') {
      user.phone = otp.newValue.trim();
      await user.save({ validateBeforeSave: false });
      return success(res, { phone: user.phone }, 'Phone number updated successfully');
    }
    if (type === 'password_reset') {
      user.password = newPassword;
      await user.save();
      logEvent('password_change', 'info', {
        userId:  user._id,
        email:   user.email,
        ...getClientInfo(req),
        message: 'Password reset via OTP',
      });
      return success(res, null, 'Password reset successfully');
    }
  } catch (err) {
    next(err);
  }
};

// ── Notifications ──────────────────────────────────────────
export const updateNotifications = async (req, res, next) => {
  try {
    const allowed = ['email', 'orders', 'marketing', 'lowStock', 'dailyReport', 'sms'];
    const update  = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[`notifications.${key}`] = Boolean(req.body[key]);
    }
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('notifications');
    success(res, { notifications: user.notifications });
  } catch (err) {
    next(err);
  }
};
