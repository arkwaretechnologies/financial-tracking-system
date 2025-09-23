'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface SuperAdmin {
  id: string;
  username: string;
  email?: string;
  role: 'super_admin';
  created_at: string;
}

interface SuperAdminAuthContextType {
  superAdmin: SuperAdmin | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextType | undefined>(undefined);

export function SuperAdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing super admin token on mount
    const storedToken = localStorage.getItem('super_admin_token');
    const storedSuperAdmin = localStorage.getItem('super_admin');
    
    if (storedToken && storedSuperAdmin) {
      setToken(storedToken);
      setSuperAdmin(JSON.parse(storedSuperAdmin));
    }
    
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // For demo purposes, accept specific super admin credentials
      // In production, this would validate against backend
      if (username === 'superadmin' && password === 'admin123') {
        const superAdminData: SuperAdmin = {
          id: 'super_admin_' + Date.now(),
          username: username,
          role: 'super_admin',
          created_at: new Date().toISOString()
        };
        const token = 'super_admin_token_' + Date.now();

        setToken(token);
        setSuperAdmin(superAdminData);
        
        // Store in localStorage
        localStorage.setItem('super_admin_token', token);
        localStorage.setItem('super_admin', JSON.stringify(superAdminData));
        
        // Redirect to super admin dashboard
        router.push('/admin');
      } else {
        throw new Error('Invalid super admin credentials');
      }
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setToken(null);
    setSuperAdmin(null);
    localStorage.removeItem('super_admin_token');
    localStorage.removeItem('super_admin');
    router.push('/admin/login');
  };

  return (
    <SuperAdminAuthContext.Provider value={{ superAdmin, token, login, logout, loading }}>
      {children}
    </SuperAdminAuthContext.Provider>
  );
}

export function useSuperAdminAuth() {
  const context = useContext(SuperAdminAuthContext);
  if (context === undefined) {
    throw new Error('useSuperAdminAuth must be used within a SuperAdminAuthProvider');
  }
  return context;
}