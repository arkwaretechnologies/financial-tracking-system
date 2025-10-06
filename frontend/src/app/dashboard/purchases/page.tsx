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
import { useStore } from '@/contexts/StoreContext';
import { api, CreatePurchaseRequest } from '@/lib/api';
import { useEffect } from 'react';

interface Purchase {
  ref_num: string;
  purchase_date: string;
  amount: number;
  description: string;
  supplier: string;
  payment_method: 'cash' | 'card' | 'check';
  supp_doc_url?: string;
  category: string;
  other_category?: string;
}

export default function PurchasesPage() {
  const { user, token } = useAuth();
  const { currentStore } = useStore();
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (token && user?.client_id) {
        try {
          const response = await api.getPurchases(token, user.client_id);
          setPurchases(response.purchases);
        } catch (error) {
          console.error("Failed to fetch purchases:", error);
        }
      }
    };

    fetchPurchases();
  }, [token, user?.client_id]);

  const [newPurchase, setNewPurchase] = useState({ 
    ref_num: '',
    date: new Date().toISOString().split('T')[0],
    amount: '', 
    description: '', 
    supplier: '',
    payment_method: 'cash' as 'cash' | 'card' | 'check',
    category: '',
    otherCategory: ''
  });
  const [purchaseDocument, setPurchaseDocument] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null);

  const handleCreatePurchase = async () => {
    if (!newPurchase.amount || !newPurchase.description.trim() || !newPurchase.supplier.trim()) {
      alert('Please fill all required fields');
      return;
    }

    if (!currentStore) {
      alert('No store selected. Please select a store from the dashboard.');
      return;
    }

    let image_base64: string | null = null;
    if (purchaseDocument) {
      const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
      });
      image_base64 = await toBase64(purchaseDocument);
    }

    const purchaseData: CreatePurchaseRequest = {
      ref_num: newPurchase.ref_num,
      client_id: user?.client_id || '',
      store_id: currentStore.id || undefined,
      user_id: user?.id || '',
      description: newPurchase.description,
      supplier: newPurchase.supplier,
      payment_method: newPurchase.payment_method,
      amount: Number(newPurchase.amount),
      purchase_date: newPurchase.date, // YYYY-MM-DD
      image_base64: image_base64 || undefined,
      image_filename: purchaseDocument ? purchaseDocument.name : undefined,
      category: newPurchase.category,
      other_category: newPurchase.category === 'Others' ? newPurchase.otherCategory : undefined,
    };

    if (!token) {
      alert('Authentication error. Please log in again.');
      return;
    }

    try {
      const response = await api.createPurchase(token, purchaseData);

      setPurchases([response.purchase, ...purchases]);
      setIsDialogOpen(false);
      setNewPurchase({ 
        ref_num: '',
        date: new Date().toISOString().split('T')[0],
        amount: '', 
        description: '', 
        supplier: '',
        payment_method: 'cash' as 'cash' | 'card' | 'check',
        category: '',
        otherCategory: ''
      });
      setPurchaseDocument(null);
    } catch (error) {
      console.error('Detailed error creating purchase:', error);
      alert('Failed to create purchase. See console for details.');
    }
  };

  const handleUpdatePurchase = async () => {
    if (!editingPurchase || !token) return;

    try {
      const updatedPurchase = await api.updatePurchase(token, editingPurchase.ref_num, {
        purchase_date: editingPurchase.purchase_date,
        description: editingPurchase.description,
        amount: editingPurchase.amount,
        payment_method: editingPurchase.payment_method,
        supplier: editingPurchase.supplier,
        category: editingPurchase.category,
        other_category: editingPurchase.other_category,
      });

      setPurchases(purchases.map(p => p.ref_num === editingPurchase.ref_num ? { ...p, ...updatedPurchase.purchase } : p));
      setEditingPurchase(null);
    } catch (error) {
      console.error('Error updating purchase:', error);
      alert(`Error updating purchase: ${error instanceof Error ? error.message : 'Failed to update purchase'}`);
    }
  };

  const handleDeletePurchase = async () => {
    if (!deletingPurchase || !token) return;

    try {
      await api.deletePurchase(token, deletingPurchase.ref_num);
      setPurchases(purchases.filter(p => p.ref_num !== deletingPurchase.ref_num));
      setDeletingPurchase(null);
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Failed to delete purchase. See console for details.');
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
                <Label htmlFor="ref_num">
                  Reference Number
                </Label>
                <Input
                  id="ref_num"
                  value={newPurchase.ref_num}
                  onChange={(e) => setNewPurchase({...newPurchase, ref_num: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter reference number"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date">
                  Purchase Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newPurchase.date}
                  onChange={(e) => setNewPurchase({...newPurchase, date: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description">
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
                <Label htmlFor="supplier">
                  Supplier
                </Label>
                <Input
                  id="supplier"
                  value={newPurchase.supplier}
                  onChange={(e) => setNewPurchase({...newPurchase, supplier: e.target.value})}
                  className="col-span-3"
                  placeholder="Who was the supplier?"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category">
                  Category
                </Label>
                <Select value={newPurchase.category} onValueChange={(value) => setNewPurchase({...newPurchase, category: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Supplies">Supplies</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newPurchase.category === 'Others' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="otherCategory">
                    Other Category
                  </Label>
                  <Input
                    id="otherCategory"
                    value={newPurchase.otherCategory}
                    onChange={(e) => setNewPurchase({...newPurchase, otherCategory: e.target.value})}
                    className="col-span-3"
                    placeholder="Please specify"
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount">
                  Amount
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
                <Label htmlFor="payment">
                  Payment Method
                </Label>
                <Select value={newPurchase.payment_method} onValueChange={(value) => setNewPurchase({...newPurchase, payment_method: value as 'cash' | 'card' | 'check'})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="document">
                  Document Image
                </Label>
                <div className="col-span-3">
                  <FileUpload 
                    onFileChange={setPurchaseDocument}
                    value={purchaseDocument}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePurchase} disabled={!newPurchase.amount || !newPurchase.description.trim() || !newPurchase.supplier.trim()}>
                Record Purchase
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Purchase Dialog */}
      <Dialog open={!!editingPurchase} onOpenChange={() => setEditingPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
          </DialogHeader>
          {editingPurchase && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-ref_num">Reference Number</Label>
                <Input
                  id="edit-ref_num"
                  value={editingPurchase.ref_num}
                  disabled
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-date">Purchase Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={new Date(editingPurchase.purchase_date).toISOString().split('T')[0]}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, purchase_date: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingPurchase.description}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-supplier">Supplier</Label>
                <Input
                  id="edit-supplier"
                  value={editingPurchase.supplier}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, supplier: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={editingPurchase.amount}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, amount: parseFloat(e.target.value) || 0 })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-payment">Payment Method</Label>
                <Select
                  value={editingPurchase.payment_method}
                  onValueChange={(value) => setEditingPurchase({ ...editingPurchase, payment_method: value as 'cash' | 'card' | 'check' })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPurchase(null)}>Cancel</Button>
            <Button onClick={handleUpdatePurchase}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPurchase} onOpenChange={() => setDeletingPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Purchase</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this purchase? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPurchase(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePurchase}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Purchases Summary</CardTitle>
          <CardDescription>Total purchases for the current period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">
            {new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalPurchases)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {purchases.length} transactions recorded
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
                <TableHead>Reference No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.ref_num}>
                  <TableCell>{purchase.ref_num}</TableCell>
                  <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                  <TableCell>{purchase.description}</TableCell>
                  <TableCell>{purchase.supplier}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${purchase.payment_method === 'cash' ? 'bg-green-100 text-green-800' : purchase.payment_method === 'card' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {purchase.payment_method.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(purchase.amount)}
                  </TableCell>
                  <TableCell>
                    {purchase.supp_doc_url && (
                      <a href={purchase.supp_doc_url} target="_blank" rel="noopener noreferrer">
                        <img src={purchase.supp_doc_url} alt="Purchase Document" className="h-10 w-10 object-cover" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => setEditingPurchase(purchase)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeletingPurchase(purchase)}>
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