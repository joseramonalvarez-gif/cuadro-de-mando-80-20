import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AuditSection() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: 'all',
    user_email: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    const query = {};
    if (filters.action !== 'all') query.action = filters.action;
    if (filters.user_email) query.user_email = filters.user_email;
    
    const data = await base44.entities.AuditLog.list('-created_date', 100);
    setLogs(data);
    setLoading(false);
  }

  async function exportLogs() {
    const csv = [
      ['Fecha', 'Usuario', 'Acción', 'Módulo', 'IP', 'Detalles'].join(','),
      ...logs.map(log => [
        format(new Date(log.created_date), 'dd/MM/yyyy HH:mm', { locale: es }),
        log.user_email,
        log.action,
        log.module || '',
        log.ip_address || '',
        JSON.stringify(log.details || {})
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    a.click();
  }

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8EEEE] p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1B2731]">Log de Auditoría</h3>
          <p className="text-xs text-[#3E4C59] mt-1">Últimas 100 acciones registradas</p>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <Select value={filters.action} onValueChange={action => setFilters({ ...filters, action })}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="config_change">Cambio de configuración</SelectItem>
            <SelectItem value="data_export">Exportación de datos</SelectItem>
            <SelectItem value="etl_refresh">Refresco ETL</SelectItem>
            <SelectItem value="alert_change">Cambio de alerta</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Filtrar por usuario"
          value={filters.user_email}
          onChange={e => setFilters({ ...filters, user_email: e.target.value })}
          className="w-[250px]"
        />

        <Button onClick={loadLogs} variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Aplicar Filtros
        </Button>
      </div>

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
          {logs.map(log => (
            <TableRow key={log.id}>
              <TableCell className="text-xs">
                {format(new Date(log.created_date), "dd MMM yyyy HH:mm", { locale: es })}
              </TableCell>
              <TableCell className="text-xs">{log.user_email}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {log.action}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">{log.module || '—'}</TableCell>
              <TableCell className="text-xs text-[#B7CAC9]">{log.ip_address || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}