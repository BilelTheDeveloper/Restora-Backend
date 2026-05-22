import { Router } from 'express';
import { getPlatformStats, getKYCQueue, reviewKYC, getAllRestaurants } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect, authorize('superadmin'));

router.get('/stats',          getPlatformStats);
router.get('/kyc-queue',      getKYCQueue);
router.put('/kyc-review/:id', reviewKYC);
router.get('/restaurants',    getAllRestaurants);

export default router;
