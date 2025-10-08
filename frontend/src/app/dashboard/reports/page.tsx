'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

export default function ReportsPage() {
  const { user, token } = useAuth();
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [reportData, setReportData] = useState<{
    grossIncome: number;
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
  } | null>(null);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');

  useEffect(() => {
    const fetchStores = async () => {
      if (token && user?.client_id) {
        try {
          const response = await api.getStoresByClient(token, user.client_id);
          setStores(response.stores);
        } catch (error) {
          console.error('Failed to fetch stores:', error);
        }
      }
    };

    fetchStores();
  }, [token, user?.client_id]);

  const handleGenerateReport = async () => {
    if (token && user?.client_id && fromDate && toDate) {
      try {
        const [grossIncomeRes, totalSalesRes, totalPurchasesRes, totalExpensesRes] = await Promise.all([
          api.getGrossIncome(token, user.client_id, fromDate, toDate, selectedStore),
          api.getTotalSalesByDate(token, user.client_id, fromDate, toDate, selectedStore),
          api.getTotalPurchasesByDate(token, user.client_id, fromDate, toDate, selectedStore),
          api.getTotalExpensesByDate(token, user.client_id, fromDate, toDate, selectedStore)
        ]);

        setReportData({
          grossIncome: grossIncomeRes.grossIncome,
          totalSales: totalSalesRes.totalSales,
          totalPurchases: totalPurchasesRes.totalPurchases,
          totalExpenses: totalExpensesRes.totalExpenses,
        });
      } catch (error) {
        console.error('Failed to generate report:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Gross Income Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end space-x-4">
            <div className="grid gap-2">
              <Label>From Date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>To Date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Store</Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerateReport}>Generate Report</Button>
          </div>
        </CardContent>
      </Card>
      {reportData && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Report Results</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">{formatCurrency(reportData.totalSales)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <p className="text-2xl font-bold">{formatCurrency(reportData.totalPurchases)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">{formatCurrency(reportData.totalExpenses)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gross Income</p>
              <p className="text-2xl font-bold">{formatCurrency(reportData.grossIncome)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}