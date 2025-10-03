'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';

interface Store {
  id: string;
  name: string;
  location?: string;
  client_id: string;
}

interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStore: (store: Store) => void;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      if (user && token) {
        try {
          setLoading(true);
          const response = await api.getStoresByClient(token, user.client_id);
          setStores(response.stores);

          const storedCurrentStore = localStorage.getItem('currentStore');
          if (storedCurrentStore) {
            setCurrentStore(JSON.parse(storedCurrentStore));
          } else if (response.stores.length > 0) {
            setCurrentStore(response.stores[0]);
          }
        } catch (error) {
          console.error('Failed to fetch stores:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStores();
  }, [user, token]);

  useEffect(() => {
    if (currentStore) {
      localStorage.setItem('currentStore', JSON.stringify(currentStore));
    }
  }, [currentStore]);

  return (
    <StoreContext.Provider 
      value={{ 
        stores, 
        currentStore, 
        setCurrentStore, 
        loading
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}