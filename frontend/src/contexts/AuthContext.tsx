'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'client_user';
  client_id: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_created_at: string;
  store_id?: string;
  store_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  stores: any[];
  selectedStore: string | null;
  setSelectedStore: (storeId: string) => void;
  login: (clientId: string, usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.store_id) {
        setSelectedStore(parsedUser.store_id);
      }
    }
    setLoading(false);
  }, []);

  const login = async (clientId: string, usernameOrEmail: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Prepare login request data with proper typing
      const loginData: any = {
        client_id: clientId,
        password: password
      };
      
      // Determine if usernameOrEmail is an email or username
      const isEmail = usernameOrEmail.includes('@');
      if (isEmail) {
        loginData.email = usernameOrEmail;
      } else {
        loginData.username = usernameOrEmail;
      }
      
      // Call backend API
      const response = await api.login(loginData);

      // Validate response data
      if (!response.user || !response.token) {
        throw new Error('Invalid response from authentication server');
      }

      // Fetch stores for the client
      const storesResponse = await api.getStoresByClient(response.token, response.user.client_id);
      const clientStores = storesResponse.stores;

      // Map backend role to frontend role with fallback
      const userRole = response.user.role === 'admin' ? 'admin' : 'client_user';
      
      const userData: User = {
        id: response.user.id,
        client_id: response.user.client_id,
        username: response.user.username,
        email: response.user.email || undefined,
        role: userRole,
        first_name: response.user.first_name || undefined,
        last_name: response.user.last_name || undefined,
        created_at: response.user.created_at,
        client_name: response.user.client_name,
        client_email: response.user.client_email || undefined,
        client_phone: response.user.client_phone || undefined,
        client_address: response.user.client_address || undefined,
        client_created_at: response.user.client_created_at,
        store_id: response.user.store_id || undefined,
        store_name: response.user.store_name || undefined
      };
      
      setUser(userData);
      setToken(response.token);
      
      // Safely store in localStorage with error handling
      try {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('stores', JSON.stringify(clientStores));
      } catch (storageError) {
        console.warn('Failed to store authentication data in localStorage:', storageError);
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setStores([]);
    setSelectedStore(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('stores');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, stores, selectedStore, setSelectedStore, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}