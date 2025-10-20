'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import DashboardNav from '@/components/DashboardNav';
import { Toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { currentStore } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardNav />
      <div className="flex-1 flex flex-col">
        <main className={`flex-1 p-4 sm:p-6 lg:p-5 pt-16 lg:pt-8 lg:ml-20`}>
          {currentStore && (
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 max-w-full truncate rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-xs sm:text-sm font-medium flex-shrink-0">Current Store:</span>
                <span className="text-xs sm:text-sm font-semibold truncate">{currentStore.name}</span>
                {currentStore.location && (
                  <span className="text-[10px] sm:text-xs ml-1 opacity-80 truncate">({currentStore.location})</span>
                )}
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}