'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Edit, Plus, Users as UsersIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';

interface ClientUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client_user';
  store_id: string;
  store_name: string;
  created_at: string;
  status: 'active' | 'inactive';
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // page slugs like 'sales', 'purchases', etc.
}

export default function ClientUsersPage() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'client_user' as 'admin' | 'client_user',
    store_id: '',
    password: ''
  });
  const [editingUser, setEditingUser] = useState<ClientUser | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<Omit<Role, 'id'>>({ name: '', description: '', permissions: [] });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([
    { id: '1', name: 'Admin', description: 'Full access to all features', permissions: ['sales', 'purchases', 'user-management', 'stores', 'reports', 'settings'] },
    { id: '2', name: 'Manager', description: 'Manage operations and users', permissions: ['sales', 'purchases', 'user-management', 'stores'] },
    { id: '3', name: 'Viewer', description: 'Can view reports only', permissions: ['reports'] },
  ]);
  // Add role edit dialog state
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);

  // Define the current pages for role assignment
  const availablePages = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'sales', label: 'Sales' },
    { value: 'purchases', label: 'Purchases' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'transactions', label: 'Transactions' },
    { value: 'reports', label: 'Reports' },
    { value: 'users', label: 'Users' },
    { value: 'stores', label: 'Stores' },
    { value: 'clients', label: 'Clients' },
    { value: 'settings', label: 'Settings' },
    { value: 'user-management', label: 'User Management' },
  ];

  // Group pages by module for better UX
  const pageGroups = [
    { label: 'Operations', items: ['sales', 'purchases'] },
    { label: 'Management', items: ['user-management', 'stores'] },
    { label: 'Reporting', items: ['reports'] },
    { label: 'Settings', items: ['settings'] },
  ];

  // Helper to show labels from values
  const pageLabel = (value: string) => availablePages.find(p => p.value === value)?.label ?? value;

  // Role Access Matrix - Comprehensive page access permissions for each role
  const roleAccessMatrix = {
    'Super Admin': {
      roleId: 'super-admin',
      roleType: 'system',
      pages: {
        'dashboard': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'sales': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'purchases': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'inventory': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'reports': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'users': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'settings': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'stores': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'clients': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'transactions': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
      }
    },
    'Client Admin': {
      roleId: 'client-admin',
      roleType: 'client',
      pages: {
        'dashboard': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'sales': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'purchases': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'inventory': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'reports': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'users': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'settings': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'stores': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'clients': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: true, canImport: false },
        'transactions': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
      }
    },
    'Store Manager': {
      roleId: 'store-manager',
      roleType: 'client',
      pages: {
        'dashboard': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: true, canImport: false },
        'sales': { accessLevel: 'write', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canExport: true, canImport: true },
        'purchases': { accessLevel: 'write', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canExport: true, canImport: true },
        'inventory': { accessLevel: 'write', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canExport: true, canImport: true },
        'reports': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: true, canImport: false },
        'users': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'settings': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'stores': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'clients': { accessLevel: 'none', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'transactions': { accessLevel: 'write', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canExport: true, canImport: true },
      }
    },
    'Accountant': {
      roleId: 'accountant',
      roleType: 'client',
      pages: {
        'dashboard': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: true, canImport: false },
        'sales': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: true, canImport: false },
        'purchases': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: true, canImport: false },
        'inventory': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: true, canImport: false },
        'reports': { accessLevel: 'admin', canCreate: true, canRead: true, canUpdate: true, canDelete: true, canExport: true, canImport: true },
        'users': { accessLevel: 'none', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'settings': { accessLevel: 'none', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'stores': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: true, canImport: false },
        'clients': { accessLevel: 'none', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'transactions': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: true, canImport: false },
      }
    },
    'Cashier': {
      roleId: 'cashier',
      roleType: 'client',
      pages: {
        'dashboard': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'sales': { accessLevel: 'write', canCreate: true, canRead: true, canUpdate: true, canDelete: false, canExport: false, canImport: false },
        'purchases': { accessLevel: 'none', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'inventory': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'reports': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'users': { accessLevel: 'none', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'settings': { accessLevel: 'none', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'stores': { accessLevel: 'none', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'clients': { accessLevel: 'none', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'transactions': { accessLevel: 'write', canCreate: true, canRead: true, canUpdate: false, canDelete: false, canExport: false, canImport: false },
      }
    },
    'Viewer': {
      roleId: 'viewer',
      roleType: 'client',
      pages: {
        'dashboard': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'sales': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'purchases': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'inventory': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'reports': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'users': { accessLevel: 'none', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'settings': { accessLevel: 'none', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'stores': { accessLevel: 'none', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'clients': { accessLevel: 'none', canCreate: false, canRead: false, canUpdate: false, canDelete: false, canExport: false, canImport: false },
        'transactions': { accessLevel: 'read', canCreate: false, canRead: true, canUpdate: false, canDelete: false, canExport: false, canImport: false },
      }
    }
  };

  // All available pages in the system
  const allPages = [
    { key: 'dashboard', name: 'Dashboard', group: 'Core' },
    { key: 'sales', name: 'Sales', group: 'Operations' },
    { key: 'purchases', name: 'Purchases', group: 'Operations' },
    { key: 'inventory', name: 'Inventory', group: 'Operations' },
    { key: 'transactions', name: 'Transactions', group: 'Operations' },
    { key: 'reports', name: 'Reports', group: 'Analytics' },
    { key: 'users', name: 'Users', group: 'Management' },
    { key: 'stores', name: 'Stores', group: 'Management' },
    { key: 'clients', name: 'Clients', group: 'Management' },
    { key: 'settings', name: 'Settings', group: 'Configuration' },
  ];

  // Define types for role access
  interface PageAccess {
    accessLevel: 'admin' | 'write' | 'read' | 'none';
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canExport: boolean;
    canImport: boolean;
  }



  // Helper function to determine badge variant and label based on access level
  const getAccessBadge = (accessLevel: string) => {
    switch (accessLevel) {
      case 'admin':
        return { variant: 'default' as const, label: 'Admin' };
      case 'write':
        return { variant: 'secondary' as const, label: 'Write' };
      case 'read':
        return { variant: 'outline' as const, label: 'Read' };
      case 'none':
      default:
        return { variant: 'destructive' as const, label: 'No Access' };
    }
  };

  // Mock stores for the current client
  const clientStores = [
    { id: '1', name: 'Main Store' },
    { id: '2', name: 'Downtown Branch' },
    { id: '3', name: 'Warehouse' },
  ];

  // Fetch real users data from the backend API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users - Token available:', !!token);
        console.log('Fetching users - Token value:', token ? token.substring(0, 10) + '...' : 'null');
        console.log('Fetching users - User available:', !!user);
        console.log('Fetching users - Client ID:', user?.client_id);
        
        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }

        if (!user?.client_id) {
          console.error('No client ID found for logged-in user');
          setLoading(false);
          return;
        }

        const response = await api.getUsersByClient(token, user.client_id);
        
        // Transform backend user data to match our ClientUser interface
        const transformedUsers: ClientUser[] = response.users.map((user: any) => ({
          id: user.id,
          email: user.email,
          name: user.username, // Using username as name since backend doesn't have separate name field
          role: user.role === 'super_admin' ? 'admin' : 'client_user',
          store_id: user.store_id || '1', // Default store if not provided
          store_name: user.store_name || 'Main Store', // Default store name
          created_at: user.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: user.is_active !== false ? 'active' : 'inactive' // Default to active if not specified
        }));

        setUsers(transformedUsers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          tokenAvailable: !!token,
          clientIdAvailable: !!user?.client_id,
          tokenLength: token?.length
        });
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user?.client_id, token]);

  const handleAddUser = async () => {
    try {
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const userData = {
        username: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        client_id: user?.client_id || '',
        store_id: newUser.store_id || undefined
      };

      const response = await api.createUser(token, userData);
      
      // Create new user object for local state
      const newUserObj: ClientUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.username,
        role: response.user.role === 'super_admin' ? 'admin' : 'client_user',
        store_id: response.user.store_id || '1',
        store_name: clientStores.find(s => s.id === (response.user.store_id || '1'))?.name || 'Main Store',
        created_at: response.user.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        status: 'active'
      };

      setUsers([...users, newUserObj]);
      setNewUser({ email: '', name: '', role: 'client_user', store_id: '', password: '' });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Please try again.');
    }
  };

  const handleAddRole = () => {
    setRoles([
      ...roles,
      { ...newRole, id: String(roles.length + 1), permissions: selectedPermissions },
    ]);
    setNewRole({ name: '', description: '', permissions: [] });
    setSelectedPermissions([]);
    setIsAddRoleDialogOpen(false);
  };

  // Update existing role
  const handleUpdateRole = () => {
    if (!roleToEdit) return;
    setRoles(roles.map(r => r.id === roleToEdit.id ? { ...roleToEdit, permissions: selectedPermissions } : r));
    setRoleToEdit(null);
    setSelectedPermissions([]);
    setIsEditRoleDialogOpen(false);
  };

  // Delete role
  const handleDeleteRole = (roleId: string) => {
    setRoles(roles.filter(r => r.id !== roleId));
  };
  const handleEditUser = () => {
    if (!editingUser) return;

    setUsers(users.map(u =>
      u.id === editingUser.id
        ? {
            ...editingUser,
            store_name: clientStores.find(s => s.id === editingUser.store_id)?.name || ''
          }
        : u
    ));
    setEditingUser(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(u =>
      u.id === userId
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Only allow admin users to access this page
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access user management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users for {user?.client_name}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account for your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value: 'admin' | 'client_user') => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="client_user">Client User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="store">Store</Label>
                <Select value={newUser.store_id} onValueChange={(value) => setNewUser({ ...newUser, store_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientStores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser}>Add User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'client_user').length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage user accounts and permissions for your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Admin' : 'Client User'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.store_name || 'All Stores'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === 'active' ? 'default' : 'destructive'}
                          className="cursor-pointer"
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
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
        </TabsContent>
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Role Access</CardTitle>
                <CardDescription>
                  View role assignments and permissions for users.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddRoleDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Permission Page</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      // Map user role to role access matrix key
                      const roleMapping = {
                        'superadmin': 'Super Admin',
                        'super_admin': 'Super Admin',
                        'admin': 'Client Admin', 
                        'client_user': 'Client Admin',
                        'user': 'Store Manager',
                        'manager': 'Store Manager',
                        'accountant': 'Accountant',
                        'cashier': 'Cashier',
                        'viewer': 'Viewer',
                        'store_manager': 'Store Manager'
                      };
                      
                      const roleName = roleMapping[user.role as keyof typeof roleMapping] || 'Viewer';
                      
                      // Debug logging to help identify the issue
                      console.log('User role:', user.role);
                      console.log('Mapped roleName:', roleName);
                      console.log('Available roles in matrix:', Object.keys(roleAccessMatrix));
                      
                      // Get the pages this user has access to based on their role
                      const userRoleData = roleAccessMatrix[roleName as keyof typeof roleAccessMatrix];
                      
                      // Handle case where role data is not found
                      if (!userRoleData) {
                        console.error(`Role data not found for role: ${roleName}`);
                      }
                      
                      const accessiblePages = userRoleData?.pages ? 
                        Object.entries(userRoleData.pages)
                          .filter(([_, access]) => access.accessLevel !== 'none')
                          .map(([pageKey, access]) => ({
                            page: pageLabel(pageKey),
                            accessLevel: access.accessLevel
                          })) : [];
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {roleName}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>
                            {accessiblePages.length > 0 ? (
                              <div className="space-y-1">
                                {accessiblePages.map((perm, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <Badge 
                                      variant={
                                        perm.accessLevel === 'admin' ? 'default' :
                                        perm.accessLevel === 'write' ? 'secondary' :
                                        perm.accessLevel === 'read' ? 'outline' : 'destructive'
                                      }
                                      className="text-xs"
                                    >
                                      {perm.accessLevel.toUpperCase()}
                                    </Badge>
                                    <span className="text-sm">{perm.page}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                No Access
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Create a new role and assign its permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="Enter role name (e.g., Manager, Viewer)"
              />
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
            {/* Permissions */}
            <div className="grid gap-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {pageGroups.map(group => (
                  <div key={group.label} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium mr-2">{group.label}</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => {
                            const newPermissions = [...new Set([...selectedPermissions, ...group.items])];
                            setSelectedPermissions(newPermissions);
                          }}
                        >
                          Select all
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => {
                            const newPermissions = selectedPermissions.filter(p => !group.items.includes(p));
                            setSelectedPermissions(newPermissions);
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((value) => (
                        <div key={value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`add-role-${value}`}
                            checked={selectedPermissions.includes(value)}
                            onCheckedChange={(checked) => {
                              const isChecked = checked === true;
                              if (isChecked) {
                                setSelectedPermissions([...selectedPermissions, value]);
                              } else {
                                setSelectedPermissions(selectedPermissions.filter(v => v !== value));
                              }
                            }}
                          />
                          <label
                            htmlFor={`add-role-${value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {pageLabel(value)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
      <Dialog 
        open={isEditRoleDialogOpen} 
        onOpenChange={(open) => { 
          setIsEditRoleDialogOpen(open); 
          if (!open) { setRoleToEdit(null); setSelectedPermissions([]); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details and adjust its permissions.
            </DialogDescription>
          </DialogHeader>
          {roleToEdit && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role-name">Role Name</Label>
                <Input
                  id="edit-role-name"
                  value={roleToEdit.name}
                  onChange={(e) => setRoleToEdit({ ...roleToEdit, name: e.target.value })}
                  placeholder="Enter role name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role-description">Description</Label>
                <Input
                  id="edit-role-description"
                  value={roleToEdit.description}
                  onChange={(e) => setRoleToEdit({ ...roleToEdit, description: e.target.value })}
                  placeholder="Brief description of the role"
                />
              </div>
              {/* Permissions */}
              <div className="grid gap-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {pageGroups.map(group => (
                    <div key={group.label} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium mr-2">{group.label}</h4>
                        <div className="flex gap-2">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() => {
                              const newPermissions = [...new Set([...selectedPermissions, ...group.items])];
                              setSelectedPermissions(newPermissions);
                            }}
                          >
                            Select all
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() => {
                              const newPermissions = selectedPermissions.filter(p => !group.items.includes(p));
                              setSelectedPermissions(newPermissions);
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {group.items.map((value) => (
                          <div key={value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-role-${value}`}
                              checked={selectedPermissions.includes(value)}
                              onCheckedChange={(checked) => {
                                const isChecked = checked === true;
                                if (isChecked) {
                                  setSelectedPermissions([...selectedPermissions, value]);
                                } else {
                                  setSelectedPermissions(selectedPermissions.filter(v => v !== value));
                                }
                              }}
                            />
                            <label
                              htmlFor={`edit-role-${value}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {pageLabel(value)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditRoleDialogOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: 'admin' | 'client_user') => setEditingUser({ ...editingUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="client_user">Client User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-store">Store</Label>
                <Select
                  value={editingUser.store_id || ''}
                  onValueChange={(value) => setEditingUser({ ...editingUser, store_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientStores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}