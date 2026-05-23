import { Router } from 'express';
import {
  createRestaurant,
  getMyRestaurant,
  updateRestaurant,
  upsertMyRestaurant,
  getPublicRestaurants,
  getPublicRestaurantBySlug,
} from '../controllers/restaurantController.js';
import { getPublicTables, getTableAvailability } from '../controllers/tableController.js';
import { createPublicReservation } from '../controllers/reservationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/', getPublicRestaurants);
router.get('/:slug/tables/availability', getTableAvailability);
router.get('/:slug/tables', getPublicTables);
router.post('/:slug/reservations', createPublicReservation);
router.get('/:slug', getPublicRestaurantBySlug);

// Protected
router.post('/', protect, createRestaurant);
router.get('/admin/mine', protect, authorize('owner', 'manager', 'superadmin'), getMyRestaurant);
router.put('/admin/mine', protect, authorize('owner', 'superadmin'), updateRestaurant);
router.put('/admin/setup', protect, upsertMyRestaurant);

export default router;
