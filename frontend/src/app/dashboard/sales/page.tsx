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

interface Sale {
  id: string;
  date: string;
  amount: number;
  description: string;
  store_name: string;
  payment_method: 'cash' | 'card' | 'transfer';
  document_image?: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([
    {
      id: '1',
      date: '2024-12-20',
      amount: 250.00,
      description: 'Product sales - Electronics',
      store_name: 'Main Store',
      payment_method: 'cash'
    },
    {
      id: '2',
      date: '2024-12-19',
      amount: 180.50,
      description: 'Product sales - Clothing',
      store_name: 'Downtown Branch',
      payment_method: 'card'
    },
    {
      id: '3',
      date: '2024-12-18',
      amount: 320.75,
      description: 'Product sales - Home goods',
      store_name: 'Main Store',
      payment_method: 'transfer'
    }
  ]);
  const [newSale, setNewSale] = useState({ 
    date: new Date().toISOString().split('T')[0],
    amount: '', 
    description: '', 
    payment_method: 'cash' as 'cash' | 'card' | 'transfer'
  });
  const [saleDocument, setSaleDocument] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, token } = useAuth();

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
        date: newSale.date,
        amount: parseFloat(newSale.amount),
        description: newSale.description,
        store_name: store?.name || 'Unknown',
        payment_method: newSale.payment_method,
        document_image: documentImageBase64 ? `data:${saleDocument?.type};base64,${documentImageBase64}` : undefined
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
                <TableHead>Amount</TableHead>
                <TableHead>Document</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                  <TableCell>{sale.description}</TableCell>
                  <TableCell>{sale.store_name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      sale.payment_method === 'cash' 
                        ? 'bg-green-100 text-green-800' 
                        : sale.payment_method === 'card'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {sale.payment_method.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    Php {sale.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {sale.document_image && (
                      <img 
                        src={sale.document_image} 
                        alt="Sales document" 
                        className="h-10 w-10 object-cover rounded cursor-pointer"
                        onClick={() => window.open(sale.document_image, '_blank')}
                      />
                    )}
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