'use client';

import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building, Users, Store } from 'lucide-react';
import Link from 'next/link';

export default function AdminClientsPage() {
  const { superAdmin } = useSuperAdminAuth();

  if (!superAdmin) {
    redirect('/admin/login');
  }

  const stats = [
    {
      title: 'Total Clients',
      value: '12',
      icon: Building,
      color: 'text-blue-600',
    },
    {
      title: 'Active Users',
      value: '156',
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Total Stores',
      value: '48',
      icon: Store,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-600">Manage your clients and their configurations</p>
          </div>
          <Link href="/admin/clients/new">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Client</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Clients</CardTitle>
          <CardDescription>List of all clients in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample client data - replace with actual data fetching */}
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">ABC Corporation</h3>
                <p className="text-sm text-gray-600">Client ID: ABC-001</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">5 stores</p>
                <p className="text-sm text-gray-600">25 users</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">XYZ Industries</h3>
                <p className="text-sm text-gray-600">Client ID: XYZ-002</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">3 stores</p>
                <p className="text-sm text-gray-600">18 users</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}