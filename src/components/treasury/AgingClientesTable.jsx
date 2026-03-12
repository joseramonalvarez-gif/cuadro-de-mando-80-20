import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const bucketColors = {
  'No vencida': 'bg-[#E6F7F6] text-[#33A19A]',
  '0-30d': 'bg-[#FFF4E6] text-[#E6A817]',
  '31-60d': 'bg-[#FFE6E6] text-[#E05252]',
  '61-90d': 'bg-[#E05252] text-white',
  '+90d': 'bg-[#5C0000] text-white'
};

export default function AgingClientesTable({ facturas }) {
  const [filterBucket, setFilterBucket] = useState('all');
  const [search, setSearch] = useState('');

  const formatCurrency = (val) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  const getBucket = (dias) => {
    if (dias < 0) return 'No vencida';
    if (dias <= 30) return '0-30d';
    if (dias <= 60) return '31-60d';
    if (dias <= 90) return '61-90d';
    return '+90d';
  };

  let filtered = facturas.filter(f => {
    const bucket = getBucket(f.diasVencida);
    const matchBucket = filterBucket === 'all' || bucket === filterBucket;
    const matchSearch = f.cliente.toLowerCase().includes(search.toLowerCase()) ||
                       f.numeroFactura.toLowerCase().includes(search.toLowerCase());
    return matchBucket && matchSearch;
  });

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
          Detalle de Cobros Pendientes
        </h3>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B7CAC9]" />
            <Input
              placeholder="Buscar cliente o factura..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={filterBucket} onValueChange={setFilterBucket}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="No vencida">No vencida</SelectItem>
              <SelectItem value="0-30d">0-30 días</SelectItem>
              <SelectItem value="31-60d">31-60 días</SelectItem>
              <SelectItem value="61-90d">61-90 días</SelectItem>
              <SelectItem value="+90d">+90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead>Importe Pendiente</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Días Vencida</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 100).map((factura, idx) => {
              const bucket = getBucket(factura.diasVencida);
              return (
                <TableRow key={idx}>
                  <TableCell className="font-medium text-[#1B2731]">
                    {factura.cliente}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-[#3E4C59]">
                    {factura.numeroFactura}
                  </TableCell>
                  <TableCell className="font-semibold text-[#1B2731]">
                    {formatCurrency(factura.importePendiente)}
                  </TableCell>
                  <TableCell className="text-[#3E4C59]">
                    {new Date(factura.fechaVencimiento).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <span className={factura.diasVencida > 60 ? 'text-[#E05252] font-semibold' : 'text-[#3E4C59]'}>
                      {factura.diasVencida >= 0 ? `${factura.diasVencida} días` : 'No vencida'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={bucketColors[bucket]}>
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
          No se encontraron facturas pendientes
        </div>
      )}

      {filtered.length > 100 && (
        <div className="mt-4 text-sm text-[#3E4C59] text-center">
          Mostrando 100 de {filtered.length} facturas. Usa los filtros para refinar la búsqueda.
        </div>
      )}
    </div>
  );
}