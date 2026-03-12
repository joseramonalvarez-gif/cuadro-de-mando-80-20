import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function AuditSection({ logs }) {
  function exportCSV() {
    const headers = ['Fecha/Hora', 'Usuario', 'Acción', 'Módulo', 'IP'];
    const rows = logs.map(log => [
      new Date(log.created_date).toLocaleString('es-ES'),
      log.user_email,
      log.action,
      log.module || '-',
      log.ip_address || '-'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const actionLabels = {
    login: 'Inicio sesión',
    logout: 'Cierre sesión',
    config_change: 'Cambio config',
    data_export: 'Exportación',
    etl_refresh: 'ETL manual',
    alert_change: 'Cambio alerta'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
          Registro de Auditoría
        </h3>
        <Button onClick={exportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E8EEEE]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha/Hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.slice(0, 50).map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-[#3E4C59]">
                  {new Date(log.created_date).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell className="font-medium text-[#1B2731]">
                  {log.user_email}
                </TableCell>
                <TableCell className="text-[#3E4C59]">
                  {actionLabels[log.action] || log.action}
                </TableCell>
                <TableCell className="text-[#3E4C59]">
                  {log.module || '-'}
                </TableCell>
                <TableCell className="text-sm text-[#B7CAC9]">
                  {log.ip_address || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}