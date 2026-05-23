import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword, submitKYC, getVerificationStatus } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, kycLimiter } from '../middleware/security.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.get('/me',    protect, getMe);
router.put('/me',    protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/kyc-submit', protect, kycLimiter, submitKYC);
router.get('/kyc-status', protect, getVerificationStatus);

export default router;
