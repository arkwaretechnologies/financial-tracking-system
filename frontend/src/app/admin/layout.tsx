'use client';

import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { superAdmin, loading } = useSuperAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Don't require authentication for login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!loading && !superAdmin && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [superAdmin, loading, router, isLoginPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Allow login page to render without authentication
  if (!superAdmin && !isLoginPage) {
    return null;
  }

  // For login page, render only the children without the admin layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-16 py-4 sm:py-0">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Super Admin Dashboard</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2 sm:mt-0">
              <span className="text-sm text-gray-500 truncate max-w-[200px] sm:max-w-none">{superAdmin?.email}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('super_admin_token');
                  localStorage.removeItem('super_admin');
                  router.push('/admin/login');
                }}
                className="text-sm text-red-600 hover:text-red-800 whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 sm:gap-8">
            <a
              href="/admin/clients"
              className="border-b-2 border-transparent hover:border-gray-300 py-2 sm:py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap"
            >
              Clients
            </a>
            <a
              href="/admin/stores"
              className="border-b-2 border-transparent hover:border-gray-300 py-2 sm:py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap"
            >
              Stores
            </a>
            <a
              href="/admin/users"
              className="border-b-2 border-transparent hover:border-gray-300 py-2 sm:py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap"
            >
              Users
            </a>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      
      {/* Footer in admin layout */}
      <footer className="bg-white border-t border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-gray-500 text-center">
            Powered by Arkware Technologies ©{new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}