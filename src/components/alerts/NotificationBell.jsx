import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useApp } from '../shared/DemoContext';
import { formatCurrency } from '../shared/DemoData';

export default function NotificationBell() {
  const { activeCompany, user } = useApp();
  const [logs, setLogs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (activeCompany) {
      loadAlertLogs();
    }
  }, [activeCompany]);

  async function loadAlertLogs() {
    const allLogs = await base44.entities.AlertLog.filter({
      company_id: activeCompany.id,
    }, '-created_date', 20);
    
    setLogs(allLogs);
    const unread = allLogs.filter(log => !(log.read_by || []).includes(user.email)).length;
    setUnreadCount(unread);
  }

  async function markAsRead(logId) {
    const log = logs.find(l => l.id === logId);
    if (!log) return;
    
    const readBy = [...(log.read_by || []), user.email];
    await base44.entities.AlertLog.update(logId, { read_by: readBy });
    loadAlertLogs();
  }

  async function markAllAsRead() {
    for (const log of logs) {
      if (!(log.read_by || []).includes(user.email)) {
        const readBy = [...(log.read_by || []), user.email];
        await base44.entities.AlertLog.update(log.id, { read_by: readBy });
      }
    }
    loadAlertLogs();
  }

  function formatValue(value, kpi) {
    if (kpi.includes('saldo') || kpi.includes('cash') || kpi.includes('coste') || kpi.includes('ventas')) {
      return formatCurrency(value);
    }
    if (kpi.includes('margen') || kpi.includes('peso') || kpi.includes('absentismo') || kpi.includes('tasa')) {
      return `${value.toFixed(1)}%`;
    }
    return value.toFixed(0);
  }

  function getTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-[#3E4C59]" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b border-[#E8EEEE] p-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1B2731]">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-[#33A19A]">
              Marcar todas leídas
            </Button>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-[#B7CAC9] text-sm">
              No hay notificaciones
            </div>
          ) : (
            logs.map((log, i) => {
              const isRead = (log.read_by || []).includes(user.email);
              return (
                <div
                  key={i}
                  className={`p-3 border-b border-[#E8EEEE] hover:bg-[#FDFBF7] cursor-pointer ${!isRead ? 'bg-[#F8F6F1]' : ''}`}
                  onClick={() => !isRead && markAsRead(log.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${log.severity === 'red' ? 'bg-red-500' : 'bg-amber-500'} text-white text-xs`}>
                          {log.severity === 'red' ? 'Crítico' : 'Aviso'}
                        </Badge>
                        <span className="text-xs text-[#B7CAC9]">{getTimeAgo(log.created_date)}</span>
                      </div>
                      <p className="text-sm font-medium text-[#1B2731] mb-1">{log.kpi_label}</p>
                      <p className="text-xs text-[#3E4C59]">
                        Valor: {formatValue(log.triggered_value, log.kpi_name)} • Umbral: {formatValue(log.threshold, log.kpi_name)}
                      </p>
                    </div>
                    {!isRead && (
                      <div className="w-2 h-2 rounded-full bg-[#33A19A] mt-1" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}