import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { randomUUID } from 'crypto';
import path from 'path';
import { getPurchasesByClient } from '../controllers/purchaseController';

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

// Record a new purchase and optionally upload an image to the 'purchases' bucket
router.post('/', authenticateToken as any, async (req: any, res) => {
  try {
    const {
      client_id,
      store_id,
      description,
      supplier,
      payment_method,
      amount,
      purchase_date,
      image_base64,
      image_filename,
      category,
      other_category
    } = req.body;

    if (!client_id || !purchase_date || amount === undefined) {
      return res.status(400).json({ error: 'client_id, purchase_date, and amount are required' });
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
      const fileName = image_filename || `purchase_${randomUUID()}`;
      const contentType = getContentType(fileName);
      const objectPath = `${client_id}/${store_id || 'no-store'}/${Date.now()}_${fileName}`;

      const { error: uploadError } = await (supabase as any).storage
        .from('purchases')
        .upload(objectPath, buffer, { contentType, upsert: false });

      if (uploadError) {
        console.error('Purchases image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload purchases image', details: uploadError.message || uploadError });
      }

      const { data: urlData } = (supabase as any).storage.from('purchases').getPublicUrl(objectPath);
      publicUrl = urlData?.publicUrl || null;
    }

    // Insert purchase record into the 'purchases' table
    const { data: purchase, error } = await supabase
      .from('purchases')
      .insert([
        {
          client_id,
          ...(store_id && { store_id }),
          user_id: req.user?.id || null,
          description: description || null,
          supplier: supplier || null,
          payment_method: payment_method || null,
          amount: numericAmount,
          purchase_date,
          supp_doc_url: publicUrl,
          category: category || null,
          other_category: other_category || null,
        }
      ])
      .select('*')
      .single();

    if (error) {
      console.error('Create purchase error:', error);
      return res.status(500).json({ error: 'Failed to create purchase', details: error.message || error });
    }

    return res.status(201).json({ purchase, image_url: publicUrl, message: 'Purchase recorded successfully' });
  } catch (err: any) {
    console.error('Purchases route error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/client/:clientId', authenticateToken as any, getPurchasesByClient);

export default router;