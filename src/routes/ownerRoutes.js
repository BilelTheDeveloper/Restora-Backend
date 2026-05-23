import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getHealth } from '../controllers/healthController.js';
import { getMySecurityLogs, getMySecuritySummary } from '../controllers/securityController.js';

const router = Router();

router.use(protect, authorize('owner', 'superadmin', 'manager'));

router.get('/health',            getHealth);
router.get('/security/logs',     getMySecurityLogs);
router.get('/security/summary',  getMySecuritySummary);

export default router;
