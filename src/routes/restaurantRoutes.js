import { Router } from 'express';
import {
  createRestaurant,
  getMyRestaurant,
  updateRestaurant,
  getPublicRestaurants,
  getPublicRestaurantBySlug,
} from '../controllers/restaurantController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/', getPublicRestaurants);
router.get('/:slug', getPublicRestaurantBySlug);

// Protected
router.post('/', protect, createRestaurant);
router.get('/admin/mine', protect, authorize('owner', 'manager', 'superadmin'), getMyRestaurant);
router.put('/admin/mine', protect, authorize('owner', 'superadmin'), updateRestaurant);

export default router;
