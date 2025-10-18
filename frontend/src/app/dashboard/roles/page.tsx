'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Shield, CheckSquare, Square } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Role {
  id: string;
  name: string;
  role_type: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface Page {
  id: string;
  page_key: string;
  page_name: string;
  page_group: string;
  route_path: string;
  icon_name?: string;
  sort_order: number;
}

interface PageAccess {
  pageId: string;
  accessLevel: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
}

export default function RolesPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [groupedPages, setGroupedPages] = useState<Record<string, Page[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleAccess, setRoleAccess] = useState<Record<string, PageAccess>>({});
  
  // Dialogs
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [isManageAccessDialogOpen, setIsManageAccessDialogOpen] = useState(false);
  
  // Form states
  const [newRole, setNewRole] = useState({
    name: '',
    roleType: 'client_role',
    description: ''
  });
  const [editRoleData, setEditRoleData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (token) {
      fetchRoles();
      fetchPages();
    }
  }, [token]);

  const fetchRoles = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await api.getRoles(token);
      setRoles(response.roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch roles',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    if (!token) return;
    
    try {
      const response = await api.getPages(token);
      setPages(response.pages);
      setGroupedPages(response.groupedPages);
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const fetchRoleAccess = async (roleId: string) => {
    if (!token) return;
    
    try {
      const response = await api.getRoleAccess(token, roleId);
      const accessMap: Record<string, PageAccess> = {};
      
      response.access.forEach((item: any) => {
        accessMap[item.pages.page_key] = {
          pageId: item.page_id,
          accessLevel: item.access_level,
          canCreate: item.can_create,
          canRead: item.can_read,
          canUpdate: item.can_update,
          canDelete: item.can_delete,
          canExport: item.can_export,
          canImport: item.can_import
        };
      });
      
      setRoleAccess(accessMap);
    } catch (error) {
      console.error('Error fetching role access:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch role access',
        variant: 'destructive'
      });
    }
  };

  const handleAddRole = async () => {
    if (!token) return;
    if (!newRole.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a role name',
        variant: 'destructive'
      });
      return;
    }

    try {
      await api.createRole(token, {
        name: newRole.name,
        roleType: newRole.roleType,
        description: newRole.description
      });

      toast({
        title: 'Success',
        description: 'Role created successfully'
      });

      setNewRole({ name: '', roleType: 'client_role', description: '' });
      setIsAddRoleDialogOpen(false);
      fetchRoles();
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create role',
        variant: 'destructive'
      });
    }
  };

  const handleEditRole = async () => {
    if (!selectedRole || !token) return;

    try {
      await api.updateRole(token, selectedRole.id, {
        name: editRoleData.name,
        description: editRoleData.description
      });

      toast({
        title: 'Success',
        description: 'Role updated successfully'
      });

      setSelectedRole(null);
      setIsEditRoleDialogOpen(false);
      fetchRoles();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!token) return;
    
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteRole(token, roleId);
      
      toast({
        title: 'Success',
        description: 'Role deleted successfully'
      });

      fetchRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete role',
        variant: 'destructive'
      });
    }
  };

  const handleManageAccess = (role: Role) => {
    setSelectedRole(role);
    fetchRoleAccess(role.id);
    setIsManageAccessDialogOpen(true);
  };

  const handleSaveAccess = async () => {
    if (!selectedRole || !token) return;

    try {
      const pageAccessArray = Object.entries(roleAccess).map(([pageKey, access]) => ({
        pageId: access.pageId,
        accessLevel: access.accessLevel,
        canCreate: access.canCreate,
        canRead: access.canRead,
        canUpdate: access.canUpdate,
        canDelete: access.canDelete,
        canExport: access.canExport,
        canImport: access.canImport
      }));

      await api.updateRoleAccess(token, selectedRole.id, pageAccessArray);

      toast({
        title: 'Success',
        description: 'Role access updated successfully'
      });

      setIsManageAccessDialogOpen(false);
      setSelectedRole(null);
      setRoleAccess({});
    } catch (error: any) {
      console.error('Error updating role access:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role access',
        variant: 'destructive'
      });
    }
  };

  const togglePageAccess = (pageId: string, pageKey: string) => {
    setRoleAccess(prev => {
      const newAccess = { ...prev };
      if (newAccess[pageKey]) {
        delete newAccess[pageKey];
      } else {
        newAccess[pageKey] = {
          pageId,
          accessLevel: 'read',
          canCreate: false,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canExport: false,
          canImport: false
        };
      }
      return newAccess;
    });
  };

  const updateAccessPermission = (pageKey: string, field: keyof PageAccess, value: any) => {
    setRoleAccess(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [field]: value
      }
    }));
  };

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don&apos;t have permission to access role management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">
            Manage roles and their page access permissions
          </p>
        </div>
        <Button onClick={() => setIsAddRoleDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.filter(r => r.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Pages</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pages.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>
            Manage system roles and assign page access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <Badge variant={role.role_type === 'system_role' ? 'default' : 'secondary'}>
                      {role.role_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{role.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={role.is_active ? 'default' : 'destructive'}>
                      {role.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role);
                          setEditRoleData({
                            name: role.name,
                            description: role.description || ''
                          });
                          setIsEditRoleDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageAccess(role)}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Create a new role with specific permissions
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="e.g., Manager, Accountant, Cashier"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role-type">Role Type</Label>
              <Select value={newRole.roleType} onValueChange={(value) => setNewRole({ ...newRole, roleType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system_role">System Role</SelectItem>
                  <SelectItem value="client_role">Client Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role-description">Description</Label>
              <Input
                id="role-description"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Brief description of the role"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole}>Add Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role-name">Role Name</Label>
                <Input
                  id="edit-role-name"
                  value={editRoleData.name}
                  onChange={(e) => setEditRoleData({ ...editRoleData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role-description">Description</Label>
                <Input
                  id="edit-role-description"
                  value={editRoleData.description}
                  onChange={(e) => setEditRoleData({ ...editRoleData, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Access Dialog */}
      <Dialog open={isManageAccessDialogOpen} onOpenChange={setIsManageAccessDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Page Access - {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Select pages and set permissions for this role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {Object.entries(groupedPages).map(([group, groupPages]) => (
              <div key={group} className="space-y-3">
                <h3 className="font-semibold text-lg">{group}</h3>
                <div className="space-y-2">
                  {groupPages.map((page) => (
                    <div key={page.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <Checkbox
                        checked={!!roleAccess[page.page_key]}
                        onCheckedChange={() => togglePageAccess(page.id, page.page_key)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{page.page_name}</div>
                        <div className="text-sm text-muted-foreground">{page.route_path}</div>
                      </div>
                      {roleAccess[page.page_key] && (
                        <div className="flex items-center space-x-2">
                          <Select
                            value={roleAccess[page.page_key].accessLevel}
                            onValueChange={(value) => updateAccessPermission(page.page_key, 'accessLevel', value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="read">Read</SelectItem>
                              <SelectItem value="write">Write</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant={roleAccess[page.page_key].canCreate ? 'default' : 'outline'}
                              onClick={() => updateAccessPermission(page.page_key, 'canCreate', !roleAccess[page.page_key].canCreate)}
                              title="Create"
                            >
                              C
                            </Button>
                            <Button
                              size="sm"
                              variant={roleAccess[page.page_key].canRead ? 'default' : 'outline'}
                              onClick={() => updateAccessPermission(page.page_key, 'canRead', !roleAccess[page.page_key].canRead)}
                              title="Read"
                            >
                              R
                            </Button>
                            <Button
                              size="sm"
                              variant={roleAccess[page.page_key].canUpdate ? 'default' : 'outline'}
                              onClick={() => updateAccessPermission(page.page_key, 'canUpdate', !roleAccess[page.page_key].canUpdate)}
                              title="Update"
                            >
                              U
                            </Button>
                            <Button
                              size="sm"
                              variant={roleAccess[page.page_key].canDelete ? 'default' : 'outline'}
                              onClick={() => updateAccessPermission(page.page_key, 'canDelete', !roleAccess[page.page_key].canDelete)}
                              title="Delete"
                            >
                              D
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsManageAccessDialogOpen(false);
              setSelectedRole(null);
              setRoleAccess({});
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveAccess}>Save Permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

