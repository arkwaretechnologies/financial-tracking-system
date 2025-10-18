import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import { CreateUserRequest, UpdateUserRequest } from '../types';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, client_id, first_name, last_name, phone, store_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUsersByClient = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const user: any = (req as any).user;
    
    console.log('Fetching users for client:', clientId);
    console.log('Requesting user:', user);
    
    // Check if user has access to this client
    if (user.role !== 'super_admin' && user.client_id !== clientId) {
      console.log('Access denied: user client_id does not match requested clientId');
      return res.status(403).json({ error: 'Access denied to this client' });
    }

    console.log('Querying Supabase for users...');
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, client_id, first_name, last_name, phone, store_id, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log(`Successfully fetched ${users?.length || 0} users`);
    res.json({ users });
  } catch (error: any) {
    console.error('Get client users error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const createUser = async (req: Request<{}, {}, CreateUserRequest>, res: Response) => {
  try {
    console.log('Create user request body:', req.body);
    const { username, email, password, role, client_id, store_id, first_name, last_name, phone_no } = req.body;
    const user: any = (req as any).user;

    if (!username || !email || !password || !role || !client_id) {
      return res.status(400).json({ error: 'Username, email, password, role, and client_id are required' });
    }

    // Check permissions
    if (user.role === 'client_user') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (user.role === 'admin' && user.client_id !== client_id) {
      return res.status(403).json({ error: 'Cannot create users for other clients' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Find the system role by name
    console.log('Looking for role:', role);
    const { data: systemRole, error: roleError } = await supabase
      .from('system_roles')
      .select('id, role_type')
      .eq('name', role)
      .eq('is_active', true)
      .single();

    console.log('Role lookup result:', { systemRole, roleError });

    if (roleError || !systemRole) {
      console.log('Role not found error:', roleError);
      return res.status(400).json({ error: `Role '${role}' not found` });
    }

    // Map system_role_type to user_role enum
    const mapRoleTypeToUserRole = (roleType: string): string => {
      if (roleType === 'super_admin') return 'super_admin';
      if (roleType === 'client_admin') return 'admin';
      return 'client_user'; // store_manager, accountant, cashier, viewer
    };

    // Prepare user data with system role fields (if available)
    const userData: any = {
      username,
      email,
      password: hashedPassword,
      role: mapRoleTypeToUserRole(systemRole.role_type), // Map role_type to user_role enum
      client_id,
      store_id: store_id || null,
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone_no || null
    };

    // Try to add system role fields (if columns exist)
    try {
      userData.system_role_id = systemRole.id;
      userData.role_type = systemRole.role_type;
      userData.role_assigned_at = new Date().toISOString();
      userData.role_assigned_by = user.id;
    } catch (error) {
      console.log('System role columns not available, using legacy role assignment');
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([userData])
      .select('id, username, email, role, client_id, store_id, first_name, last_name, phone, created_at')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      throw error;
    }

    res.status(201).json({ user: newUser, message: 'User created successfully' });
  } catch (error: any) {
    console.error('Create user error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const updateUser = async (req: Request<{ userId: string }, {}, UpdateUserRequest>, res: Response) => {
  try {
    const { userId } = req.params;
    const { username, email, password, role, store_id, first_name, last_name, phone_no } = req.body;
    const user: any = (req as any).user;

    // Get the user to check permissions
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, client_id')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check permissions
    if (user.role === 'admin' && user.client_id !== targetUser.client_id) {
      return res.status(403).json({ error: 'Cannot update users from other clients' });
    }

    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (store_id !== undefined) updateData.store_id = store_id || null;
    if (first_name !== undefined) updateData.first_name = first_name || null;
    if (last_name !== undefined) updateData.last_name = last_name || null;
    if (phone_no !== undefined) updateData.phone = phone_no || null;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Handle role assignment using system roles
    if (role) {
      // Find the system role by name
      const { data: systemRole, error: roleError } = await supabase
        .from('system_roles')
        .select('id, role_type')
        .eq('name', role)
        .eq('is_active', true)
        .single();

      if (roleError || !systemRole) {
        return res.status(400).json({ error: `Role '${role}' not found` });
      }

      // Map system_role_type to user_role enum
      const mapRoleTypeToUserRole = (roleType: string): string => {
        if (roleType === 'super_admin') return 'super_admin';
        if (roleType === 'client_admin') return 'admin';
        return 'client_user'; // store_manager, accountant, cashier, viewer
      };

      // Try to update with new system role information (if columns exist)
      try {
        updateData.system_role_id = systemRole.id;
        updateData.role_type = systemRole.role_type;
        updateData.role_assigned_at = new Date().toISOString();
        updateData.role_assigned_by = user.id;
      } catch (error) {
        console.log('System role columns not available, using legacy role assignment');
      }
      
      // Map role_type to user_role enum for backward compatibility
      updateData.role = mapRoleTypeToUserRole(systemRole.role_type);
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, username, email, role, client_id, store_id, first_name, last_name, created_at')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      throw error;
    }

    res.json({ user: updatedUser, message: 'User updated successfully' });
  } catch (error: any) {
    console.error('Update user error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user: any = (req as any).user;

    // Get the user to check permissions
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, client_id')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check permissions
    if (user.role === 'admin' && user.client_id !== targetUser.client_id) {
      return res.status(403).json({ error: 'Cannot delete users from other clients' });
    }

    // Prevent deleting yourself
    if (user.id === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

