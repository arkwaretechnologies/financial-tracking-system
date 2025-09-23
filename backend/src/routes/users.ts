import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Get all users (Super Admin and Admin)
router.get('/', authenticateToken as any, requireRole(['super_admin', 'admin']), async (req: any, res) => {
  try {
    const { supabase } = await import('../config/supabase');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, client_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users by client (Admin and Super Admin)
router.get('/client/:clientId', authenticateToken as any, requireRole(['super_admin', 'admin']), async (req: any, res) => {
  try {
    const { clientId } = req.params;
    const { supabase } = await import('../config/supabase');
    
    // Check if user has access to this client
    if (req.user?.role !== 'super_admin' && req.user?.client_id !== clientId) {
      return res.status(403).json({ error: 'Access denied to this client' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, client_id, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ users });
  } catch (error) {
    console.error('Get client users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (Admin and Super Admin)
router.post('/', authenticateToken as any, requireRole(['super_admin', 'admin']), async (req: any, res) => {
  try {
    const { username, email, password, role, client_id } = req.body;

    if (!username || !email || !password || !role || !client_id) {
      return res.status(400).json({ error: 'Username, email, password, role, and client_id are required' });
    }

    // Check permissions
    if (req.user?.role === 'client_user') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (req.user?.role === 'admin' && req.user?.client_id !== client_id) {
      return res.status(403).json({ error: 'Cannot create users for other clients' });
    }

    const bcrypt = await import('bcryptjs');
    const { supabase } = await import('../config/supabase');
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        password: hashedPassword,
        role,
        client_id
      }])
      .select('id, username, email, role, client_id, created_at')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      throw error;
    }

    res.status(201).json({ user, message: 'User created successfully' });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;