'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

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
  fetchStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  // Load stores and selected store from localStorage on mount
  useEffect(() => {
    const storedStores = localStorage.getItem('stores');
    const storedCurrentStore = localStorage.getItem('currentStore');
    
    if (storedStores) {
      setStores(JSON.parse(storedStores));
    } else {
      // If no stores in localStorage, set mock data directly
      const mockStores: Store[] = [
        { id: '1', name: 'Main Store', location: 'New York', client_id: '1' },
        { id: '2', name: 'Branch Store', location: 'Los Angeles', client_id: '1' },
        { id: '3', name: 'Online Store', location: 'Online', client_id: '1' }
      ];
      
      setStores(mockStores);
      localStorage.setItem('stores', JSON.stringify(mockStores));
      
      // Set first store as current if none selected
      if (!storedCurrentStore && mockStores.length > 0) {
        setCurrentStore(mockStores[0]);
        localStorage.setItem('currentStore', JSON.stringify(mockStores[0]));
      }
    }
    
    if (storedCurrentStore) {
      setCurrentStore(JSON.parse(storedCurrentStore));
    }
    
    setLoading(false);
  }, []);

  // Save current store to localStorage when it changes
  useEffect(() => {
    if (currentStore) {
      localStorage.setItem('currentStore', JSON.stringify(currentStore));
    }
  }, [currentStore]);

  // Fetch stores from API
  const fetchStores = async () => {
    try {
      setLoading(true);
      
      // For demo purposes, we'll use mock data
      // In production, this would fetch from your API
      const mockStores: Store[] = [
        { id: '1', name: 'Main Store', location: 'New York', client_id: '1' },
        { id: '2', name: 'Branch Store', location: 'Los Angeles', client_id: '1' },
        { id: '3', name: 'Online Store', location: 'Online', client_id: '1' }
      ];
      
      setStores(mockStores);
      
      // Set first store as current if none selected
      if (!currentStore && mockStores.length > 0) {
        setCurrentStore(mockStores[0]);
      }
      
      // Save to localStorage
      localStorage.setItem('stores', JSON.stringify(mockStores));
      
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreContext.Provider 
      value={{ 
        stores, 
        currentStore, 
        setCurrentStore, 
        loading,
        fetchStores
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