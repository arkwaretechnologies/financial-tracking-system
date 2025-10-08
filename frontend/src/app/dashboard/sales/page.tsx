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
import Image from "next/image";

interface Sale {
  ref_num: string;
  sales_date: string;
  amount: number;
  description: string;
  store_name: string;
  payment_method: string;
  supp_doc_url?: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const { user, token } = useAuth();
  const [newSale, setNewSale] = useState({
    ref_num: '',
    date: new Date().toISOString().split('T')[0],
    amount: '', 
    description: '', 
    payment_method: 'cash' as 'cash' | 'card' | 'transfer'
  });
  const [saleDocument, setSaleDocument] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [searchRefNum, setSearchRefNum] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const fetchSales = async () => {
      if (token && user?.client_id) {
        try {
          const response = await api.getSalesByClient(token, user.client_id, 'all', searchRefNum, searchDescription, currentPage, pageSize);
          setSales(response.sales);
          setTotalPages(Math.ceil(response.count / pageSize));
        } catch (error) {
          console.error('Failed to fetch sales:', error);
          // Optionally, show an error message to the user
        }
      }
    };

    fetchSales();
  }, [token, user?.client_id, searchRefNum, searchDescription, currentPage, pageSize]);

  const handleCreateSale = async () => {
    if (!newSale.ref_num.trim() || !newSale.amount || !newSale.description.trim()) return;

    try {
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

      // Persist to backend Supabase via API
      if (token && user?.client_id) {
        const newSaleData = {
          ref_num: newSale.ref_num,
          client_id: user.client_id,
          store_id: user.store_id || undefined,
          description: newSale.description,
          payment_method: newSale.payment_method,
          amount: parseFloat(newSale.amount),
          sales_date: newSale.date,
          image_base64: documentImageBase64 || undefined,
          image_filename: imageFilename,
        };

        const response = await api.createSale(token, newSaleData);

        // Optimistic UI update
        setSales([response.sale, ...sales]);

      } else {
        console.warn('No token or client_id available; sale was not created.');
      }
      
      setNewSale({ ref_num: '', date: new Date().toISOString().split('T')[0], amount: '', description: '', payment_method: 'cash' });
      setSaleDocument(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating sale:', error);
      if (error instanceof Error && error.message.includes("Reference number already exists")) {
        alert("Reference number already exists.");
      } else if (error instanceof Error) {
        alert(error.message || "An unexpected error occurred.");
      }
    }
  };

  const handleUpdateSale = async () => {
    if (!editingSale || !token) return;

    try {
      const updatedSale = await api.updateSale(token, editingSale.ref_num, {
        sales_date: editingSale.sales_date,
        description: editingSale.description,
        amount: editingSale.amount,
        payment_method: editingSale.payment_method,
      });

      setSales(sales.map(s => s.ref_num === editingSale.ref_num ? { ...s, ...updatedSale.sale } : s));
      setEditingSale(null);
    } catch (error) {
      console.error('Error updating sale:', error);
      alert(`Error updating sale: ${error instanceof Error ? error.message : 'Failed to update sale'}`);
    }
  };

  const handleDeleteSale = async (refNum: string) => {
    if (!token) return;

    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await api.deleteSale(token, refNum);
        setSales(sales.filter(s => s.ref_num !== refNum));
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
                <Label htmlFor="ref_num">
                  Reference No.
                </Label>
                <Input
                  id="ref_num"
                  value={newSale.ref_num}
                  onChange={(e) => setNewSale({...newSale, ref_num: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter reference number"
                />
              </div>
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-ref_num" className="text-right">
                Reference Number
              </Label>
              <Input
                id="edit-ref_num"
                value={editingSale?.ref_num || ''}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-sales_date" className="text-right">
                Sales Date
              </Label>
              <Input
                id="edit-date"
                type="date"
                value={editingSale ? new Date(editingSale.sales_date).toISOString().split('T')[0] : ''}
                onChange={(e) => setEditingSale(editingSale ? { ...editingSale, sales_date: e.target.value } : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editingSale?.description || ''}
                onChange={(e) => setEditingSale(editingSale ? { ...editingSale, description: e.target.value } : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editingSale?.amount || ''}
                onChange={(e) => setEditingSale(editingSale ? { ...editingSale, amount: parseFloat(e.target.value) || 0 } : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-payment">Payment Method</Label>
              <Select
                value={editingSale?.payment_method || ''}
                onValueChange={(value) => setEditingSale(editingSale ? { ...editingSale, payment_method: value as 'cash' | 'card' | 'transfer' } : null)}
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
            {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          {/* Search and Filter UI */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by reference number..."
                value={searchRefNum}
                onChange={(e) => setSearchRefNum(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Search by description..."
                value={searchDescription}
                onChange={(e) => setSearchDescription(e.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.ref_num}>
                  <TableCell>{sale.ref_num}</TableCell>
                  <TableCell>{new Date(sale.sales_date).toLocaleDateString()}</TableCell>
                  <TableCell>{sale.description}</TableCell>
                  <TableCell>{sale.store_name || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' : sale.payment_method === 'card' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {sale.payment_method.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {sale.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {sale.supp_doc_url && (
                      <a href={sale.supp_doc_url} target="_blank" rel="noopener noreferrer">
                        <Image src={sale.supp_doc_url} alt="Sale Document" width={40} height={40} className="object-cover" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => setEditingSale(sale)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteSale(sale.ref_num)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}