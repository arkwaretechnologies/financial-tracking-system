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
  login: (clientId: string, username: string, password: string) => Promise<void>;
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

  const login = async (clientId: string, username: string, password: string) => {
    try {
      // Mock client data based on client ID
      const mockClients = {
        '12345': { name: 'Test Corporation' },
        'CLIENT001': { name: 'ABC Corporation' },
        'CLIENT002': { name: 'XYZ Industries' },
        'CLIENT003': { name: 'Demo Client' }
      };

      const clientData = mockClients[clientId as keyof typeof mockClients];
      
      if (!clientData) {
        throw new Error('Invalid Client ID');
      }

      // Mock user database with client associations
      const mockUsers = {
        // Client 12345 users
        'admin@testcorp.com': { 
          id: 'user_001', 
          password: 'admin123', 
          role: 'admin' as const, 
          client_id: '12345',
          client_name: 'Test Corporation',
          name: 'Admin User',
          store_id: undefined,
          store_name: undefined
        },
        'john@testcorp.com': { 
          id: 'user_002', 
          password: 'user123', 
          role: 'client_user' as const, 
          client_id: '12345',
          client_name: 'Test Corporation',
          name: 'John Doe',
          store_id: 'STORE001',
          store_name: 'Main Store'
        },
        'jane@testcorp.com': { 
          id: 'user_003', 
          password: 'user123', 
          role: 'client_user' as const, 
          client_id: '12345',
          client_name: 'Test Corporation',
          name: 'Jane Smith',
          store_id: 'STORE002',
          store_name: 'Branch Store'
        },
        
        // CLIENT001 users
        'admin@abc.com': { 
          id: 'user_004', 
          password: 'admin123', 
          role: 'admin' as const, 
          client_id: 'CLIENT001',
          client_name: 'ABC Corporation',
          name: 'ABC Admin',
          store_id: undefined,
          store_name: undefined
        },
        'mike@abc.com': { 
          id: 'user_005', 
          password: 'user123', 
          role: 'client_user' as const, 
          client_id: 'CLIENT001',
          client_name: 'ABC Corporation',
          name: 'Mike Johnson',
          store_id: 'STORE003',
          store_name: 'ABC Main Store'
        },
        
        // CLIENT002 users
        'admin@xyz.com': { 
          id: 'user_006', 
          password: 'admin456', 
          role: 'admin' as const, 
          client_id: 'CLIENT002',
          client_name: 'XYZ Industries',
          name: 'XYZ Admin',
          store_id: undefined,
          store_name: undefined
        },
        'sarah@xyz.com': { 
          id: 'user_007', 
          password: 'user456', 
          role: 'client_user' as const, 
          client_id: 'CLIENT002',
          client_name: 'XYZ Industries',
          name: 'Sarah Wilson',
          store_id: 'STORE004',
          store_name: 'XYZ Warehouse'
        },
        
        // CLIENT003 users
        'demo@demo.com': { 
          id: 'user_008', 
          password: 'demo123', 
          role: 'admin' as const, 
          client_id: 'CLIENT003',
          client_name: 'Demo Client',
          name: 'Demo Admin',
          store_id: undefined,
          store_name: undefined
        },
        'user@demo.com': { 
          id: 'user_009', 
          password: 'demo123', 
          role: 'client_user' as const, 
          client_id: 'CLIENT003',
          client_name: 'Demo Client',
          name: 'Demo User',
          store_id: 'STORE005',
          store_name: 'Demo Store'
        }
      };

      // Find user by username and validate client association
      const userData = mockUsers[username as keyof typeof mockUsers];
      
      if (!userData) {
        throw new Error('Invalid username or password');
      }

      // Validate user belongs to the specified client
      if (userData.client_id !== clientId) {
        throw new Error('User does not belong to this client');
      }

      // Validate password
      if (userData.password !== password) {
        throw new Error('Invalid username or password');
      }

      const user: User = {
        id: userData.id,
        email: username,
        role: userData.role,
        client_id: userData.client_id,
        client_name: userData.client_name,
        store_id: userData.store_id,
        store_name: userData.store_name,
        created_at: new Date().toISOString()
      };

      const token = 'client_token_' + Date.now();

      setToken(token);
      setUser(user);
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
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