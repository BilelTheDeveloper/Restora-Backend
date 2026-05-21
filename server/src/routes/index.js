import { Router } from 'express';
import authRoutes from './authRoutes.js';
import restaurantRoutes from './restaurantRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);

// Placeholder routes — will be built module by module
// router.use('/menu', menuRoutes);
// router.use('/orders', orderRoutes);
// router.use('/tables', tableRoutes);
// router.use('/reservations', reservationRoutes);
// router.use('/staff', staffRoutes);
// router.use('/inventory', inventoryRoutes);
// router.use('/delivery', deliveryRoutes);
// router.use('/analytics', analyticsRoutes);

export default router;
