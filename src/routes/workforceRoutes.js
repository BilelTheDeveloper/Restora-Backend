import { Router } from 'express';
import { getLaborAnalytics, getPayrollSummary, getStaffingForecast } from '../controllers/workforceController.js';

const router = Router();

router.get('/labor',    getLaborAnalytics);
router.get('/payroll',  getPayrollSummary);
router.get('/forecast', getStaffingForecast);

export default router;
