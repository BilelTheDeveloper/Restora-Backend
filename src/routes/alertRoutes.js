import { Router } from 'express';
import { getAlerts, markAlertRead, markAllRead, dismissAlert, getUnreadCount } from '../controllers/alertController.js';

const router = Router();

router.get('/',              getAlerts);
router.get('/unread-count',  getUnreadCount);
router.patch('/read-all',    markAllRead);
router.patch('/:id/read',    markAlertRead);
router.patch('/:id/dismiss', dismissAlert);

export default router;
