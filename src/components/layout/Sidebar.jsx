import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard, TrendingUp, ShoppingCart, Wallet,
  FileText, Users, Package, Bell, MessageCircle, Settings, LogOut
} from 'lucide-react';
import { useApp } from '../shared/DemoContext';

const NAV_ITEMS = [
  { label: 'Dirección General', icon: LayoutDashboard, page: 'Home', roles: ['admin', 'advanced', 'user'] },
  { label: 'Ventas / Clientes', icon: TrendingUp, page: 'Sales', roles: ['admin', 'advanced', 'user'] },
  { label: 'Compras / Proveedores', icon: ShoppingCart, page: 'Purchases', roles: ['admin', 'advanced', 'user'] },
  { label: 'Tesorería', icon: Wallet, page: 'Treasury', roles: ['admin', 'advanced', 'user'] },
  { label: 'Fiscalidad', icon: FileText, page: 'Taxes', roles: ['admin', 'advanced', 'user'] },
  { label: 'RRHH', icon: Users, page: 'HumanResources', roles: ['admin', 'advanced', 'user'] },
  { label: 'Producto / ABC', icon: Package, page: 'Products', roles: ['admin', 'advanced', 'user'] },
  { label: 'Alertas', icon: Bell, page: 'Alerts', roles: ['admin', 'advanced', 'user'] },
  { label: 'Chat Inteligente', icon: MessageCircle, page: 'Chat', roles: ['admin', 'advanced', 'user'] },
  { label: 'Configuración', icon: Settings, page: 'Settings', roles: ['admin'] },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { user, activeCompany } = useApp();
  const userRole = user?.role || 'user';

  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(userRole));

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-[#1B2731] text-white z-30 flex flex-col transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[260px]'}`}>
      {/* Logo area */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#33A19A] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm font-['Space_Grotesk']">DG</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold font-['Space_Grotesk'] truncate">DATA GOAL</p>
              <p className="text-[10px] text-[#B7CAC9] truncate">{activeCompany?.name || '—'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = location.pathname.includes(item.page) || 
            (item.page === 'Home' && (location.pathname === '/' || location.pathname === '/Home'));
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-[#33A19A]/20 text-[#33A19A]'
                  : 'text-[#B7CAC9] hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[#33A19A]' : 'text-[#B7CAC9] group-hover:text-white'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#33A19A]/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-[#33A19A]">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.full_name || 'Usuario'}</p>
              <p className="text-[10px] text-[#B7CAC9] capitalize">{userRole === 'advanced' ? 'Avanzado' : userRole === 'admin' ? 'Admin' : 'Usuario'}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => base44.auth.logout()}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#B7CAC9] hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}