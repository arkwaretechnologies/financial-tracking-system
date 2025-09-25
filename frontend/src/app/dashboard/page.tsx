'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Store, DollarSign, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Use client name from user data

  const stats = [
    {
      title: 'Total Sales',
      value: 'Php 12,450',
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total Purchases',
      value: 'Php 8,230',
      change: '+5.2%',
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'Total Expenses',
      value: 'Php 2,150',
      change: '-3.1%',
      icon: DollarSign,
      color: 'text-red-600',
    },
    {
      title: 'Active Stores',
      value: user?.role === 'admin' ? 'All' : '1',
      change: '0%',
      icon: Store,
      color: 'text-purple-600',
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Sale - Store A</p>
                  <p className="text-sm text-gray-600">2 hours ago</p>
                </div>
                <span className="text-green-600 font-medium">+Php 250</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Purchase - Inventory</p>
                  <p className="text-sm text-gray-600">5 hours ago</p>
                </div>
                <span className="text-blue-600 font-medium">-Php 180</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Expense - Utilities</p>
                  <p className="text-sm text-gray-600">1 day ago</p>
                </div>
                <span className="text-red-600 font-medium">-Php 45</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" variant="default" onClick={() => router.push('/dashboard/sales')}>
              <DollarSign className="mr-2 h-4 w-4" />
              Record New Sale
            </Button>
            <Button className="w-full" variant="outline" onClick={() => router.push('/dashboard/purchases')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Record Purchase
            </Button>
            <Button className="w-full" variant="outline" onClick={() => router.push('/dashboard/expenses')}>
              <DollarSign className="mr-2 h-4 w-4" />
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