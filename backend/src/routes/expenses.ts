import { Router } from 'express';
import { createExpense, getExpensesByClient } from '../controllers/expenseController';

const router = Router();

router.get('/client/:clientId', getExpensesByClient);
router.post('/', createExpense);

export default router;