import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getHealth } from '../controllers/healthController.js';
import { getMySecurityLogs, getMySecuritySummary } from '../controllers/securityController.js';
import { getMyTables, createTable, updateTable, deleteTable } from '../controllers/tableController.js';
import { getMyReservations, updateReservationStatus } from '../controllers/reservationController.js';

const router = Router();

router.use(protect, authorize('owner', 'superadmin', 'manager'));

router.get('/health',            getHealth);
router.get('/security/logs',     getMySecurityLogs);
router.get('/security/summary',  getMySecuritySummary);

// Tables
router.get('/tables',           getMyTables);
router.post('/tables',          createTable);
router.patch('/tables/:id',     updateTable);
router.delete('/tables/:id',    deleteTable);

// Reservations
router.get('/reservations',              getMyReservations);
router.patch('/reservations/:id/status', updateReservationStatus);

export default router;
