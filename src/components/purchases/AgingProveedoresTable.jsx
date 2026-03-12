import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';

const agingColors = {
  '0-30d': 'bg-[#E6F7F6] text-[#33A19A]',
  '31-60d': 'bg-[#FFF4E6] text-[#E6A817]',
  '61-90d': 'bg-[#FFE6E6] text-[#E05252]',
  '+90d': 'bg-[#E05252] text-white'
};

export default function AgingProveedoresTable({ facturas }) {
  const [filterBucket, setFilterBucket] = useState('all');

  const formatCurrency = (val) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  const getBucket = (dias) => {
    if (dias <= 30) return '0-30d';
    if (dias <= 60) return '31-60d';
    if (dias <= 90) return '61-90d';
    return '+90d';
  };

  const filtered = filterBucket === 'all' 
    ? facturas 
    : facturas.filter(f => getBucket(f.diasVencida) === filterBucket);

  // Totales por bucket
  const totales = facturas.reduce((acc, f) => {
    const bucket = getBucket(f.diasVencida);
    acc[bucket] = (acc[bucket] || 0) + f.importe;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
          Aging de Proveedores
        </h3>
        <Select value={filterBucket} onValueChange={setFilterBucket}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="0-30d">0-30 días</SelectItem>
            <SelectItem value="31-60d">31-60 días</SelectItem>
            <SelectItem value="61-90d">61-90 días</SelectItem>
            <SelectItem value="+90d">+90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(totales).map(([bucket, total]) => (
          <div key={bucket} className="border border-[#E8EEEE] rounded-lg p-4">
            <div className="text-xs text-[#3E4C59] mb-1">{bucket}</div>
            <div className="text-lg font-bold text-[#1B2731] font-['Space_Grotesk']">
              {formatCurrency(total)}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead>Importe</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Días Vencida</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((factura, idx) => {
              const bucket = getBucket(factura.diasVencida);
              return (
                <TableRow key={idx}>
                  <TableCell className="font-medium text-[#1B2731]">
                    {factura.proveedor}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-[#3E4C59]">
                    {factura.numeroFactura}
                  </TableCell>
                  <TableCell className="font-semibold text-[#1B2731]">
                    {formatCurrency(factura.importe)}
                  </TableCell>
                  <TableCell className="text-[#3E4C59]">
                    {new Date(factura.fechaVencimiento).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <span className={factura.diasVencida > 60 ? 'text-[#E05252] font-semibold' : 'text-[#3E4C59]'}>
                      {factura.diasVencida} días
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={agingColors[bucket]}>
                      {bucket}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-[#B7CAC9]">
          No hay facturas pendientes en este rango
        </div>
      )}

      {facturas.filter(f => f.diasVencida > 90).length > 0 && (
        <div className="mt-4 p-4 bg-[#FFE6E6] rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#E05252] mt-0.5" />
          <div className="text-sm text-[#3E4C59]">
            <strong className="text-[#E05252]">Atención:</strong> Hay {facturas.filter(f => f.diasVencida > 90).length} facturas 
            con más de 90 días de retraso por un importe total de {formatCurrency(totales['+90d'] || 0)}
          </div>
        </div>
      )}
    </div>
  );
}