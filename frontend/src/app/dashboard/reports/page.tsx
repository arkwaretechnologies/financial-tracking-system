'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

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

  const handleGenerateReport = async () => {
    if (token && user?.client_id && fromDate && toDate) {
      try {
        const response = await api.getGrossIncome(
          token,
          user.client_id,
          fromDate,
          toDate
        );
        setReportData(response.data);
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
            <Button onClick={handleGenerateReport}>Generate Report</Button>
          </div>
        </CardContent>
      </Card>
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Report Results</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">${reportData.totalSales.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <p className="text-2xl font-bold">${reportData.totalPurchases.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">${reportData.totalExpenses.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gross Income</p>
              <p className="text-2xl font-bold">${reportData.grossIncome.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}