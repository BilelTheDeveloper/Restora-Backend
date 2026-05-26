import { Router } from 'express';
import { getWaitlist, addToWaitlist, updateWaitlistEntry, getWaitlistStats, getAvailableTables } from '../controllers/waitlistController.js';

const router = Router();

router.get('/stats',    getWaitlistStats);
router.get('/tables',   getAvailableTables);
router.get('/',         getWaitlist);
router.post('/',        addToWaitlist);
router.patch('/:id',    updateWaitlistEntry);

export default router;
