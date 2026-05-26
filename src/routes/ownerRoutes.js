import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getHealth } from '../controllers/healthController.js';
import { getMySecurityLogs, getMySecuritySummary } from '../controllers/securityController.js';
import { getMyTables, createTable, updateTable, deleteTable } from '../controllers/tableController.js';
import { getMyReservations, updateReservationStatus } from '../controllers/reservationController.js';
import orderRoutes      from './orderRoutes.js';
import analyticsRoutes  from './analyticsRoutes.js';
import alertRoutes      from './alertRoutes.js';
import customerRoutes   from './customerRoutes.js';
import staffRoutes      from './staffRoutes.js';
import inventoryRoutes  from './inventoryRoutes.js';
import copilotRoutes    from './copilotRoutes.js';
import workforceRoutes  from './workforceRoutes.js';
import supplierRoutes   from './supplierRoutes.js';
import loyaltyRoutes    from './loyaltyRoutes.js';
import campaignRoutes   from './campaignRoutes.js';
import waitlistRoutes   from './waitlistRoutes.js';
import financeRoutes    from './financeRoutes.js';
import forecastingRoutes from './forecastingRoutes.js';
import reviewRoutes     from './reviewRoutes.js';
import deliveryRoutes   from './deliveryRoutes.js';
import pricingRoutes    from './pricingRoutes.js';
import { getTableQRData } from '../controllers/qrController.js';

const router = Router();

router.use(protect, authorize('owner', 'superadmin', 'manager'));

router.get('/health',            getHealth);
router.get('/security/logs',     getMySecurityLogs);
router.get('/security/summary',  getMySecuritySummary);

// Tables (VIP floor plan CRUD)
router.get('/tables',           getMyTables);
router.post('/tables',          createTable);
router.patch('/tables/:id',     updateTable);
router.delete('/tables/:id',    deleteTable);
router.get('/tables/qr-data',   getTableQRData);

// Reservations
router.get('/reservations',              getMyReservations);
router.patch('/reservations/:id/status', updateReservationStatus);

// Feature modules
router.use('/orders',      orderRoutes);
router.use('/analytics',   analyticsRoutes);
router.use('/alerts',      alertRoutes);
router.use('/customers',   customerRoutes);
router.use('/staff',       staffRoutes);
router.use('/inventory',   inventoryRoutes);
router.use('/copilot',     copilotRoutes);
router.use('/workforce',   workforceRoutes);
router.use('/suppliers',   supplierRoutes);
router.use('/loyalty',     loyaltyRoutes);
router.use('/campaigns',   campaignRoutes);
router.use('/waitlist',    waitlistRoutes);
router.use('/finance',     financeRoutes);
router.use('/forecasting', forecastingRoutes);
router.use('/reviews',     reviewRoutes);
router.use('/delivery',    deliveryRoutes);
router.use('/pricing',     pricingRoutes);

export default router;
