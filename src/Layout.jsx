import React, { useState, useEffect } from 'react';
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
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <AppProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        body { font-family: 'IBM Plex Sans', sans-serif; background: #FFFAF3; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
      `}</style>
      <div className="min-h-screen bg-[#FFFAF3]">
        {/* Mobile overlay */}
        {mobileOpen && !isDesktop && (
          <div className="fixed inset-0 bg-black/40 z-20" onClick={() => setMobileOpen(false)} />
        )}
        
        {/* Sidebar - always visible on desktop, toggle on mobile */}
        <div className={isDesktop ? 'block' : (mobileOpen ? 'block' : 'hidden')}>
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        </div>
        
        {/* Main content */}
        <div
          className="transition-all duration-300"
          style={{ marginLeft: isDesktop ? (sidebarCollapsed ? 68 : 260) : 0 }}
        >
          <TopBar
            title={PAGE_TITLES[currentPageName] || currentPageName}
            onToggleSidebar={() => {
              if (isDesktop) {
                setSidebarCollapsed(!sidebarCollapsed);
              } else {
                setMobileOpen(!mobileOpen);
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