import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { base44 } from '@/api/base44Client';

export default function NotificationBell({ userEmail, companyId }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (companyId) {
      loadNotifications();
    }
  }, [companyId]);

  async function loadNotifications() {
    try {
      const logs = await base44.entities.AlertLog.filter({ 
        company_id: companyId 
      });

      const unread = logs.filter(log => !log.read_by?.includes(userEmail));
      setUnreadCount(unread.length);
      setNotifications(logs.slice(0, 10)); // Últimas 10
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  async function markAsRead(logId) {
    try {
      const log = notifications.find(n => n.id === logId);
      const readBy = log.read_by || [];
      
      if (!readBy.includes(userEmail)) {
        await base44.entities.AlertLog.update(logId, {
          read_by: [...readBy, userEmail]
        });
        
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Hace ${diffMins}min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-[#E05252] text-white px-1.5 py-0.5 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-[#E8EEEE]">
          <h4 className="font-semibold text-[#1B2731]">Notificaciones</h4>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-[#B7CAC9]">
              No hay notificaciones
            </div>
          ) : (
            notifications.map((notif) => {
              const isRead = notif.read_by?.includes(userEmail);
              return (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-[#E8EEEE] hover:bg-[#F0F5F5] cursor-pointer ${
                    !isRead ? 'bg-[#FFFAF3]' : ''
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      notif.severity === 'red' ? 'bg-[#E05252]' : 'bg-[#E6A817]'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-[#1B2731] text-sm">
                        {notif.kpi_label}
                      </p>
                      <p className="text-sm text-[#3E4C59] mt-1">
                        Valor: <strong>{notif.triggered_value}</strong>
                      </p>
                      <p className="text-xs text-[#B7CAC9] mt-1">
                        {formatDate(notif.created_date)}
                      </p>
                    </div>
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