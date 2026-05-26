import { Router } from 'express';
import authRoutes from './authRoutes.js';
import restaurantRoutes from './restaurantRoutes.js';
import adminRoutes from './adminRoutes.js';
import ownerRoutes from './ownerRoutes.js';
import qrRoutes from './qrRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import { getPublicStatus } from '../controllers/platformController.js';

const router = Router();

router.get('/status',          getPublicStatus);   // public — never blocked by maintenance
router.use('/auth',            authRoutes);
router.use('/restaurants',     restaurantRoutes);
router.use('/platform-admin',  adminRoutes);
router.use('/owner',           ownerRoutes);
router.use('/qr',              qrRoutes);          // public QR ordering
router.use('/upload',          uploadRoutes);

export default router;
