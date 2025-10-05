'use client';

import { useState, useEffect } from 'react';
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

export default function ExpensesPage() {
  const { currentStore } = useStore();
  const { user, token } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newExpense, setNewExpense] = useState({ 
    date: new Date().toISOString().split('T')[0],
    amount: '', 
    description: '', 
    paid_to: '',
    payment_method: 'cash' as 'cash' | 'card' | 'check',
  });
  const [expenseDocument, setExpenseDocument] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchExpenses = async () => {
      if (currentStore && token) {
        setIsLoading(true);
        try {
          const response = await api.getExpensesByClient(token, currentStore.client_id);
          console.log('Raw API response:', response);
          if (Array.isArray(response.expenses)) {
            setExpenses(response.expenses);
          } else {
            setExpenses([]);
          }
        } catch (error) {
          console.error("Failed to fetch expenses:", error);
          setExpenses([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchExpenses();
  }, [currentStore, token]);

  const handleCreateExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newExpense.amount || !newExpense.description.trim() || !newExpense.paid_to.trim() || !currentStore || !token || !user) return;

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
        setExpenses([newExpenseRecord.expense, ...expenses]);
      }
      setNewExpense({ 
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

  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

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
                <Select value={newExpense.payment_method} onValueChange={(value) => setNewExpense({...newExpense, payment_method: value as 'cash' | 'card' | 'check'})}>
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
                    value={expenseDocument}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!newExpense.amount || !newExpense.description.trim() || !newExpense.paid_to.trim()}>
                Save Expense
              </Button>
            </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expenses Summary</CardTitle>
          <CardDescription>Total expenses for the current period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">
            Php {totalExpenses.toFixed(2)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {expenses.length} expense transactions recorded
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>A list of all expense transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Paid To</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Document</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{expense.paid_to}</TableCell>
                  <TableCell>{expense.store_name}</TableCell>
                  <TableCell>{expense.payment_method}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(expense.amount)}</TableCell>
                  <TableCell>
                    {expense.supp_doc_url && (
                      <a href={expense.supp_doc_url} target="_blank" rel="noopener noreferrer">
                        <img src={expense.supp_doc_url} alt="Expense Document" className="h-10 w-10 object-cover" />
                      </a>
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