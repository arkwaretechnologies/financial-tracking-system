import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get transactions by store
router.get('/store/:storeId', authenticateToken as any, async (req: any, res) => {
  try {
    const { storeId } = req.params;
    const { type, startDate, endDate } = req.query;
    const { supabase } = await import('../config/supabase');
    
    // First, get the store to verify access
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('client_id')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if user has access to this store's client
    if (req.user?.role !== 'super_admin' && req.user?.client_id !== store.client_id) {
      return res.status(403).json({ error: 'Access denied to this store' });
    }

    // Build query
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('store_id', storeId);

    // Filter by type if provided
    if (type && ['sale', 'purchase', 'expense'].includes(type as string)) {
      query = query.eq('type', type);
    }

    // Filter by date range if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    query = query.order('created_at', { ascending: false });

    const { data: transactions, error } = await query;

    if (error) throw error;

    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create transaction
router.post('/', authenticateToken as any, async (req: any, res) => {
  try {
    const { store_id, type, amount, category, description } = req.body;

    if (!store_id || !type || !amount || !category) {
      return res.status(400).json({ error: 'Store ID, type, amount, and category are required' });
    }

    if (!['sale', 'purchase', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    const { supabase } = await import('../config/supabase');

    // First, get the store to verify access
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('client_id')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if user has access to this store's client
    if (req.user?.role !== 'super_admin' && req.user?.client_id !== store.client_id) {
      return res.status(403).json({ error: 'Access denied to this store' });
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([{
        store_id,
        type,
        amount,
        category,
        description: description || '',
        created_by: req.user!.id
      }])
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ transaction, message: 'Transaction created successfully' });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction summary by store
router.get('/store/:storeId/summary', authenticateToken as any, async (req: any, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;
    const { supabase } = await import('../config/supabase');
    
    // First, get the store to verify access
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('client_id')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if user has access to this store's client
    if (req.user?.role !== 'super_admin' && req.user?.client_id !== store.client_id) {
      return res.status(403).json({ error: 'Access denied to this store' });
    }

    // Build query for summary
    let query = supabase
      .from('transactions')
      .select('type, amount')
      .eq('store_id', storeId);

    // Filter by date range if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: transactions, error } = await query;

    if (error) throw error;

    // Calculate summary
    const summary = {
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      netTotal: 0
    };

    transactions.forEach((transaction: any) => {
      switch (transaction.type) {
        case 'sale':
          summary.totalSales += transaction.amount;
          summary.netTotal += transaction.amount;
          break;
        case 'purchase':
          summary.totalPurchases += transaction.amount;
          summary.netTotal -= transaction.amount;
          break;
        case 'expense':
          summary.totalExpenses += transaction.amount;
          summary.netTotal -= transaction.amount;
          break;
      }
    });

    res.json({ summary, transactionCount: transactions.length });
  } catch (error) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;