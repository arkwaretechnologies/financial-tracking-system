'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'client_user';
  client_id: string;
  client_name: string;
  store_id?: string;
  store_name?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (clientId: string, role: 'admin' | 'client_user', rolePassword: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (clientId: string, role: 'admin' | 'client_user', rolePassword: string) => {
    try {
      // Mock client data based on client ID
      const mockClients = {
        'CLIENT001': { name: 'ABC Corporation', adminPassword: 'admin123', userPassword: 'user123' },
        'CLIENT002': { name: 'XYZ Industries', adminPassword: 'admin456', userPassword: 'user456' },
        'CLIENT003': { name: 'Demo Client', adminPassword: 'demo123', userPassword: 'demo123' }
      };

      const clientData = mockClients[clientId as keyof typeof mockClients];
      
      if (!clientData) {
        throw new Error('Invalid Client ID');
      }

      // Validate role password
      const expectedPassword = role === 'admin' ? clientData.adminPassword : clientData.userPassword;
      if (rolePassword !== expectedPassword) {
        throw new Error('Invalid role password');
      }

      let userData: User;
      
      if (role === 'admin') {
        userData = {
          id: 'admin_' + Date.now(),
          email: `admin@${clientId.toLowerCase()}.com`,
          role: 'admin',
          client_id: clientId,
          client_name: clientData.name,
          created_at: new Date().toISOString()
        };
      } else {
        userData = {
          id: 'user_' + Date.now(),
          email: `user@${clientId.toLowerCase()}.com`,
          role: 'client_user',
          client_id: clientId,
          client_name: clientData.name,
          store_id: 'STORE001', // Default store for regular users
          store_name: 'Main Store',
          created_at: new Date().toISOString()
        };
      }

      const token = 'client_token_' + Date.now();

      setToken(token);
      setUser(userData);
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
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