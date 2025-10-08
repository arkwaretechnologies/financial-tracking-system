'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Users as UsersIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const { user } = useAuth();
  const [users, setUsers] = useState<ClientUser[]>([]);
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

  const handleUpdateRole = () => {
    if (!roleToEdit) return;
    setRoles(roles.map(r => r.id === roleToEdit.id ? { ...roleToEdit, permissions: selectedPermissions } : r));
    setRoleToEdit(null);
    setSelectedPermissions([]);
    setIsEditRoleDialogOpen(false);
  };

  const handleEditUser = () => {
    if (!editingUser) return;

    setUsers(users.map(u =>
      u.id === editingUser.id
        ? {
            ...editingUser,
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

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don&apos;t have permission to access user management.
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
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button>Add User</Button>
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
                      
                      // Get the pages this user has access to based on their role
                      const userRoleData = roles.find(r => r.name === roleName);
                      
                      // Handle case where role data is not found
                      if (!userRoleData) {
                        console.error(`Role data not found for role: ${roleName}`);
                      }
                      
                      const accessiblePages = userRoleData?.permissions ? 
                        userRoleData.permissions.map(p => ({
                          page: p,
                          accessLevel: 'admin'
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Add Role</Button>
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