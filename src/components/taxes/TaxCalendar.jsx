import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TaxCalendar({ vencimientos }) {
  const formatCurrency = (val) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  const getEstadoBadge = (fechaLimite, estado) => {
    if (estado === 'presentado') {
      return <Badge className="bg-[#E6F7F6] text-[#33A19A]"><CheckCircle className="w-3 h-3 mr-1" /> Presentado</Badge>;
    }

    const hoy = new Date();
    const limite = new Date(fechaLimite);
    const diasRestantes = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return <Badge className="bg-[#E05252] text-white"><AlertTriangle className="w-3 h-3 mr-1" /> Vencido</Badge>;
    }
    if (diasRestantes <= 5) {
      return <Badge className="bg-[#E05252] text-white"><AlertTriangle className="w-3 h-3 mr-1" /> {diasRestantes}d</Badge>;
    }
    if (diasRestantes <= 15) {
      return <Badge className="bg-[#FFF4E6] text-[#E6A817]"><AlertTriangle className="w-3 h-3 mr-1" /> {diasRestantes}d</Badge>;
    }
    return <Badge className="bg-[#E8EEEE] text-[#3E4C59]"><Calendar className="w-3 h-3 mr-1" /> {diasRestantes}d</Badge>;
  };

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
          Calendario Fiscal
        </h3>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modelo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Fecha Límite</TableHead>
              <TableHead>Importe Estimado</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vencimientos.map((venc, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-semibold text-[#1B2731]">
                  {venc.modelo}
                </TableCell>
                <TableCell className="text-[#3E4C59]">
                  {venc.periodo}
                </TableCell>
                <TableCell className="text-[#3E4C59]">
                  {new Date(venc.fechaLimite).toLocaleDateString('es-ES')}
                </TableCell>
                <TableCell className="font-semibold text-[#1B2731]">
                  {formatCurrency(venc.importeEstimado)}
                </TableCell>
                <TableCell>
                  {getEstadoBadge(venc.fechaLimite, venc.estado)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {vencimientos.length === 0 && (
        <div className="text-center py-8 text-[#B7CAC9]">
          No hay vencimientos fiscales configurados
        </div>
      )}

      <div className="mt-4 p-4 bg-[#FFF4E6] rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#E6A817] mt-0.5" />
        <div className="text-sm text-[#3E4C59]">
          <strong>Recordatorio:</strong> Los importes estimados se calculan automáticamente según el período.
          Las alertas se enviarán 15 y 5 días antes de cada vencimiento.
        </div>
      </div>
    </div>
  );
}