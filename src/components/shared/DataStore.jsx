import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const DataStoreContext = createContext(null);

export function DataStoreProvider({ children, companyId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  async function loadData() {
    setLoading(true);
    try {
      const dataTypes = [
        'invoices_sale', 
        'invoices_purchase', 
        'creditnotes',
        'contacts', 
        'treasuries', 
        'products', 
        'taxes',
        'payments',
        'employees',
        'times'
      ];
      
      const loaded = {};
      
      for (const type of dataTypes) {
        const cached = await base44.entities.CachedData.filter({
          company_id: companyId,
          data_type: type,
        });
        if (cached.length > 0 && cached[0].data?.items) {
          loaded[type] = cached[0].data.items;
          if (!lastSync || new Date(cached[0].last_fetched) > new Date(lastSync)) {
            setLastSync(cached[0].last_fetched);
          }
        }
      }
      
      setData(loaded);
    } catch (error) {
      console.error('Error loading data store:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    await loadData();
  }

  return (
    <DataStoreContext.Provider value={{ data, loading, lastSync, refresh }}>
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const context = useContext(DataStoreContext);
  if (!context) {
    throw new Error('useDataStore must be used within DataStoreProvider');
  }
  return context;
}