import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Get all clients (Super Admin only)
router.get('/', authenticateToken as any, requireRole(['super_admin']), async (req: any, res) => {
  try {
    const { supabase } = await import('../config/supabase');
    
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create client (Super Admin only)
router.post('/', authenticateToken as any, requireRole(['super_admin']), async (req: any, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const { supabase } = await import('../config/supabase');

    const { data: client, error } = await supabase
      .from('clients')
      .insert([{ name }])
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ client, message: 'Client created successfully' });

  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get client by ID (Super Admin only)
router.get('/:id', authenticateToken as any, requireRole(['super_admin']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { supabase } = await import('../config/supabase');
    
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;