'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileUpload } from '@/components/ui/file-upload';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useEffect } from 'react';

interface Sale {
  id: string;
  sales_date: string;
  amount: number;
  description: string;
  store_name: string;
  payment_method: 'cash' | 'card' | 'transfer';
  supp_doc_url?: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const { user, token } = useAuth();
  const [newSale, setNewSale] = useState({ 
    date: new Date().toISOString().split('T')[0],
    amount: '', 
    description: '', 
    payment_method: 'cash' as 'cash' | 'card' | 'transfer'
  });
  const [saleDocument, setSaleDocument] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      if (token && user?.client_id) {
        try {
          const response = await api.getSalesByClient(token, user.client_id);
          setSales(response.sales);
        } catch (error) {
          console.error('Failed to fetch sales:', error);
          // Optionally, show an error message to the user
        }
      }
    };

    fetchSales();
  }, [token, user?.client_id]);

  // Mock stores data
  const stores = [
    { id: '1', name: 'Main Store' },
    { id: '2', name: 'Downtown Branch' },
    { id: '3', name: 'Westside Store' },
  ];

  const handleCreateSale = async () => {
    if (!newSale.amount || !newSale.description.trim()) return;

    try {
      // Use the first store as default (automatic store association)
      const store = stores[0];
      
      // Convert image to base64 if available
      let documentImageBase64 = '';
      let imageFilename: string | undefined = undefined;
      if (saleDocument) {
        const reader = new FileReader();
        documentImageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
          reader.readAsDataURL(saleDocument);
        });
        imageFilename = saleDocument.name;
      }
      
      const sale: Sale = {
        id: Date.now().toString(),
        sales_date: newSale.date,
        amount: parseFloat(newSale.amount),
        description: newSale.description,
        store_name: store?.name || 'Unknown',
        payment_method: newSale.payment_method,
        supp_doc_url: documentImageBase64 ? `data:${saleDocument?.type};base64,${documentImageBase64}` : undefined
      };
      
      // Optimistic UI update
      setSales([sale, ...sales]);

      // Persist to backend Supabase via API
      if (token && user?.client_id) {
        await api.createSale(token, {
          client_id: user.client_id,
          store_id: user.store_id || undefined,
          description: newSale.description,
          payment_method: newSale.payment_method,
          amount: parseFloat(newSale.amount),
          sales_date: newSale.date,
          image_base64: documentImageBase64 || undefined,
          image_filename: imageFilename,
        });

        // Refetch sales data
        const response = await api.getSalesByClient(token, user.client_id);
        setSales(response.sales);
      } else {
        console.warn('No token or client_id available; sale was added locally only.');
      }
      
      setNewSale({ date: new Date().toISOString().split('T')[0], amount: '', description: '', payment_method: 'cash' });
      setSaleDocument(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating sale:', error);
      alert(`Error creating sale: ${error instanceof Error ? error.message : 'Failed to create sale'}`);
    }
  };

  const handleUpdateSale = async () => {
    if (!editingSale || !token) return;

    try {
      const updatedSale = await api.updateSale(token, editingSale.id, {
        sales_date: editingSale.sales_date,
        description: editingSale.description,
        amount: editingSale.amount,
        payment_method: editingSale.payment_method,
      });

      setSales(sales.map(s => s.id === editingSale.id ? { ...s, ...updatedSale.sale } : s));
      setEditingSale(null);
    } catch (error) {
      console.error('Error updating sale:', error);
      alert(`Error updating sale: ${error instanceof Error ? error.message : 'Failed to update sale'}`);
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!token) return;

    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await api.deleteSale(token, saleId);
        setSales(sales.filter(s => s.id !== saleId));
      } catch (error) {
        console.error('Error deleting sale:', error);
        alert(`Error deleting sale: ${error instanceof Error ? error.message : 'Failed to delete sale'}`);
      }
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
          <p className="mt-2 text-gray-600">Record and track your sales transactions</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Record New Sale</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
              <DialogDescription>
                Add a new sales transaction to your records.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date">
                  Sales Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newSale.date}
                  onChange={(e) => setNewSale({...newSale, date: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newSale.description}
                  onChange={(e) => setNewSale({...newSale, description: e.target.value})}
                  className="col-span-3"
                  placeholder="What was sold?"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newSale.amount}
                  onChange={(e) => setNewSale({...newSale, amount: e.target.value})}
                  className="col-span-3"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment">
                  Payment Method
                </Label>
                <Select value={newSale.payment_method} onValueChange={(value) => setNewSale({...newSale, payment_method: value as 'cash' | 'card' | 'transfer'})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="document">
                  Document Image
                </Label>
                <div className="col-span-3">
                  <FileUpload 
                    onFileChange={setSaleDocument}
                    value={saleDocument}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSale} disabled={!newSale.amount || !newSale.description.trim()}>
                Record Sale
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Sale Dialog */}
      <Dialog open={!!editingSale} onOpenChange={() => setEditingSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
          </DialogHeader>
          {editingSale && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-date">Sales Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={new Date(editingSale.sales_date).toISOString().split('T')[0]}
                  onChange={(e) => setEditingSale({ ...editingSale, sales_date: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingSale.description}
                  onChange={(e) => setEditingSale({ ...editingSale, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={editingSale.amount}
                  onChange={(e) => setEditingSale({ ...editingSale, amount: parseFloat(e.target.value) || 0 })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-payment">Payment Method</Label>
                <Select
                  value={editingSale.payment_method}
                  onValueChange={(value) => setEditingSale({ ...editingSale, payment_method: value as 'cash' | 'card' | 'transfer' })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSale(null)}>Cancel</Button>
            <Button onClick={handleUpdateSale}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Sales Summary</CardTitle>
          <CardDescription>Total sales for the current period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            Php {totalSales.toFixed(2)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {sales.length} transactions recorded
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>A list of all sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.sales_date.replace(/-/g, '/')).toLocaleDateString()}</TableCell>
                  <TableCell>{sale.description}</TableCell>
                  <TableCell>{sale.store_name || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' : sale.payment_method === 'card' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {sale.payment_method.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(sale.amount)}
                  </TableCell>
                  <TableCell>
                    {sale.supp_doc_url && (
                      <a href={sale.supp_doc_url} target="_blank" rel="noopener noreferrer">
                        <img src={sale.supp_doc_url} alt="Sale Document" className="h-10 w-10 object-cover" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => setEditingSale(sale)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteSale(sale.id)}>
                      Delete
                    </Button>
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