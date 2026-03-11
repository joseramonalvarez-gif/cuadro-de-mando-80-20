import React, { useState } from 'react';
import { AppProvider } from './components/shared/DemoContext';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';

const PAGE_TITLES = {
  'Home': 'Dirección General',
  'Sales': 'Ventas / Clientes',
  'Purchases': 'Compras / Proveedores',
  'Treasury': 'Tesorería',
  'Taxes': 'Fiscalidad',
  'HumanResources': 'RRHH',
  'Products': 'Producto / ABC',
  'Alerts': 'Alertas',
  'Chat': 'Chat Inteligente',
  'Settings': 'Configuración',
};

export default function Layout({ children, currentPageName }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AppProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        body { font-family: 'IBM Plex Sans', sans-serif; background: #FFFAF3; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
      `}</style>
      <div className="min-h-screen bg-[#FFFAF3]">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[68px]' : 'ml-[260px]'}`}>
          <TopBar
            title={PAGE_TITLES[currentPageName] || currentPageName}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </AppProvider>
  );
}