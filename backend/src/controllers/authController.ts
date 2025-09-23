import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { LoginRequest } from '../types';

export const login = async (req: Request, res: Response) => {
  try {
    const { client_id, username, email, password }: LoginRequest & { username?: string } = req.body;

    if (!client_id || !password || (!username && !email)) {
      return res.status(400).json({ error: 'Client ID, password, and either username or email are required' });
    }

    // First, verify the client exists and get client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, contact_email, contact_phone, address, created_at')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Find user by username/email and client_id
    let userQuery = supabase
      .from('users')
      .select('*')
      .eq('client_id', client_id);

    if (username) {
      userQuery = userQuery.eq('username', username);
    } else if (email) {
      userQuery = userQuery.eq('email', email);
    }

    const { data: user, error: userError } = await userQuery.single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          client_id: user.client_id
        }
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: {
        ...userWithoutPassword,
        client_name: client.name,
        client_email: client.contact_email,
        client_phone: client.contact_phone,
        client_address: client.address,
        client_created_at: client.created_at
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role, client_id } = req.body;

    if (!username || !email || !password || !role || !client_id) {
      return res.status(400).json({ error: 'Username, email, password, role, and client_id are required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        password: hashedPassword,
        role,
        client_id
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      throw error;
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      user: userWithoutPassword,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const validateClient = async (req: Request, res: Response) => {
  try {
    const { client_id } = req.body;

    if (!client_id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    // Check if client exists in the database
    const { data: client, error } = await supabase
      .from('clients')
      .select('id, name, contact_email, contact_phone, address, created_at')
      .eq('id', client_id)
      .single();

    if (error || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ 
      valid: true, 
      client: {
        id: client.id,
        name: client.name,
        email: client.contact_email,
        phone: client.contact_phone,
        address: client.address,
        created_at: client.created_at
      }
    });

  } catch (error) {
    console.error('Client validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, role, client_id, first_name, last_name, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};