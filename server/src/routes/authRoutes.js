import { Router } from 'express';
import {
  register, login, refresh, logout,
  getMe, updateProfile, changePassword,
  submitKYC, getVerificationStatus,
  requestOTP, verifyOTP, updateNotifications,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, refreshLimiter, kycLimiter } from '../middleware/security.js';

const router = Router();

// ── Public ──────────────────────────────────────────────────
router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.post('/refresh',  refreshLimiter, refresh);   // httpOnly cookie → new access token
router.post('/logout',   protect, logout);           // requires valid access token to prevent CSRF logout

// ── Protected ───────────────────────────────────────────────
router.get('/me',              protect, getMe);
router.put('/me',              protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/kyc-submit',      protect, kycLimiter, submitKYC);
router.get('/kyc-status',      protect, getVerificationStatus);
router.post('/otp/request',    protect, requestOTP);
router.post('/otp/verify',     protect, verifyOTP);
router.put('/notifications',   protect, updateNotifications);

export default router;
