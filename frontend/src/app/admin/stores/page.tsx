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

interface Store {
  id: string;
  name: string;
  client_id: string;
  client_name: string;
  address: string;
  created_at: string;
}

export default function StoresPage() {
  const { superAdmin } = useSuperAdminAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStore, setNewStore] = useState({ name: '', client_id: '', address: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState('all');

  // Mock clients data
  const clients = [
    { id: '00000000-0000-0000-0000-000000000001', name: 'System Admin' },
    { id: '11111111-1111-1111-1111-111111111111', name: 'Sample Client 1' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Sample Client 2' },
  ];

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      // For demo purposes, we'll use mock data
      const mockStores: Store[] = [
        {
          id: '1',
          name: 'Main Store',
          client_id: '11111111-1111-1111-1111-111111111111',
          client_name: 'Sample Client 1',
          address: '123 Main St, City',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          name: 'Downtown Branch',
          client_id: '11111111-1111-1111-1111-111111111111',
          client_name: 'Sample Client 1',
          address: '456 Downtown Ave, City',
          created_at: '2024-02-20T14:45:00Z'
        },
        {
          id: '3',
          name: 'Westside Store',
          client_id: '22222222-2222-2222-2222-222222222222',
          client_name: 'Sample Client 2',
          address: '789 West Rd, City',
          created_at: '2024-03-10T09:15:00Z'
        }
      ];
      setStores(mockStores);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!newStore.name.trim() || !newStore.client_id.trim()) return;

    try {
      const client = clients.find(c => c.id === newStore.client_id);
      const store: Store = {
        id: Date.now().toString(),
        name: newStore.name,
        client_id: newStore.client_id,
        client_name: client?.name || 'Unknown',
        address: newStore.address,
        created_at: new Date().toISOString()
      };
      
      setStores([...stores, store]);
      setNewStore({ name: '', client_id: '', address: '' });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating store:', error);
    }
  };

  const filteredStores = selectedClient === 'all' 
    ? stores 
    : stores.filter(store => store.client_id === selectedClient);

  if (!superAdmin) {
    redirect('/admin/login');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading stores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stores Management</h1>
          <p className="mt-2 text-gray-600">Manage stores and their associated clients</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create New Store</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Store</DialogTitle>
              <DialogDescription>
                Add a new store to the system. Stores belong to clients and track their transactions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Store Name
                </Label>
                <Input
                  id="name"
                  value={newStore.name}
                  onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter store name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">
                  Client
                </Label>
                <Select value={newStore.client_id} onValueChange={(value) => setNewStore({...newStore, client_id: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Input
                  id="address"
                  value={newStore.address}
                  onChange={(e) => setNewStore({...newStore, address: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter store address"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStore} disabled={!newStore.name.trim() || !newStore.client_id.trim()}>
                Create Store
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Stores</CardTitle>
          <CardDescription>Filter stores by client</CardDescription>
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
          <CardTitle>All Stores</CardTitle>
          <CardDescription>A list of all stores in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell>{store.client_name}</TableCell>
                  <TableCell>{store.address}</TableCell>
                  <TableCell>{new Date(store.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Transactions
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
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