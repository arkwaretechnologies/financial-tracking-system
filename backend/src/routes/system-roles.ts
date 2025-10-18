import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Get system roles by client (Admin and Super Admin)
router.get('/client/:clientId', authenticateToken as any, requireRole(['super_admin', 'admin']), async (req: any, res) => {
  try {
    const { clientId } = req.params;
    const { supabase } = await import('../config/supabase');
    
    // Check if user has access to this client
    if (req.user?.role !== 'super_admin' && req.user?.client_id !== clientId) {
      return res.status(403).json({ error: 'Access denied to this client' });
    }

    const { data: roles, error } = await supabase
      .from('system_roles')
      .select('id, name, description, client_id, created_at')
      .eq('client_id', clientId)
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({ roles });
  } catch (error) {
    console.error('Get system roles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

