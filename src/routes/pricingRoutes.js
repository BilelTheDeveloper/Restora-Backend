import { Router } from 'express';
import { getRules, createRule, updateRule, deleteRule, getActiveRules, getPricingStats } from '../controllers/pricingController.js';

const router = Router();

router.get('/stats',  getPricingStats);
router.get('/active', getActiveRules);
router.get('/',       getRules);
router.post('/',      createRule);
router.patch('/:id',  updateRule);
router.delete('/:id', deleteRule);

export default router;
