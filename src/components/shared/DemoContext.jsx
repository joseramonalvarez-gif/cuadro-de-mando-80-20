import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DataStoreProvider } from './DataStore';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAndCompanies();
  }, []);

  async function loadUserAndCompanies() {
    setLoading(true);
    const me = await base44.auth.me();
    setUser(me);

    const allCompanies = await base44.entities.Company.list();
    
    let accessible = allCompanies;
    if (me.role !== 'admin') {
      accessible = allCompanies.filter(c => 
        (c.allowed_users || []).includes(me.email) ||
        (me.assigned_companies || []).includes(c.id)
      );
    }
    
    if (accessible.length === 0 && me.role === 'admin' && allCompanies.length === 0) {
      const newCompany = await base44.entities.Company.create({
        name: "NEVADA & AMURAI CONSULTORES",
        is_demo: true,
        allowed_users: [me.email]
      });
      accessible = [newCompany];
    }

    setCompanies(accessible);
    
    const savedId = me.active_company_id;
    const active = accessible.find(c => c.id === savedId) || accessible[0];
    if (active) setActiveCompany(active);
    
    setLoading(false);
  }

  async function switchCompany(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setActiveCompany(company);
      await base44.auth.updateMe({ active_company_id: companyId });
    }
  }

  const isAdmin = user?.role === 'admin';
  const isAdvanced = user?.role === 'advanced' || isAdmin;

  return (
    <AppContext.Provider value={{
      user, companies, activeCompany, loading,
      switchCompany, isAdmin, isAdvanced,
      refreshCompanies: loadUserAndCompanies
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}