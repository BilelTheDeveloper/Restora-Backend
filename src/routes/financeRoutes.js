import { Router } from 'express';
import { getExpenses, createExpense, updateExpense, deleteExpense, getPnL, getFinanceSummary } from '../controllers/financeController.js';

const router = Router();

router.get('/summary',  getFinanceSummary);
router.get('/pnl',      getPnL);
router.get('/expenses', getExpenses);
router.post('/expenses',        createExpense);
router.patch('/expenses/:id',   updateExpense);
router.delete('/expenses/:id',  deleteExpense);

export default router;
