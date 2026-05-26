import { Router } from 'express';
import { getPlatforms, getDeliveryOrders, getDeliveryStats, connectPlatform } from '../controllers/deliveryController.js';

const router = Router();

router.get('/platforms',           getPlatforms);
router.get('/stats',               getDeliveryStats);
router.get('/orders',              getDeliveryOrders);
router.post('/connect/:platform',  connectPlatform);

export default router;
