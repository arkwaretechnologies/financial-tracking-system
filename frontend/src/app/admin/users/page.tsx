'use client';

import { useState, useEffect } from 'react';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: 'admin' | 'user';
  client_id: string;
  client_name: string;
  store_id?: string;
  store_name?: string;
  created_at: string;
}

export default function UsersPage() {
  const { superAdmin } = useSuperAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ 
    username: '', 
    name: '', 
    role: 'user' as 'admin' | 'user',
    client_id: '', 
    store_id: '' 
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState('all');

  // Mock data
  const clients = [
    { id: '00000000-0000-0000-0000-000000000001', name: 'System Admin' },
    { id: '11111111-1111-1111-1111-111111111111', name: 'Sample Client 1' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Sample Client 2' },
  ];

  const stores = [
    { id: '1', name: 'Main Store', client_id: '11111111-1111-1111-1111-111111111111' },
    { id: '2', name: 'Downtown Branch', client_id: '11111111-1111-1111-1111-111111111111' },
    { id: '3', name: 'Westside Store', client_id: '22222222-2222-2222-2222-222222222222' },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // For demo purposes, we'll use mock data
      const mockUsers: User[] = [
        {
          id: '1',
          username: 'admin',
          name: 'System Administrator',
          role: 'admin',
          client_id: '00000000-0000-0000-0000-000000000001',
          client_name: 'System Admin',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          username: 'user1',
          name: 'John Doe',
          role: 'user',
          client_id: '11111111-1111-1111-1111-111111111111',
          client_name: 'Sample Client 1',
          store_id: '1',
          store_name: 'Main Store',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '3',
          username: 'user2',
          name: 'Jane Smith',
          role: 'user',
          client_id: '11111111-1111-1111-1111-111111111111',
          client_name: 'Sample Client 1',
          store_id: '2',
          store_name: 'Downtown Branch',
          created_at: '2024-02-20T14:45:00Z'
        },
        {
          id: '4',
          username: 'user3',
          name: 'Bob Johnson',
          role: 'user',
          client_id: '22222222-2222-2222-2222-222222222222',
          client_name: 'Sample Client 2',
          store_id: '3',
          store_name: 'Westside Store',
          created_at: '2024-03-10T09:15:00Z'
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username.trim() || !newUser.name.trim() || !newUser.client_id.trim()) return;

    try {
      const client = clients.find(c => c.id === newUser.client_id);
      const store = stores.find(s => s.id === newUser.store_id);
      
      const user: User = {
        id: Date.now().toString(),
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        client_id: newUser.client_id,
        client_name: client?.name || 'Unknown',
        store_id: newUser.store_id,
        store_name: store?.name,
        created_at: new Date().toISOString()
      };
      
      setUsers([...users, user]);
      setNewUser({ username: '', name: '', role: 'user', client_id: '', store_id: '' });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const filteredUsers = selectedClient === 'all' 
    ? users 
    : users.filter(user => user.client_id === selectedClient);

  const availableStores = newUser.client_id 
    ? stores.filter(store => store.client_id === newUser.client_id)
    : [];

  if (!superAdmin) {
    redirect('/admin/login');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="mt-2 text-gray-600">Manage users and their access permissions</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create New User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. Users can be assigned to specific clients and stores.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter username or email"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value as 'admin' | 'user'})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">
                  Client
                </Label>
                <Select value={newUser.client_id} onValueChange={(value) => setNewUser({...newUser, client_id: value, store_id: ''})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="00000000-0000-0000-0000-000000000001">System Admin</SelectItem>
                    {clients.slice(1).map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newUser.client_id && newUser.client_id !== '00000000-0000-0000-0000-000000000001' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="store" className="text-right">
                    Store
                  </Label>
                  <Select value={newUser.store_id} onValueChange={(value) => setNewUser({...newUser, store_id: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a store (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific store</SelectItem>
                      {availableStores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={!newUser.username.trim() || !newUser.name.trim() || !newUser.client_id.trim()}>
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Users</CardTitle>
          <CardDescription>Filter users by client</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>{user.client_name}</TableCell>
                  <TableCell>{user.store_name || '-'}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        Reset Password
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}