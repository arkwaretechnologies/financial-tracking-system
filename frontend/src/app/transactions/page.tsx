'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search } from 'lucide-react';

export default function TransactionsPage() {
  const [selectedStore, setSelectedStore] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample transactions data - replace with actual data fetching
  const transactions = [
    {
      id: '1',
      type: 'sale',
      amount: 250.00,
      description: 'Product sale - Store A',
      store: 'Store A',
      date: '2024-01-15',
      category: 'Retail',
    },
    {
      id: '2',
      type: 'purchase',
      amount: 180.50,
      description: 'Inventory purchase',
      store: 'Store B',
      date: '2024-01-14',
      category: 'Inventory',
    },
    {
      id: '3',
      type: 'expense',
      amount: 45.00,
      description: 'Utilities payment',
      store: 'Store A',
      date: '2024-01-13',
      category: 'Utilities',
    },
  ];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'sale':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sale</Badge>;
      case 'purchase':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Purchase</Badge>;
      case 'expense':
        return <Badge variant="default" className="bg-red-100 text-red-800">Expense</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600">Manage and track all financial transactions</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Transaction</span>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter transactions by store, type, or search term</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store">Store</Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger id="store">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  <SelectItem value="store-a">Store A</SelectItem>
                  <SelectItem value="store-b">Store B</SelectItem>
                  <SelectItem value="store-c">Store C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sale">Sales</SelectItem>
                  <SelectItem value="purchase">Purchases</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All recorded transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.store}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell className="text-right font-medium">
                    {transaction.type === 'sale' ? '+' : '-'}Php {transaction.amount.toFixed(2)}
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