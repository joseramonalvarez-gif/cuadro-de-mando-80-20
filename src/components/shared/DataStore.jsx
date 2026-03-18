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
        
        // Merge all chunks for this data type
        let allItems = [];
        for (const chunk of cached) {
          if (chunk.data?.items) {
            allItems = [...allItems, ...chunk.data.items];
            if (!lastSync || new Date(chunk.last_fetched) > new Date(lastSync)) {
              setLastSync(chunk.last_fetched);
            }
          }
        }
        
        if (allItems.length > 0) {
          loaded[type] = allItems;
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