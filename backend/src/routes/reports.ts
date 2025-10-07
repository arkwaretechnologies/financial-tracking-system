import express from 'express';
import { supabase } from '../config/supabase';
import * as reportsController from '../controllers/reportsController';

const router = express.Router();

router.get('/gross-income', async (req, res) => {
  const { clientId, startDate, endDate, store_id } = req.query;

  if (!clientId || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  try {
    const salesQuery = supabase
      .from('sales')
      .select('amount')
      .eq('client_id', clientId)
      .gte('sales_date', startDate)
      .lte('sales_date', endDate);

    if (store_id && store_id !== 'all') {
      salesQuery.eq('store_id', store_id);
    }

    const { data: sales, error: salesError } = await salesQuery;

    if (salesError) throw salesError;

    const purchasesQuery = supabase
      .from('purchases')
      .select('amount')
      .eq('client_id', clientId)
      .gte('purchase_date', startDate)
      .lte('purchase_date', endDate);

    if (store_id && store_id !== 'all') {
      purchasesQuery.eq('store_id', store_id);
    }

    const { data: purchases, error: purchasesError } = await purchasesQuery;

    if (purchasesError) throw purchasesError;

    const expensesQuery = supabase
      .from('expenses')
      .select('amount')
      .eq('client_id', clientId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

    if (store_id && store_id !== 'all') {
      expensesQuery.eq('store_id', store_id);
    }

    const { data: expenses, error: expensesError } = await expensesQuery;

    if (expensesError) throw expensesError;

    const totalSales = sales.reduce((sum: number, sale: { amount: number }) => sum + sale.amount, 0);
    const totalPurchases = purchases.reduce((sum: number, purchase: { amount: number }) => sum + purchase.amount, 0);
    const totalExpenses = expenses.reduce((sum: number, expense: { amount: number }) => sum + expense.amount, 0);

    const grossIncome = totalSales - (totalPurchases + totalExpenses);

    res.json({ grossIncome, totalSales, totalPurchases, totalExpenses });
  } catch (error) {
    console.error('Error calculating gross income:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/total-expenses', reportsController.getTotalExpenses);
router.get('/total-expenses-by-date', reportsController.getTotalExpensesByDate);

router.get('/total-sales', reportsController.getTotalSales);
router.get('/total-sales-by-date', reportsController.getTotalSalesByDate);
router.get('/total-purchases', reportsController.getTotalPurchases);
router.get('/total-purchases-by-date', reportsController.getTotalPurchasesByDate);

export default router;