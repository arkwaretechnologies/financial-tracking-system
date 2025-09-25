'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Purchase {
  id: string;
  date: string;
  amount: number;
  description: string;
  supplier: string;
  store_name: string;
  category: 'inventory' | 'equipment' | 'services' | 'other';
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([
    {
      id: '1',
      date: '2024-12-20',
      amount: 850.00,
      description: 'Electronics inventory restock',
      supplier: 'Tech Supplies Co.',
      store_name: 'Main Store',
      category: 'inventory'
    },
    {
      id: '2',
      date: '2024-12-18',
      amount: 320.50,
      description: 'Office furniture',
      supplier: 'Office World',
      store_name: 'Downtown Branch',
      category: 'equipment'
    },
    {
      id: '3',
      date: '2024-12-15',
      amount: 150.00,
      description: 'Cleaning services',
      supplier: 'Clean Pro Services',
      store_name: 'Main Store',
      category: 'services'
    }
  ]);
  const [newPurchase, setNewPurchase] = useState({ 
    amount: '', 
    description: '', 
    supplier: '',
    store_id: '', 
    category: 'inventory' as 'inventory' | 'equipment' | 'services' | 'other'
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock stores data
  const stores = [
    { id: '1', name: 'Main Store' },
    { id: '2', name: 'Downtown Branch' },
    { id: '3', name: 'Westside Store' },
  ];

  const handleCreatePurchase = async () => {
    if (!newPurchase.amount || !newPurchase.description.trim() || !newPurchase.supplier.trim() || !newPurchase.store_id.trim()) return;

    try {
      const store = stores.find(s => s.id === newPurchase.store_id);
      const purchase: Purchase = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(newPurchase.amount),
        description: newPurchase.description,
        supplier: newPurchase.supplier,
        store_name: store?.name || 'Unknown',
        category: newPurchase.category
      };
      
      setPurchases([purchase, ...purchases]);
      setNewPurchase({ amount: '', description: '', supplier: '', store_id: '', category: 'inventory' });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating purchase:', error);
    }
  };

  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchases Management</h1>
          <p className="mt-2 text-gray-600">Record and track your purchase transactions</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Record New Purchase</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Purchase</DialogTitle>
              <DialogDescription>
                Add a new purchase transaction to your records.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount ($)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newPurchase.amount}
                  onChange={(e) => setNewPurchase({...newPurchase, amount: e.target.value})}
                  className="col-span-3"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newPurchase.description}
                  onChange={(e) => setNewPurchase({...newPurchase, description: e.target.value})}
                  className="col-span-3"
                  placeholder="What was purchased?"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier" className="text-right">
                  Supplier
                </Label>
                <Input
                  id="supplier"
                  value={newPurchase.supplier}
                  onChange={(e) => setNewPurchase({...newPurchase, supplier: e.target.value})}
                  className="col-span-3"
                  placeholder="Supplier name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="store" className="text-right">
                  Store
                </Label>
                <Select value={newPurchase.store_id} onValueChange={(value) => setNewPurchase({...newPurchase, store_id: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select value={newPurchase.category} onValueChange={(value) => setNewPurchase({...newPurchase, category: value as 'inventory' | 'equipment' | 'services' | 'other'})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePurchase} disabled={!newPurchase.amount || !newPurchase.description.trim() || !newPurchase.supplier.trim() || !newPurchase.store_id.trim()}>
                Record Purchase
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchases Summary</CardTitle>
          <CardDescription>Total purchases for the current period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            Php {totalPurchases.toFixed(2)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {purchases.length} purchase transactions recorded
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
          <CardDescription>A list of all purchase transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                  <TableCell>{purchase.description}</TableCell>
                  <TableCell>{purchase.supplier}</TableCell>
                  <TableCell>{purchase.store_name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      purchase.category === 'inventory' 
                        ? 'bg-blue-100 text-blue-800' 
                        : purchase.category === 'equipment'
                        ? 'bg-purple-100 text-purple-800'
                        : purchase.category === 'services'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {purchase.category.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-blue-600">
                    Php {purchase.amount.toFixed(2)}
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