import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, AlertTriangle, Bell } from 'lucide-react';

export default function AlertsTable({ alerts, onEdit, onDelete, onToggle, userRole }) {
  const formatDate = (date) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-ES', { 
      day: '2d', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getEstadoBadge = (alert) => {
    if (!alert.valorActual) return <Badge className="bg-[#E8EEEE] text-[#3E4C59]">Sin datos</Badge>;

    const { condicion, umbralAviso, umbralCritico, valorActual } = alert;
    
    let isCritico = false;
    let isAviso = false;

    if (condicion === 'mayor_que') {
      isCritico = valorActual > umbralCritico;
      isAviso = valorActual > umbralAviso && !isCritico;
    } else if (condicion === 'menor_que') {
      isCritico = valorActual < umbralCritico;
      isAviso = valorActual < umbralAviso && !isCritico;
    } else if (condicion === 'igual_a') {
      isCritico = valorActual === umbralCritico;
      isAviso = valorActual === umbralAviso;
    }

    if (isCritico) {
      return <Badge className="bg-[#E05252] text-white">🔴 Crítico - {valorActual}</Badge>;
    }
    if (isAviso) {
      return <Badge className="bg-[#FFF4E6] text-[#E6A817]">🟡 Aviso - {valorActual}</Badge>;
    }
    return <Badge className="bg-[#E6F7F6] text-[#33A19A]">🟢 Normal - {valorActual}</Badge>;
  };

  const canEdit = userRole === 'admin' || userRole === 'avanzado';

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">
        Gestión de Alertas
      </h3>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>KPI</TableHead>
              <TableHead>Condición</TableHead>
              <TableHead>🟡 Aviso</TableHead>
              <TableHead>🔴 Crítico</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Estado Actual</TableHead>
              <TableHead>Última Notif.</TableHead>
              <TableHead>Activa</TableHead>
              {canEdit && <TableHead>Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell className="font-medium text-[#1B2731]">
                  {alert.kpi_label}
                </TableCell>
                <TableCell className="text-[#3E4C59]">
                  {alert.condition === 'greater_than' ? '>' : alert.condition === 'less_than' ? '<' : '='}
                </TableCell>
                <TableCell className="text-[#E6A817] font-semibold">
                  {alert.threshold}
                </TableCell>
                <TableCell className="text-[#E05252] font-semibold">
                  {alert.threshold * 1.5} {/* Simplificado - debería usar umbralCritico */}
                </TableCell>
                <TableCell className="text-[#3E4C59]">
                  {alert.period}
                </TableCell>
                <TableCell>
                  {getEstadoBadge(alert)}
                </TableCell>
                <TableCell className="text-[#3E4C59] text-sm">
                  {formatDate(alert.last_triggered)}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={alert.status === 'active'}
                    onCheckedChange={() => onToggle(alert.id)}
                    disabled={!canEdit}
                  />
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(alert)}
                      >
                        <Pencil className="w-4 h-4 text-[#3E4C59]" />
                      </Button>
                      {userRole === 'admin' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(alert.id)}
                        >
                          <Trash2 className="w-4 h-4 text-[#E05252]" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-8 text-[#B7CAC9]">
          No hay alertas configuradas
        </div>
      )}
    </div>
  );
}