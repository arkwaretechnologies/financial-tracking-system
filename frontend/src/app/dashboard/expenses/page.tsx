'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileUpload } from '@/components/ui/file-upload';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { api, CreateExpenseRequest, Expense } from '@/lib/api';
import { Printer } from 'lucide-react';

export default function ExpensesPage() {
  const { currentStore } = useStore();
  const { user, token } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newExpense, setNewExpense] = useState({ 
    ref_num: '',
    date: new Date().toISOString().split('T')[0],
    amount: '', 
    description: '', 
    paid_to: '',
    payment_method: 'cash' as 'cash' | 'card' | 'check' | 'transfer',
  });
  const [expenseDocument, setExpenseDocument] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchRefNum, setSearchRefNum] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(20);

  const fetchExpenses = useCallback(async () => {
    if (user && token && currentStore && currentStore.id) {
      setIsLoading(true);
      try {
        const response = await api.getExpenses(token, user.client_id, currentStore.id, '', '');
        console.log('Raw API response:', response);
        if (Array.isArray(response)) {
          setExpenses(response);
          setFilteredExpenses(response);
        } else {
          setExpenses([]);
          setFilteredExpenses([]);
        }
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
        setExpenses([]);
        setFilteredExpenses([]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user, token, currentStore]);

  useEffect(() => {
    if (currentStore && currentStore.id) { // Only fetch if a store is selected
      fetchExpenses();
    } else {
      // If no store is selected, don't show loading, just an empty state.
      setIsLoading(false);
      setExpenses([]);
      setFilteredExpenses([]);
    }
  }, [currentStore, fetchExpenses]);

  useEffect(() => {
    let filtered = expenses.filter(expense => expense != null);

    if (searchRefNum) {
      filtered = filtered.filter(expense =>
        expense.ref_num?.toLowerCase().includes(searchRefNum.toLowerCase())
      );
    }

    if (searchDescription) {
      filtered = filtered.filter(expense =>
        expense.description?.toLowerCase().includes(searchDescription.toLowerCase())
      );
    }

    // Date filtering
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(expense => {
        if (!expense.expense_date) return false;
        const expenseDate = new Date(expense.expense_date);
        
        switch (dateFilter) {
          case 'today':
            return expenseDate >= today;
          case 'thisWeek':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return expenseDate >= startOfWeek;
          case 'thisMonth':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return expenseDate >= startOfMonth;
          case 'custom':
            if (dateFrom && dateTo) {
              const fromDate = new Date(dateFrom);
              const toDate = new Date(dateTo);
              toDate.setHours(23, 59, 59, 999); // End of day
              return expenseDate >= fromDate && expenseDate <= toDate;
            }
            return true;
          default:
            return true;
        }
      });
    }

    setFilteredExpenses(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchRefNum, searchDescription, dateFilter, dateFrom, dateTo, expenses]);

  const handleCreateExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newExpense.ref_num.trim() || !newExpense.amount || !newExpense.description.trim() || !newExpense.paid_to.trim() || !currentStore || !token || !user) return;

    try {
      let image_base64: string | null = null;
      if (expenseDocument) {
        const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = error => reject(error);
        });
        image_base64 = await toBase64(expenseDocument);
      }

      const expenseData: CreateExpenseRequest = {
        ref_num: newExpense.ref_num,
        client_id: currentStore.client_id,
        store_id: currentStore.id,
        user_id: user.id,
        description: newExpense.description,
        paid_to: newExpense.paid_to,
        payment_method: newExpense.payment_method,
        amount: parseFloat(newExpense.amount),
        expense_date: newExpense.date,
        image_base64: image_base64 || undefined,
        image_filename: expenseDocument ? expenseDocument.name : undefined,
      };
      
      const newExpenseRecord = await api.createExpense(token, expenseData);
      if (newExpenseRecord) {
        const updatedExpenses = [newExpenseRecord, ...expenses.filter(exp => exp != null)];
        setExpenses(updatedExpenses);
        setFilteredExpenses(updatedExpenses);
      }
      setNewExpense({ 
        ref_num: '',
        date: new Date().toISOString().split('T')[0],
        amount: '', 
        description: '', 
        paid_to: '',
        payment_method: 'cash' as 'cash' | 'card' | 'check',
      });
      setExpenseDocument(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const handleUpdateExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingExpense || !token) return;

    try {
      console.log('Updating expense:', editingExpense);
      const updatedExpense = await api.updateExpense(token, editingExpense.ref_num, editingExpense);
      console.log('Update response:', updatedExpense);
      
      // Re-fetch all expenses to ensure we have the latest data
      await fetchExpenses();
      console.log('Expenses refreshed after update');
      
      setIsEditing(false);
      setEditingExpense(null);
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleDeleteExpense = async (refNum: string) => {
    if (!token) return;

    try {
      await api.deleteExpense(token, refNum);
      const updatedExpenses = expenses.filter(exp => exp != null && exp.ref_num !== refNum);
      setExpenses(updatedExpenses);
      setFilteredExpenses(updatedExpenses);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const totalExpenses = filteredExpenses.filter(expense => expense != null).reduce((sum, expense) => sum + (expense.amount || 0), 0);
  
  // Pagination calculations
  const validExpenses = filteredExpenses.filter(expense => expense != null);
  const totalPages = Math.ceil(validExpenses.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentExpenses = validExpenses.slice(startIndex, endIndex);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Expenses Report - ${currentStore?.name || 'Store'}</title>
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
          
          <div class="report-title">Expenses Report</div>
          <div class="report-info">
            Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>
            Total Records: ${validExpenses.length}<br>
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
                <th>Paid To</th>
                <th>Payment Method</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${validExpenses.map(expense => `
                <tr>
                  <td>${expense.ref_num}</td>
                  <td>${new Date(expense.expense_date).toLocaleDateString()}</td>
                  <td>${expense.description}</td>
                  <td>${expense.paid_to}</td>
                  <td>${expense.payment_method.toUpperCase()}</td>
                  <td class="amount">₱${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div>Total Expenses: ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses Management</h1>
          <p className="mt-2 text-gray-600">Record and track your expense transactions</p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handlePrint}
            disabled={!currentStore || validExpenses.length === 0}
            className="flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Record New Expense</Button>
            </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateExpense}>
              <DialogHeader>
                <DialogTitle>Record New Expense</DialogTitle>
              <DialogDescription>
                Add a new expense transaction to your records.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ref_num">
                  Reference No.
                </Label>
                <Input
                  id="ref_num"
                  value={newExpense.ref_num}
                  onChange={(e) => setNewExpense({...newExpense, ref_num: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter reference number"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date">
                  Expense Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  className="col-span-3"
                  placeholder="What was the expense for?"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paid_to">
                  Paid To
                </Label>
                <Input
                  id="paid_to"
                  value={newExpense.paid_to}
                  onChange={(e) => setNewExpense({...newExpense, paid_to: e.target.value})}
                  className="col-span-3"
                  placeholder="Who was paid?"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment">
                  Payment Method
                </Label>
                <Select value={newExpense.payment_method} onValueChange={(value) => setNewExpense({...newExpense, payment_method: value as 'cash' | 'card' | 'check' | 'transfer'})}>
                  <SelectTrigger className="col-span-3">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  className="col-span-3"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="document">
                  Document Image
                </Label>
                <div className="col-span-3">
                  <FileUpload 
                    onFileChange={setExpenseDocument}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!newExpense.ref_num.trim() || !newExpense.amount || !newExpense.description.trim() || !newExpense.paid_to.trim()}>
                Save Expense
              </Button>
            </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expenses Summary</CardTitle>
          <CardDescription>Total expenses for the current period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            {filteredExpenses.length} transactions recorded
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>A list of all expense transactions</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableHead>Paid To</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {currentExpenses.map((expense) => (
                <TableRow key={expense.ref_num || Math.random()}>
                  <TableCell>{expense.ref_num || 'N/A'}</TableCell>
                  <TableCell>{expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{expense.description || 'N/A'}</TableCell>
                  <TableCell>{expense.paid_to || 'N/A'}</TableCell>
                  <TableCell>{expense.store_name || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      expense.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                      expense.payment_method === 'card' ? 'bg-blue-100 text-blue-800' :
                      expense.payment_method === 'check' ? 'bg-orange-100 text-orange-800' :
                      expense.payment_method === 'transfer' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {expense.payment_method?.toUpperCase() || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(expense.amount ?? 0)}</TableCell>
                  <TableCell>
                    {expense.supp_doc_url && 
                      <a href={expense.supp_doc_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        View
                      </a>
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" onClick={() => { setEditingExpense(expense); setIsEditing(true); }}>Edit</Button>
                    <Button variant="destructive" size="sm" className="ml-2" onClick={() => handleDeleteExpense(expense.ref_num)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, validExpenses.length)} of {validExpenses.length} records
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

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <form onSubmit={handleUpdateExpense}>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-ref_num">Reference No.</Label>
                <Input id="edit-ref_num" value={editingExpense?.ref_num || ''} readOnly className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-date">Expense Date</Label>
                <Input id="edit-date" type="date" value={editingExpense?.expense_date?.split('T')[0] || ''} onChange={(e) => setEditingExpense(editingExpense ? { ...editingExpense, expense_date: e.target.value } : null)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description">Description</Label>
                <Input id="edit-description" value={editingExpense?.description || ''} onChange={(e) => setEditingExpense(editingExpense ? { ...editingExpense, description: e.target.value } : null)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-paid_to">Paid To</Label>
                <Input id="edit-paid_to" value={editingExpense?.paid_to || ''} onChange={(e) => setEditingExpense(editingExpense ? { ...editingExpense, paid_to: e.target.value } : null)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-payment">Payment Method</Label>
                <Select value={editingExpense?.payment_method || 'cash'} onValueChange={(value) => setEditingExpense(editingExpense ? { ...editingExpense, payment_method: value as 'cash' | 'card' | 'check' | 'transfer' } : null)}>
                  <SelectTrigger className="col-span-3">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-amount">Amount</Label>
                <Input id="edit-amount" type="number" step="0.01" value={editingExpense?.amount ?? ''} onChange={(e) => setEditingExpense(editingExpense ? { ...editingExpense, amount: parseFloat(e.target.value) } : null)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}