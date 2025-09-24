import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/roles - Get all system roles
router.get('/', async (req, res) => {
  try {
    const { data: roles, error } = await supabase
      .from('system_roles')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching roles:', error);
      return res.status(500).json({ error: 'Failed to fetch roles' });
    }

    res.json({ roles });
  } catch (error) {
    console.error('Error in GET /api/roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/roles/access-matrix - Get complete role-page access matrix
router.get('/access-matrix', async (req, res) => {
  try {
    const { data: matrix, error } = await supabase
      .from('role_page_access')
      .select(`
        *,
        system_roles!inner(name, role_type),
        pages!inner(page_key, page_name, page_group, route_path, icon_name)
      `)
      .eq('system_roles.is_active', true)
      .eq('pages.is_active', true)
      .order('system_roles(name)')
      .order('pages(page_group)')
      .order('pages(sort_order)');

    if (error) {
      console.error('Error fetching access matrix:', error);
      return res.status(500).json({ error: 'Failed to fetch access matrix' });
    }

    // Transform data into a structured format
    const accessMatrix = matrix.reduce((acc: any, item: any) => {
      const roleName = item.system_roles.name;
      if (!acc[roleName]) {
        acc[roleName] = {
          roleId: item.role_id,
          roleName: roleName,
          roleType: item.system_roles.role_type,
          pages: {}
        };
      }
      
      acc[roleName].pages[item.pages.page_key] = {
        pageId: item.page_id,
        pageName: item.pages.page_name,
        pageGroup: item.pages.page_group,
        accessLevel: item.access_level,
        canCreate: item.can_create,
        canRead: item.can_read,
        canUpdate: item.can_update,
        canDelete: item.can_delete,
        canExport: item.can_export,
        canImport: item.can_import,
        routePath: item.pages.route_path,
        iconName: item.pages.icon_name
      };
      
      return acc;
    }, {});

    res.json({ accessMatrix });
  } catch (error) {
    console.error('Error in GET /api/roles/access-matrix:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/roles/pages - Get all available pages
router.get('/pages', async (req, res) => {
  try {
    const { data: pages, error } = await supabase
      .from('pages')
      .select('*')
      .eq('is_active', true)
      .order('page_group')
      .order('sort_order')
      .order('page_name');

    if (error) {
      console.error('Error fetching pages:', error);
      return res.status(500).json({ error: 'Failed to fetch pages' });
    }

    // Group pages by group
    const groupedPages = pages.reduce((acc: any, page: any) => {
      if (!acc[page.page_group]) {
        acc[page.page_group] = [];
      }
      acc[page.page_group].push(page);
      return acc;
    }, {});

    res.json({ pages, groupedPages });
  } catch (error) {
    console.error('Error in GET /api/roles/pages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/roles/:roleId/access - Get access permissions for a specific role
router.get('/:roleId/access', async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const { data: access, error } = await supabase
      .from('role_page_access')
      .select(`
        *,
        pages!inner(page_key, page_name, page_group, route_path)
      `)
      .eq('role_id', roleId)
      .eq('pages.is_active', true)
      .order('pages(page_group)')
      .order('pages(sort_order)');

    if (error) {
      console.error('Error fetching role access:', error);
      return res.status(500).json({ error: 'Failed to fetch role access' });
    }

    res.json({ access });
  } catch (error) {
    console.error('Error in GET /api/roles/:roleId/access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/roles - Create a new system role
router.post('/', async (req, res) => {
  try {
    const { name, roleType, description } = req.body;
    
    if (!name || !roleType) {
      return res.status(400).json({ error: 'Name and role type are required' });
    }

    // Check if user has permission to create roles (super_admin only)
    const userRole = (req as any).user.role;
    if (userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super administrators can create roles' });
    }

    const { data: role, error } = await supabase
      .from('system_roles')
      .insert([{
        name,
        role_type: roleType,
        description: description || ''
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating role:', error);
      return res.status(500).json({ error: 'Failed to create role' });
    }

    // Log the role creation
    await supabase.from('role_audit_log').insert([{
      user_id: (req as any).user.id,
      role_id: role.id,
      action: 'role_created',
      details: { name, roleType, description }
    }]);

    res.status(201).json({ role });
  } catch (error) {
    console.error('Error in POST /api/roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/roles/:roleId/access - Update role page access
router.post('/:roleId/access', async (req, res) => {
  try {
    const { roleId } = req.params;
    const { pageAccess } = req.body; // Array of { pageId, accessLevel, canCreate, canRead, canUpdate, canDelete, canExport, canImport }
    
    if (!Array.isArray(pageAccess)) {
      return res.status(400).json({ error: 'pageAccess must be an array' });
    }

    // Check if user has permission to update role access (super_admin only)
    const userRole = (req as any).user.role;
    if (userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super administrators can update role access' });
    }

    // Start a transaction-like operation
    const updates = pageAccess.map(access => ({
      role_id: roleId,
      page_id: access.pageId,
      access_level: access.accessLevel,
      can_create: access.canCreate || false,
      can_read: access.canRead || false,
      can_update: access.canUpdate || false,
      can_delete: access.canDelete || false,
      can_export: access.canExport || false,
      can_import: access.canImport || false
    }));

    // Delete existing access for this role
    const { error: deleteError } = await supabase
      .from('role_page_access')
      .delete()
      .eq('role_id', roleId);

    if (deleteError) {
      console.error('Error deleting existing access:', deleteError);
      return res.status(500).json({ error: 'Failed to update role access' });
    }

    // Insert new access permissions
    const { data: newAccess, error: insertError } = await supabase
      .from('role_page_access')
      .insert(updates)
      .select();

    if (insertError) {
      console.error('Error inserting new access:', insertError);
      return res.status(500).json({ error: 'Failed to update role access' });
    }

    // Log the access update
    await supabase.from('role_audit_log').insert([{
      user_id: (req as any).user.id,
      role_id: roleId,
      action: 'permission_changed',
      details: { pageAccessCount: pageAccess.length }
    }]);

    res.json({ access: newAccess });
  } catch (error) {
    console.error('Error in POST /api/roles/:roleId/access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/roles/:roleId - Update role details
router.put('/:roleId', async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description, isActive } = req.body;
    
    // Check if user has permission to update roles (super_admin only)
    const userRole = (req as any).user.role;
    if (userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super administrators can update roles' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: role, error } = await supabase
      .from('system_roles')
      .update(updateData)
      .eq('id', roleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating role:', error);
      return res.status(500).json({ error: 'Failed to update role' });
    }

    // Log the role update
    await supabase.from('role_audit_log').insert([{
      user_id: (req as any).user.id,
      role_id: roleId,
      action: 'role_updated',
      details: updateData
    }]);

    res.json({ role });
  } catch (error) {
    console.error('Error in PUT /api/roles/:roleId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/roles/:roleId - Delete a role (soft delete)
router.delete('/:roleId', async (req, res) => {
  try {
    const { roleId } = req.params;
    
    // Check if user has permission to delete roles (super_admin only)
    const userRole = (req as any).user.role;
    if (userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super administrators can delete roles' });
    }

    // Check if role is assigned to any users
    const { data: assignments } = await supabase
      .from('user_role_assignments')
      .select('id')
      .eq('role_id', roleId)
      .eq('is_active', true)
      .limit(1);

    if (assignments && assignments.length > 0) {
      return res.status(400).json({ error: 'Cannot delete role that is assigned to users' });
    }

    // Soft delete the role
    const { data: role, error } = await supabase
      .from('system_roles')
      .update({ is_active: false })
      .eq('id', roleId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting role:', error);
      return res.status(500).json({ error: 'Failed to delete role' });
    }

    // Log the role deletion
    await supabase.from('role_audit_log').insert([{
      user_id: (req as any).user.id,
      role_id: roleId,
      action: 'role_deleted',
      details: { roleName: role.name }
    }]);

    res.json({ message: 'Role deleted successfully', role });
  } catch (error) {
    console.error('Error in DELETE /api/roles/:roleId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/roles/user/:userId/access - Get user's accessible pages
router.get('/user/:userId/access', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only check their own access unless they're super_admin
    const currentUserId = (req as any).user.id;
    const currentUserRole = (req as any).user.role;
    
    if (currentUserId !== userId && currentUserRole !== 'super_admin') {
      return res.status(403).json({ error: 'Can only check your own access' });
    }

    const { data: accessiblePages, error } = await supabase
      .rpc('get_user_accessible_pages', { p_user_id: userId });

    if (error) {
      console.error('Error fetching user accessible pages:', error);
      return res.status(500).json({ error: 'Failed to fetch accessible pages' });
    }

    res.json({ accessiblePages });
  } catch (error) {
    console.error('Error in GET /api/roles/user/:userId/access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/roles/check-access - Check if user has access to specific page
router.post('/check-access', async (req, res) => {
  try {
    const { userId, pageKey } = req.body;
    
    if (!userId || !pageKey) {
      return res.status(400).json({ error: 'userId and pageKey are required' });
    }
    
    // Users can only check their own access unless they're super_admin
    const currentUserId = (req as any).user.id;
    const currentUserRole = (req as any).user.role;
    
    if (currentUserId !== userId && currentUserRole !== 'super_admin') {
      return res.status(403).json({ error: 'Can only check your own access' });
    }

    const { data: accessCheck, error } = await supabase
      .rpc('check_user_page_access', { 
        p_user_id: userId, 
        p_page_key: pageKey 
      });

    if (error) {
      console.error('Error checking page access:', error);
      return res.status(500).json({ error: 'Failed to check page access' });
    }

    res.json({ accessCheck: accessCheck[0] || { has_access: false } });
  } catch (error) {
    console.error('Error in POST /api/roles/check-access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;