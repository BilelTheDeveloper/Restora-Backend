import { Router } from 'express';
import {
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getPurchaseOrders, createPurchaseOrder, updatePurchaseOrder,
  getReplenishmentSuggestions, getPurchaseStats,
} from '../controllers/supplierController.js';

const router = Router();

router.get('/stats',            getPurchaseStats);
router.get('/replenishment',    getReplenishmentSuggestions);

router.get('/',                 getSuppliers);
router.post('/',                createSupplier);
router.patch('/:id',            updateSupplier);
router.delete('/:id',           deleteSupplier);

router.get('/orders',           getPurchaseOrders);
router.post('/orders',          createPurchaseOrder);
router.patch('/orders/:id',     updatePurchaseOrder);

export default router;
