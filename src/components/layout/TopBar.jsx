import React, { useState } from 'react';
import { useApp } from '../shared/DemoContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, LogOut, Menu, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import NotificationBell from '../alerts/NotificationBell';

export default function TopBar({ title, onToggleSidebar }) {
  const { user, companies, activeCompany, switchCompany, isAdmin, isAdvanced, refreshCompanies } = useApp();
  const [syncing, setSyncing] = React.useState(false);

  async function handleSync() {
    if (!activeCompany) return;
    setSyncing(true);
    
    try {
      await base44.functions.invoke('holdedApi', {
        companyId: activeCompany.id,
        action: 'sync_all',
      });
      
      // Log audit
      await base44.functions.invoke('auditLog', {
        action: 'etl_refresh',
        module: 'system',
        company_id: activeCompany.id,
        details: { manual: true },
      });
      
      await refreshCompanies();
    } catch (error) {
      console.error('Sync error:', error);
    }
    
    setSyncing(false);
  }

  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-[#E8EEEE] px-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-[#F0F5F5] text-[#3E4C59] lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Company selector */}
        {companies.length > 1 && (
          <Select value={activeCompany?.id} onValueChange={switchCompany}>
            <SelectTrigger className="w-[200px] h-8 text-xs bg-white border-[#B7CAC9]">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-[#33A19A]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {companies.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <span className="text-xs text-[#B7CAC9] hidden md:block">
          {format(new Date(), "d MMM yyyy", { locale: es })}
        </span>

        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="h-8 text-xs border-[#33A19A] text-[#33A19A] hover:bg-[#33A19A] hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
            Actualizar datos
          </Button>
        )}

        {isAdvanced && (
          <Button variant="outline" size="sm" className="h-8 text-xs border-[#B7CAC9] text-[#3E4C59] hover:bg-[#F0F5F5]">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Exportar
          </Button>
        )}

        <NotificationBell />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => base44.auth.logout()}
          className="h-8 text-xs text-[#3E4C59] hover:text-[#E05252]"
        >
          <LogOut className="w-3.5 h-3.5" />
        </Button>
      </div>
    </header>
  );
}