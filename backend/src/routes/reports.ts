import express from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

router.get('/gross-income', async (req, res) => {
  const { clientId, startDate, endDate } = req.query;

  if (!clientId || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  try {
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('amount')
      .eq('client_id', clientId)
      .gte('sales_date', startDate)
      .lte('sales_date', endDate);

    if (salesError) throw salesError;

    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('amount')
      .eq('client_id', clientId)
      .gte('purchase_date', startDate)
      .lte('purchase_date', endDate);

    if (purchasesError) throw purchasesError;

    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('client_id', clientId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

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

export default router;