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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AppProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        body { font-family: 'IBM Plex Sans', sans-serif; background: #FFFAF3; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
      `}</style>
      <div className="min-h-screen bg-[#FFFAF3]">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}
        <div className={`lg:block ${mobileOpen ? 'block' : 'hidden lg:block'}`}>
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        </div>
        <div className={`transition-all duration-300 lg:${sidebarCollapsed ? 'ml-[68px]' : 'ml-[260px]'}`} style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (sidebarCollapsed ? 68 : 260) : 0 }}>
          <TopBar
            title={PAGE_TITLES[currentPageName] || currentPageName}
            onToggleSidebar={() => {
              if (window.innerWidth < 1024) {
                setMobileOpen(!mobileOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
          />
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AppProvider>
  );
}