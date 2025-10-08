import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getStoresByClient = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const user: any = (req as any).user;

    if (user.role !== 'super_admin' && user.client_id !== clientId) {
      return res.status(403).json({ error: 'Access denied to this client' });
    }

    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .eq('client_id', clientId)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ stores });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};