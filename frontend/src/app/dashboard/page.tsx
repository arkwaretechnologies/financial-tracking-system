'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, PhilippinePeso, Banknote, ShoppingCart, BanknoteArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const { user, stores, selectedStore, token } = useAuth();
  const router = useRouter();
  const [totalSales, setTotalSales] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user && token && selectedStore) {
        try {
          // Fetch Sales Data
          const salesResponse = await api.getTotalSales(token, user.client_id, selectedStore);
          setTotalSales(salesResponse.totalSales);

          // Fetch Purchases Data
          const purchasesResponse = await api.getTotalPurchases(token, user.client_id, selectedStore);
          setTotalPurchases(purchasesResponse.totalPurchases);

          // Fetch Expenses Data
          const expensesResponse = await api.getTotalExpenses(token, user.client_id, selectedStore);
          setTotalExpenses(expensesResponse.totalExpenses);
        } catch (error) {
          console.error("Failed to fetch data:", error);
          setTotalSales(0);
          setTotalPurchases(0);
          setTotalExpenses(0);
        }
      }
    };

    fetchDashboardData();
  }, [user, token, selectedStore]);

  // Use client name from user data

  const stats = [
    {
      title: 'Total Sales',
      value: `${totalSales.toLocaleString()}`,
      change: '',
      icon: PhilippinePeso,
      color: 'text-green-600',
    },
    {
      title: 'Total Purchases',
      value: `${totalPurchases.toLocaleString()}`,
      change: '',
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'Total Expenses',
      value: `${totalExpenses.toLocaleString()}`,
      change: '',
      icon: BanknoteArrowDown,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.client_name}</p>
        <p className="text-sm text-gray-500">Role: {user?.role === 'admin' ? 'Admin' : 'User'}</p>
        {user?.store_name && <p className="text-sm text-gray-500">Store: {user.store_name}</p>}
        
        {/* Client Information Card */}
        {user && (
          <Card className="mt-4 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Client Name</p>
                <p className="text-sm text-gray-900">{user.client_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Client ID</p>
                <p className="text-sm text-gray-900">{user.client_id}</p>
              </div>
              {user.client_email && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Client Email</p>
                  <p className="text-sm text-gray-900">{user.client_email}</p>
                </div>
              )}
              {user.client_phone && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Client Phone</p>
                  <p className="text-sm text-gray-900">{user.client_phone}</p>
                </div>
              )}
              {user.client_address && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-600">Client Address</p>
                  <p className="text-sm text-gray-900">{user.client_address}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-600">Account Created</p>
                <p className="text-sm text-gray-900">{new Date(user.client_created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stores Information Card */}
        {stores.length > 0 && (
          <Card className="mt-4 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg">Your Stores</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside">
                {stores.map((store) => (
                  <li key={store.id} className="text-sm text-gray-900">{store.name}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
                    {stat.change} from last month
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" variant="default" onClick={() => router.push('/dashboard/sales')}>
              <PhilippinePeso className="mr-2 h-4 w-4" />
              Record New Sale
            </Button>
            <Button className="w-full" variant="outline" onClick={() => router.push('/dashboard/purchases')}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Record Purchase
            </Button>
            <Button className="w-full" variant="outline" onClick={() => router.push('/dashboard/expenses')}>
              <Banknote className="mr-2 h-4 w-4" />
              Record Expense
            </Button>
            <Button className="w-full" variant="outline" onClick={() => router.push('/dashboard/reports')}>
              <Store className="mr-2 h-4 w-4" />
              View Store Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}