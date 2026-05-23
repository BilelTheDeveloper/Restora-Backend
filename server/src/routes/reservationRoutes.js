import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getMyReservations, updateReservationStatus } from '../controllers/reservationController.js';

const router = Router();
router.use(protect, authorize('owner', 'manager', 'superadmin'));

router.get('/', getMyReservations);
router.patch('/:id/status', updateReservationStatus);

export default router;
