import { Router } from 'express';
import {
  register, login, getMe, updateProfile, changePassword, submitKYC, getVerificationStatus,
  requestOTP, verifyOTP, updateNotifications,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, kycLimiter } from '../middleware/security.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.get('/me',    protect, getMe);
router.put('/me',    protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/kyc-submit',     protect, kycLimiter, submitKYC);
router.get('/kyc-status',     protect, getVerificationStatus);

router.post('/otp/request',   protect, requestOTP);
router.post('/otp/verify',    protect, verifyOTP);
router.put('/notifications',  protect, updateNotifications);

export default router;
