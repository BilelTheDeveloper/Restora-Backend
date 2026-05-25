import { Router } from 'express';
import {
  getStaff, inviteStaff, updateStaff,
  getShifts, createShift, updateShift, deleteShift,
  getStaffPerformance,
} from '../controllers/staffController.js';

const router = Router();

router.get('/',                 getStaff);
router.post('/',                inviteStaff);
router.patch('/:id',            updateStaff);
router.get('/shifts',           getShifts);
router.post('/shifts',          createShift);
router.patch('/shifts/:id',     updateShift);
router.delete('/shifts/:id',    deleteShift);
router.get('/performance',      getStaffPerformance);

export default router;
