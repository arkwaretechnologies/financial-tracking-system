'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  Settings, 
  Building,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

export default function DashboardNav() {
  const { user, logout, setSelectedStore } = useAuth();
  const { stores, currentStore, setCurrentStore } = useStore();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);


  // Define menu items with role-based access
  const navItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: BarChart3, roles: ['admin', 'client_user'] },
    { title: 'Sales', href: '/dashboard/sales', icon: ShoppingBag, roles: ['admin', 'client_user'] },
    { title: 'Purchases', href: '/dashboard/purchases', icon: ShoppingBag, roles: ['admin', 'client_user'] },
    { title: 'Expenses', href: '/dashboard/expenses', icon: ShoppingBag, roles: ['admin', 'client_user'] },
    { title: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['admin', 'client_user'] },
    { title: 'Users', href: '/dashboard/users', icon: Users, roles: ['admin'] },
  ];

  // Filter menu items based on user role
  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed left-4 top-4 z-50 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 bg-white shadow-md"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg lg:shadow-none lg:static lg:block transition-all duration-300 ease-in-out",
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">FTS</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Store Switcher at the top */}
        <div className="px-4 py-2 border-b">
          <Select
            value={currentStore?.id?.toString() || ""}
            onValueChange={(value) => {
              const store = stores.find(s => s.id.toString() === value);
              if (store) {
                setCurrentStore(store)
                setSelectedStore(store.id)
              };
            }}
          >
            <SelectTrigger className="w-full bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <SelectValue placeholder="Select a store" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id.toString()}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col h-full overflow-y-auto">
          <nav className="flex-1 px-4 py-4 space-y-2">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.client_name || "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email || "user@example.com"}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  Role: {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
          
          {/* Footer in sidebar */}
          <div className="px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Powered by Arkware Technologies ©{new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}