import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getMyTables, createTable, updateTable, deleteTable } from '../controllers/tableController.js';

const router = Router();
router.use(protect, authorize('owner', 'manager', 'superadmin'));

router.route('/').get(getMyTables).post(createTable);
router.route('/:id').patch(updateTable).delete(deleteTable);

export default router;
