import { Router } from 'express';
import { listCustomers, getCustomer, upsertCustomer, addVisitNote, getCustomerStats } from '../controllers/customerController.js';

const router = Router();

router.get('/stats', getCustomerStats);
router.get('/',      listCustomers);
router.post('/',     upsertCustomer);
router.get('/:id',   getCustomer);
router.post('/:id/visit', addVisitNote);

export default router;
