import { Router } from 'express';
import { getPlatformStats, getKYCQueue, reviewKYC, getAllRestaurants } from '../controllers/adminController.js';
import {
  getMaintenance, toggleMaintenance,
  getPlatformSecuritySummary, getPlatformSecurityLogs,
} from '../controllers/platformController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect, authorize('superadmin'));

// Platform stats + KYC
router.get('/stats',          getPlatformStats);
router.get('/kyc-queue',      getKYCQueue);
router.put('/kyc-review/:id', reviewKYC);
router.get('/restaurants',    getAllRestaurants);

// Maintenance mode
router.get('/maintenance',    getMaintenance);
router.post('/maintenance',   toggleMaintenance);

// Platform-wide security
router.get('/security/summary', getPlatformSecuritySummary);
router.get('/security/logs',    getPlatformSecurityLogs);

export default router;
