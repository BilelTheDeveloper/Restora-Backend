import { Router } from 'express';
import {
  createOrder, getOrders, getOrder,
  updateOrderStatus, processPayment, addOrderItem, getOrderSummary,
} from '../controllers/orderController.js';

const router = Router();

router.get('/summary',      getOrderSummary);
router.get('/',             getOrders);
router.post('/',            createOrder);
router.get('/:id',          getOrder);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/payment', processPayment);
router.post('/:id/items',   addOrderItem);

export default router;
