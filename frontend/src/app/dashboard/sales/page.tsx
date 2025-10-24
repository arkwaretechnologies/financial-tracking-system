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
import { api } from '@/lib/api';
import { useEffect } from 'react';
import Image from "next/image";
import { Printer } from 'lucide-react';

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
  const { currentStore } = useStore();
  const [newSale, setNewSale] = useState({
    ref_num: '',
    date: new Date().toISOString().split('T')[0],
    amount: '', 
    description: '', 
    payment_method: 'cash' as 'cash' | 'card' | 'transfer' | 'check'
  });
  const [saleDocument, setSaleDocument] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [searchRefNum, setSearchRefNum] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);

  useEffect(() => {
    const fetchSales = async () => {
      if (token && user?.client_id && currentStore?.id) {
        try {
          const response = await api.getSalesByClient(token, user.client_id, currentStore.id, '', '', 1, 1000); // Fetch all sales for client-side filtering
          setSales(response.sales);
        } catch (error) {
          console.error('Failed to fetch sales:', error);
        }
      }
    };

    if (currentStore?.id) {
      fetchSales();
    } else {
      setSales([]);
    }
  }, [token, user?.client_id, currentStore]);

  useEffect(() => {
    let filtered = sales.filter(sale => sale != null);

    if (searchRefNum) {
      filtered = filtered.filter(sale =>
        sale.ref_num?.toLowerCase().includes(searchRefNum.toLowerCase())
      );
    }

    if (searchDescription) {
      filtered = filtered.filter(sale =>
        sale.description?.toLowerCase().includes(searchDescription.toLowerCase())
      );
    }

    // Date filtering
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(sale => {
        if (!sale.sales_date) return false;
        const saleDate = new Date(sale.sales_date);
        
        switch (dateFilter) {
          case 'today':
            return saleDate >= today;
          case 'thisWeek':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return saleDate >= startOfWeek;
          case 'thisMonth':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return saleDate >= startOfMonth;
          case 'custom':
            if (dateFrom && dateTo) {
              const fromDate = new Date(dateFrom);
              const toDate = new Date(dateTo);
              toDate.setHours(23, 59, 59, 999);
              return saleDate >= fromDate && saleDate <= toDate;
            }
            return true;
          default:
            return true;
        }
      });
    }

    setFilteredSales(filtered);
    setCurrentPage(1);
  }, [searchRefNum, searchDescription, dateFilter, dateFrom, dateTo, sales]);

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
      if (token && user?.client_id && currentStore?.id) {
        const newSaleData = {
          ref_num: newSale.ref_num,
          client_id: user.client_id,
          store_id: currentStore.id,
          description: newSale.description,
          payment_method: newSale.payment_method,
          amount: parseFloat(newSale.amount),
          sales_date: newSale.date,
          image_base64: documentImageBase64 || undefined,
          image_filename: imageFilename,
        };

        const response = await api.createSale(token, newSaleData);

        // Optimistic UI update with store name
        const newSaleWithStore = {
          ...response.sale,
          store_name: currentStore.name
        };
        setSales([newSaleWithStore, ...sales]);

      } else {
        console.warn('No token, client_id, or store selected; sale was not created.');
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

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
  
  // Pagination calculations
  const validSales = filteredSales.filter(sale => sale != null);
  const totalPages = Math.ceil(validSales.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentSales = validSales.slice(startIndex, endIndex);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report - ${currentStore?.name || 'Store'}</title>
          <style>
            @media print {
              @page { margin: 0.5in; }
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .store-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .store-address {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .report-title {
              font-size: 18px;
              font-weight: bold;
              margin-top: 20px;
            }
            .report-info {
              margin: 20px 0;
              font-size: 12px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .amount {
              text-align: right;
            }
            .total-section {
              margin-top: 20px;
              text-align: right;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">${currentStore?.name || 'Store Name'}</div>
            <div class="store-address">${currentStore?.location || 'Store Address'}</div>
          </div>
          
          <div class="report-title">Sales Report</div>
          <div class="report-info">
            Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>
            Total Records: ${validSales.length}<br>
            Date Filter: ${dateFilter === 'all' ? 'All Time' : 
              dateFilter === 'today' ? 'Today' :
              dateFilter === 'thisWeek' ? 'This Week' :
              dateFilter === 'thisMonth' ? 'This Month' :
              dateFilter === 'custom' ? `From ${dateFrom} to ${dateTo}` : 'All Time'}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Reference No.</th>
                <th>Date</th>
                <th>Description</th>
                <th>Store</th>
                <th>Payment Method</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${validSales.map(sale => `
                <tr>
                  <td>${sale.ref_num}</td>
                  <td>${new Date(sale.sales_date).toLocaleDateString()}</td>
                  <td>${sale.description}</td>
                  <td>${sale.store_name || 'N/A'}</td>
                  <td>${sale.payment_method.toUpperCase()}</td>
                  <td class="amount">₱${sale.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div>Total Sales: ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          
          <div class="footer">
            This report was generated by FTS (Financial Transaction System)<br>
            Arkware Technologies
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
          <p className="mt-2 text-gray-600">Record and track your sales transactions</p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handlePrint}
            disabled={!currentStore || validSales.length === 0}
            className="flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!currentStore}>Record New Sale</Button>
            </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
              <DialogDescription>
                Add a new sales transaction to your records.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="ref_num">
                  Reference No.
                </Label>
                <Input
                  id="ref_num"
                  value={newSale.ref_num}
                  onChange={(e) => setNewSale({...newSale, ref_num: e.target.value})}
                  className="sm:col-span-3"
                  placeholder="Enter reference number"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="date">
                  Sales Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newSale.date}
                  onChange={(e) => setNewSale({...newSale, date: e.target.value})}
                  className="sm:col-span-3"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="description">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newSale.description}
                  onChange={(e) => setNewSale({...newSale, description: e.target.value})}
                  className="sm:col-span-3"
                  placeholder="What was sold?"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="amount">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newSale.amount}
                  onChange={(e) => setNewSale({...newSale, amount: e.target.value})}
                  className="sm:col-span-3"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="payment">
                  Payment Method
                </Label>
                <Select value={newSale.payment_method} onValueChange={(value) => setNewSale({...newSale, payment_method: value as 'cash' | 'card' | 'transfer' | 'check'})}>
                  <SelectTrigger className="sm:col-span-3">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="document">
                  Document Image
                </Label>
                <div className="sm:col-span-3">
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
      </div>



      {/* Edit Sale Dialog */}
      <Dialog open={!!editingSale} onOpenChange={() => setEditingSale(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
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
                onValueChange={(value) => setEditingSale(editingSale ? { ...editingSale, payment_method: value as 'cash' | 'card' | 'transfer' | 'check' } : null)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
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

      {!currentStore && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-center text-yellow-800">
              Please select a store from the sidebar to view and manage sales.
            </p>
          </CardContent>
        </Card>
      )}

      {currentStore && (
        <>
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
                {filteredSales.length} transactions recorded
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
          <div className="flex space-x-4 mb-4">
            <Input
              placeholder="Search by reference number..."
              value={searchRefNum}
              onChange={(e) => setSearchRefNum(e.target.value)}
            />
            <Input
              placeholder="Search by description..."
              value={searchDescription}
              onChange={(e) => setSearchDescription(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-4 mb-4">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            {dateFilter === 'custom' && (
              <>
                <Input
                  type="date"
                  placeholder="From date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[150px]"
                />
                <Input
                  type="date"
                  placeholder="To date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[150px]"
                />
              </>
            )}
          </div>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSales.map((sale) => (
                <TableRow key={sale.ref_num}>
                  <TableCell>{sale.ref_num}</TableCell>
                  <TableCell>{new Date(sale.sales_date).toLocaleDateString()}</TableCell>
                  <TableCell>{sale.description}</TableCell>
                  <TableCell>{sale.store_name || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' : 
                      sale.payment_method === 'card' ? 'bg-blue-100 text-blue-800' : 
                      sale.payment_method === 'check' ? 'bg-orange-100 text-orange-800' : 
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {sale.payment_method.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {sale.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {sale.supp_doc_url && (
                      <a href={sale.supp_doc_url} target="_blank" rel="noopener noreferrer">
                        <Image src={sale.supp_doc_url} alt="Sale Document" width={40} height={40} className="object-cover rounded" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col sm:flex-row gap-1">
                      <Button variant="outline" size="sm" onClick={() => setEditingSale(sale)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteSale(sale.ref_num)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, validSales.length)} of {validSales.length} records
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}