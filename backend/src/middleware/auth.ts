import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return (res as any).status(401).json({ error: 'Access token required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Debug logging
    console.log('Token decoded:', JSON.stringify(decoded, null, 2));
    
    // Get user ID from the correct path in the token payload
    const userId = decoded.user?.id || decoded.userId;
    
    if (!userId) {
      console.error('No user ID found in token payload');
      return (res as any).status(401).json({ error: 'Invalid token - no user ID' });
    }
    
    // Verify user still exists and is active
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('User not found or error:', error);
      return (res as any).status(401).json({ error: 'Invalid token - user not found' });
    }

    (req as AuthRequest).user = user;
    next();
  } catch (error: any) {
    console.error('Token verification error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return (res as any).status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return (res as any).status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    return (res as any).status(403).json({ error: 'Token verification failed' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return (res as any).status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(authReq.user.role)) {
      return (res as any).status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireClientAccess = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return (res as any).status(401).json({ error: 'Authentication required' });
  }

  // Super admin can access all clients
  if (authReq.user.role === 'super_admin') {
    return next();
  }

  // Admin and client users need to belong to the client they're accessing
  const clientId = req.params.clientId || req.body.client_id;
  
  if (clientId && authReq.user.client_id !== clientId) {
    return (res as any).status(403).json({ error: 'Access denied to this client' });
  }

  next();
};