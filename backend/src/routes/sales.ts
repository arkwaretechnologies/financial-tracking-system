import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { randomUUID } from 'crypto';
import path from 'path';

const router = express.Router();

function getContentType(filename?: string) {
  const ext = (filename ? path.extname(filename).toLowerCase() : '').replace('.', '');
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg': return 'image/jpeg';
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

// Record a new sale and optionally upload an image to the 'sales' bucket
router.post('/', authenticateToken as any, async (req: any, res) => {
  try {
    const {
      client_id,
      store_id,
      description,
      payment_method,
      amount,
      sales_date,
      image_base64,
      image_filename
    } = req.body;

    if (!client_id || !sales_date || amount === undefined) {
      return res.status(400).json({ error: 'client_id, sales_date, and amount are required' });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      return res.status(400).json({ error: 'amount must be a non-negative number' });
    }

    // Access control: if store_id provided, ensure user has access to that store's client
    if (store_id) {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('client_id')
        .eq('id', store_id)
        .single();

      if (storeError || !store) {
        return res.status(404).json({ error: 'Store not found' });
      }

      if (req.user?.role !== 'super_admin' && req.user?.client_id !== store.client_id) {
        return res.status(403).json({ error: 'Access denied to this store' });
      }
    } else {
      // Without store_id, ensure client_id matches current user unless super_admin
      if (req.user?.role !== 'super_admin' && req.user?.client_id !== client_id) {
        return res.status(403).json({ error: 'Access denied to this client' });
      }
    }

    let publicUrl: string | null = null;
    if (image_base64) {
      const buffer = Buffer.from(image_base64, 'base64');
      const fileName = image_filename || `sale_${randomUUID()}`;
      const contentType = getContentType(fileName);
      const objectPath = `${client_id}/${store_id || 'no-store'}/${Date.now()}_${fileName}`;

      const { error: uploadError } = await (supabase as any).storage
        .from('sales')
        .upload(objectPath, buffer, { contentType, upsert: false });

      if (uploadError) {
        console.error('Sales image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload sales image', details: uploadError.message || uploadError });
      }

      const { data: urlData } = (supabase as any).storage.from('sales').getPublicUrl(objectPath);
      publicUrl = urlData?.publicUrl || null;
    }

    // Insert sale record into the 'sales' table
    const { data: sale, error } = await supabase
      .from('sales')
      .insert([
        {
          client_id,
          ...(store_id && { store_id }),
          user_id: req.user?.id || null,
          description: description || null,
          payment_method: payment_method || null,
          amount: numericAmount,
          sales_date,
          supporting_docs_bucket: publicUrl,
        }
      ])
      .select('*')
      .single();

    if (error) {
      console.error('Create sale error:', error);
      return res.status(500).json({ error: 'Failed to create sale', details: error.message || error });
    }

    return res.status(201).json({ sale, image_url: publicUrl, message: 'Sale recorded successfully' });
  } catch (err: any) {
    console.error('Sales route error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:saleId', authenticateToken as any, async (req: any, res) => {
  try {
    const { saleId } = req.params;
    const {
      store_id,
      description,
      payment_method,
      amount,
      sales_date,
    } = req.body;

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      return res.status(400).json({ error: 'Amount must be a non-negative number' });
    }

    const { data: existingSale, error: fetchError } = await supabase
      .from('sales')
      .select('client_id, store_id')
      .eq('id', saleId)
      .single();

    if (fetchError || !existingSale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    if (req.user?.role !== 'super_admin' && req.user?.client_id !== existingSale.client_id) {
      return res.status(403).json({ error: 'Access denied to this sale' });
    }

    const { data: updatedSale, error: updateError } = await supabase
      .from('sales')
      .update({
        ...(store_id && { store_id }),
        description,
        payment_method,
        amount: numericAmount,
        sales_date,
      })
      .eq('id', saleId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Update sale error:', updateError);
      return res.status(500).json({ error: 'Failed to update sale', details: updateError.message });
    }

    return res.status(200).json({ sale: updatedSale, message: 'Sale updated successfully' });
  } catch (err: any) {
    console.error('Update sale route error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/client/:clientId', authenticateToken as any, async (req: any, res) => {
  try {
    const { clientId } = req.params;
    const { startDate, endDate, storeId } = req.query;

    // Access control: Ensure user has access to this client's data
    if (req.user?.role !== 'super_admin' && req.user?.client_id !== clientId) {
      return res.status(403).json({ error: 'Access denied to this client' });
    }

    let query = supabase
      .from('sales')
      .select(`
        *,
        stores (name)
      `)
      .eq('client_id', clientId);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (startDate) {
      query = query.gte('sales_date', startDate);
    }

    if (endDate) {
      query = query.lte('sales_date', endDate);
    }

    query = query.order('sales_date', { ascending: false });

    const { data: sales, error } = await query;

    if (error) {
      console.error('Get sales error:', error);
      return res.status(500).json({ error: 'Failed to retrieve sales', details: error.message });
    }

    // Transform the data to include store_name at the top level
    const transformedSales = sales.map((sale: any) => ({
      ...sale,
      store_name: sale.stores ? sale.stores.name : null,
      stores: undefined, // Remove the nested stores object
    }));

    return res.status(200).json({ sales: transformedSales });
  } catch (err: any) {
    console.error('Get sales route error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:saleId', authenticateToken as any, async (req: any, res) => {
  try {
    const { saleId } = req.params;

    const { data: existingSale, error: fetchError } = await supabase
      .from('sales')
      .select('client_id')
      .eq('id', saleId)
      .single();

    if (fetchError || !existingSale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    if (req.user?.role !== 'super_admin' && req.user?.client_id !== existingSale.client_id) {
      return res.status(403).json({ error: 'Access denied to this sale' });
    }

    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId);

    if (deleteError) {
      console.error('Delete sale error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete sale', details: deleteError.message });
    }

    return res.status(200).json({ message: 'Sale deleted successfully' });
  } catch (err: any) {
    console.error('Delete sale route error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;