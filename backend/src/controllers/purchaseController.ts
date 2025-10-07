import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getPurchasesByClient = async (req: any, res: Response) => {
  try {
    const { clientId } = req.params;
    const { startDate, endDate, storeId, refNum, description, page = 1, pageSize = 10 } = req.query;

    console.log('Search parameters:', req.query);

    // Access control: Ensure user has access to this client's data
    if (req.user?.role !== 'super_admin' && req.user?.client_id !== clientId) {
      return res.status(403).json({ error: 'Access denied to this client' });
    }

    let query = supabase
      .from('purchases')
      .select(`
        *,
        category,
        other_category,
        stores (name)
      `)
      .eq('client_id', clientId);

    if (storeId && storeId !== 'all') {
      query = query.eq('store_id', storeId);
    }

    if (refNum) {
      query = query.ilike('ref_num', `%${refNum}%`);
    }

    if (description) {
      query = query.ilike('description', `%${description}%`);
    }

    if (startDate) {
      query = query.gte('purchase_date', startDate);
    }

    if (endDate) {
      query = query.lte('purchase_date', endDate);
    }

    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);
    
    query = query.order('purchase_date', { ascending: false });

    console.log('Constructed query:', query);

    const { data: purchases, error, count } = await query;

    if (error) {
      console.error('Get purchases error:', error);
      return res.status(500).json({ error: 'Failed to retrieve purchases', details: error.message });
    }

    // Transform the data to include store_name at the top level
    const transformedPurchases = purchases.map((purchase: any) => ({
      ...purchase,
      store_name: purchase.stores ? purchase.stores.name : null,
      stores: undefined, // Remove the nested stores object
    }));

    return res.status(200).json({ purchases: transformedPurchases, count });
  } catch (err: any) {
    console.error('Get purchases route error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};