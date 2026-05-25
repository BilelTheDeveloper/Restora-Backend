import { Router } from 'express';
import { getQRMenu } from '../controllers/qrController.js';
import { createQROrder, tableRequest } from '../controllers/orderController.js';

const router = Router();

// Public QR routes — no auth
router.get('/:slug/:tableId',           getQRMenu);
router.post('/:slug/:tableId/order',    createQROrder);
router.post('/:slug/:tableId/request',  tableRequest);

export default router;
