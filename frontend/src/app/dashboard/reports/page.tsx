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
import { Printer } from 'lucide-react';

export default function ReportsPage() {
  const { user, token } = useAuth();
  const [dateFilter, setDateFilter] = useState('today');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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

  useEffect(() => {
    // Clear report data when filters change to prevent showing stale data
    setReportData(null);
    
    // Auto-regenerate report when filters change
    // Only run if we have token, user, and stores are loaded
    if (token && user?.client_id && stores.length > 0) {
      if (dateFilter === 'custom') {
        // Only regenerate if custom dates are set
        if (dateFrom && dateTo) {
          handleGenerateReport();
        }
      } else {
        // For preset filters (today, thisWeek, thisMonth), regenerate immediately
        handleGenerateReport();
      }
    }
  }, [dateFilter, dateFrom, dateTo, selectedStore, token, user, stores]);

  const getDateRange = () => {
    // Get current date in YYYY-MM-DD format using local timezone
    const now = new Date();
    const todayString = now.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
    
    console.log('Current time:', now);
    console.log('Today string (local):', todayString);
    
    switch (dateFilter) {
      case 'today':
        return {
          from: todayString,
          to: todayString
        };
      case 'thisWeek':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return {
          from: startOfWeek.toLocaleDateString('en-CA'),
          to: todayString
        };
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          from: startOfMonth.toLocaleDateString('en-CA'),
          to: todayString
        };
      case 'custom':
        return {
          from: dateFrom,
          to: dateTo
        };
      default:
        return {
          from: todayString,
          to: todayString
        };
    }
  };

  const handleGenerateReport = async () => {
    if (token && user?.client_id) {
      try {
        const dateRange = getDateRange();
        
        if (!dateRange.from || !dateRange.to) {
          alert('Please select a date range');
          return;
        }

        // console.log('Date range being sent to API:', dateRange);
        // console.log('Date filter:', dateFilter);
        // console.log('Current date:', new Date().toISOString().split('T')[0]);

        const [grossIncomeRes, totalSalesRes, totalPurchasesRes, totalExpensesRes] = await Promise.all([
          api.getGrossIncome(token, user.client_id, dateRange.from, dateRange.to, selectedStore),
          api.getTotalSalesByDate(token, user.client_id, dateRange.from, dateRange.to, selectedStore),
          api.getTotalPurchasesByDate(token, user.client_id, dateRange.from, dateRange.to, selectedStore),
          api.getTotalExpensesByDate(token, user.client_id, dateRange.from, dateRange.to, selectedStore)
        ]);

        // console.log('API Responses:');
        // console.log('Gross Income:', grossIncomeRes);
        // console.log('Total Sales:', totalSalesRes);
        // console.log('Total Purchases:', totalPurchasesRes);
        // console.log('Total Expenses:', totalExpensesRes);

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

  const handlePrint = () => {
    if (!reportData) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const selectedStoreName = selectedStore === 'all' ? 'All Stores' : stores.find(store => store.id === selectedStore)?.name || 'Selected Store';

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial Report - ${selectedStoreName}</title>
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
            .report-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin: 30px 0;
            }
            .report-item {
              border: 1px solid #ddd;
              padding: 20px;
              text-align: center;
              background-color: #f9f9f9;
            }
            .report-item-label {
              font-size: 14px;
              color: #666;
              margin-bottom: 10px;
            }
            .report-item-value {
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            .summary-section {
              margin-top: 30px;
              padding: 20px;
              background-color: #f0f8ff;
              border: 1px solid #b3d9ff;
            }
            .summary-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #0066cc;
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
            <div class="store-name">${selectedStoreName}</div>
            <div class="store-address">Financial Report</div>
          </div>
          
          <div class="report-title">Financial Summary Report</div>
          <div class="report-info">
            Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>
            Report Period: ${getDateRange().from} to ${getDateRange().to}<br>
            Date Filter: ${dateFilter === 'today' ? 'Today' :
              dateFilter === 'thisWeek' ? 'This Week' :
              dateFilter === 'thisMonth' ? 'This Month' :
              dateFilter === 'custom' ? `Custom Range (${dateFrom} to ${dateTo})` : 'Today'}<br>
            Store: ${selectedStoreName}
          </div>
          
          <div class="report-grid">
            <div class="report-item">
              <div class="report-item-label">Total Sales</div>
              <div class="report-item-value">${reportData.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="report-item">
              <div class="report-item-label">Total Purchases</div>
              <div class="report-item-value">${reportData.totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="report-item">
              <div class="report-item-label">Total Expenses</div>
              <div class="report-item-value">${reportData.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="report-item">
              <div class="report-item-label">Gross Income</div>
              <div class="report-item-value">${reportData.grossIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          
          <div class="summary-section">
            <div class="summary-title">Financial Summary</div>
            <p><strong>Total Sales:</strong> ${reportData.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><strong>Total Purchases:</strong> ${reportData.totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><strong>Total Expenses:</strong> ${reportData.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><strong>Gross Income:</strong> ${reportData.grossIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
      <h1 className="text-3xl font-bold">Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Gross Income Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end space-x-4">
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
            <div className="grid gap-2">
              <Label>Filter</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerateReport}>Generate Report</Button>
            {reportData && (
              <Button 
                variant="outline" 
                onClick={handlePrint}
                className="flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print Report</span>
              </Button>
            )}
          </div>
          
          {dateFilter === 'custom' && (
            <div className="flex space-x-4">
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
            </div>
          )}
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