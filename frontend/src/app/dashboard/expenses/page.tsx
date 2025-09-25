'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Expense {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: 'utilities' | 'rent' | 'salaries' | 'marketing' | 'supplies' | 'maintenance' | 'other';
  store_name: string;
  paid_to: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      date: '2024-12-20',
      amount: 150.00,
      description: 'Electricity bill',
      category: 'utilities',
      store_name: 'Main Store',
      paid_to: 'City Electric Company'
    },
    {
      id: '2',
      date: '2024-12-15',
      amount: 1200.00,
      description: 'Monthly rent',
      category: 'rent',
      store_name: 'Downtown Branch',
      paid_to: 'Property Management LLC'
    },
    {
      id: '3',
      date: '2024-12-10',
      amount: 75.50,
      description: 'Office supplies',
      category: 'supplies',
      store_name: 'Main Store',
      paid_to: 'Office Depot'
    }
  ]);
  const [newExpense, setNewExpense] = useState({ 
    amount: '', 
    description: '', 
    category: 'utilities' as 'utilities' | 'rent' | 'salaries' | 'marketing' | 'supplies' | 'maintenance' | 'other',
    store_id: '', 
    paid_to: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock stores data
  const stores = [
    { id: '1', name: 'Main Store' },
    { id: '2', name: 'Downtown Branch' },
    { id: '3', name: 'Westside Store' },
  ];

  const handleCreateExpense = async () => {
    if (!newExpense.amount || !newExpense.description.trim() || !newExpense.paid_to.trim() || !newExpense.store_id.trim()) return;

    try {
      const store = stores.find(s => s.id === newExpense.store_id);
      const expense: Expense = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        category: newExpense.category,
        store_name: store?.name || 'Unknown',
        paid_to: newExpense.paid_to
      };
      
      setExpenses([expense, ...expenses]);
      setNewExpense({ amount: '', description: '', category: 'utilities', store_id: '', paid_to: '' });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses Management</h1>
          <p className="mt-2 text-gray-600">Record and track your business expenses</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Record New Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Expense</DialogTitle>
              <DialogDescription>
                Add a new expense transaction to your records.
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
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
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
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  className="col-span-3"
                  placeholder="What was the expense for?"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paid_to" className="text-right">
                  Paid To
                </Label>
                <Input
                  id="paid_to"
                  value={newExpense.paid_to}
                  onChange={(e) => setNewExpense({...newExpense, paid_to: e.target.value})}
                  className="col-span-3"
                  placeholder="Who received the payment?"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="store" className="text-right">
                  Store
                </Label>
                <Select value={newExpense.store_id} onValueChange={(value) => setNewExpense({...newExpense, store_id: value})}>
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
                <Select value={newExpense.category} onValueChange={(value) => setNewExpense({...newExpense, category: value as 'utilities' | 'rent' | 'salaries' | 'marketing' | 'supplies' | 'maintenance' | 'other'})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="salaries">Salaries</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateExpense} disabled={!newExpense.amount || !newExpense.description.trim() || !newExpense.paid_to.trim() || !newExpense.store_id.trim()}>
                Record Expense
              </Button>
            </DialogFooter>
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
                <TableHead>Category</TableHead>
                <TableHead>Paid To</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      expense.category === 'utilities' 
                        ? 'bg-blue-100 text-blue-800' 
                        : expense.category === 'rent'
                        ? 'bg-purple-100 text-purple-800'
                        : expense.category === 'salaries'
                        ? 'bg-red-100 text-red-800'
                        : expense.category === 'marketing'
                        ? 'bg-green-100 text-green-800'
                        : expense.category === 'supplies'
                        ? 'bg-yellow-100 text-yellow-800'
                        : expense.category === 'maintenance'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {expense.category.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>{expense.paid_to}</TableCell>
                  <TableCell>{expense.store_name}</TableCell>
                  <TableCell className="font-medium text-red-600">
                    Php {expense.amount.toFixed(2)}
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