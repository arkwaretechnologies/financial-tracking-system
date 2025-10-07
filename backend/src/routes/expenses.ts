import { Router } from 'express';
import { createExpense, getExpensesByClient, updateExpense, deleteExpense } from '../controllers/expenseController';

const router = Router();

router.get('/client/:clientId/store/:storeId', getExpensesByClient);
router.post('/', createExpense);
router.put('/:refNum', updateExpense);
router.delete('/:refNum', deleteExpense);

export default router;