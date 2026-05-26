import { Router } from 'express';
import { getProgram, updateProgram, getLoyaltyStats, getMembers, adjustPoints, getTransactions } from '../controllers/loyaltyController.js';

const router = Router();

router.get('/program',      getProgram);
router.put('/program',      updateProgram);
router.get('/stats',        getLoyaltyStats);
router.get('/members',      getMembers);
router.post('/adjust',      adjustPoints);
router.get('/transactions', getTransactions);

export default router;
