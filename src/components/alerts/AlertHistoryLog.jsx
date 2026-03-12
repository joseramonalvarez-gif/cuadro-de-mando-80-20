import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AlertHistoryLog({ logs }) {
  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">
        Historial de Alertas Disparadas
      </h3>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha/Hora</TableHead>
              <TableHead>KPI</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Severidad</TableHead>
              <TableHead>Usuarios Notificados</TableHead>
              <TableHead>Leído</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-[#3E4C59] text-sm">
                  {formatDate(log.created_date)}
                </TableCell>
                <TableCell className="font-medium text-[#1B2731]">
                  {log.kpi_label}
                </TableCell>
                <TableCell className="font-semibold text-[#1B2731]">
                  {log.triggered_value}
                </TableCell>
                <TableCell>
                  <Badge className={
                    log.severity === 'red' 
                      ? 'bg-[#E05252] text-white' 
                      : 'bg-[#FFF4E6] text-[#E6A817]'
                  }>
                    {log.severity === 'red' ? '🔴 Crítico' : '🟡 Aviso'}
                  </Badge>
                </TableCell>
                <TableCell className="text-[#3E4C59] text-sm">
                  {log.notified_users?.join(', ') || 'N/A'}
                </TableCell>
                <TableCell>
                  {log.read_by?.length > 0 ? (
                    <Badge className="bg-[#E6F7F6] text-[#33A19A]">Leído</Badge>
                  ) : (
                    <Badge className="bg-[#FFE6E6] text-[#E05252]">No leído</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {logs.length === 0 && (
        <div className="text-center py-8 text-[#B7CAC9]">
          No hay alertas disparadas en el historial
        </div>
      )}
    </div>
  );
}