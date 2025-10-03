import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getStoresByClient } from '../controllers/storeController';

const router = express.Router();

// Get stores by client
router.get('/client/:clientId', authenticateToken as any, getStoresByClient);

// Get store by ID
router.get('/:id', authenticateToken as any, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { supabase } = await import('../config/supabase');
    
    const { data: store, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if user has access to this store's client
    if (req.user?.role !== 'super_admin' && req.user?.client_id !== store.client_id) {
      return res.status(403).json({ error: 'Access denied to this store' });
    }

    res.json({ store });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create store (Admin and Super Admin)
router.post('/', authenticateToken as any, async (req: any, res) => {
  try {
    const { name, location, client_id } = req.body;

    if (!name || !client_id) {
      return res.status(400).json({ error: 'Store name and client ID are required' });
    }

    // Check permissions
    if (req.user?.role === 'client_user') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (req.user?.role === 'admin' && req.user?.client_id !== client_id) {
      return res.status(403).json({ error: 'Cannot create stores for other clients' });
    }

    const { supabase } = await import('../config/supabase');

    const { data: store, error } = await supabase
      .from('stores')
      .insert([{
        name,
        location: location || '',
        client_id
      }])
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ store, message: 'Store created successfully' });

  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;