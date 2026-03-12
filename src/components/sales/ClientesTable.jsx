import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Search } from 'lucide-react';

const claseBadgeColors = {
  A: 'bg-[#33A19A] text-white',
  B: 'bg-[#E6A817] text-white',
  C: 'bg-[#B7CAC9] text-[#3E4C59]'
};

const segmentBadgeColors = {
  'Campeón': 'bg-[#33A19A] text-white',
  'Cliente fiel': 'bg-[#3E4C59] text-white',
  'Nuevo prometedor': 'bg-[#E6A817] text-white',
  'En riesgo': 'bg-[#E05252] text-white',
  'Perdido': 'bg-[#B7CAC9] text-[#3E4C59]',
  'Otros': 'bg-[#F0F5F5] text-[#3E4C59]'
};

export default function ClientesTable({ clientes }) {
  const [search, setSearch] = useState('');
  const [filterClase, setFilterClase] = useState('all');
  const [filterSegmento, setFilterSegmento] = useState('all');
  const [sortField, setSortField] = useState('ventas');
  const [sortDesc, setSortDesc] = useState(true);

  const formatCurrency = (val) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  let filtered = clientes.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase());
    const matchClase = filterClase === 'all' || c.clase === filterClase;
    const matchSegmento = filterSegmento === 'all' || c.segmentoRFM === filterSegmento;
    return matchSearch && matchClase && matchSegmento;
  });

  filtered.sort((a, b) => {
    const aVal = a[sortField] || 0;
    const bVal = b[sortField] || 0;
    return sortDesc ? bVal - aVal : aVal - bVal;
  });

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B7CAC9]" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterClase} onValueChange={setFilterClase}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Clase ABC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las clases</SelectItem>
            <SelectItem value="A">Clase A</SelectItem>
            <SelectItem value="B">Clase B</SelectItem>
            <SelectItem value="C">Clase C</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSegmento} onValueChange={setFilterSegmento}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Segmento RFM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los segmentos</SelectItem>
            <SelectItem value="Campeón">Campeón</SelectItem>
            <SelectItem value="Cliente fiel">Cliente fiel</SelectItem>
            <SelectItem value="Nuevo prometedor">Nuevo prometedor</SelectItem>
            <SelectItem value="En riesgo">En riesgo</SelectItem>
            <SelectItem value="Perdido">Perdido</SelectItem>
            <SelectItem value="Otros">Otros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('ventas')}>
                <div className="flex items-center gap-1">
                  Ventas <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead>% Total</TableHead>
              <TableHead>% Acum</TableHead>
              <TableHead>Clase</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('margenPct')}>
                <div className="flex items-center gap-1">
                  Margen % <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead>R-F-M</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Clasificación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 50).map((cliente, idx) => (
              <TableRow key={cliente.clienteId}>
                <TableCell className="font-mono text-sm text-[#3E4C59]">
                  {cliente.rank}
                </TableCell>
                <TableCell className="font-medium text-[#1B2731]">
                  {cliente.nombre}
                </TableCell>
                <TableCell className="font-semibold text-[#1B2731]">
                  {formatCurrency(cliente.ventas)}
                </TableCell>
                <TableCell className="text-[#3E4C59]">
                  {cliente.pctTotal.toFixed(1)}%
                </TableCell>
                <TableCell className="text-[#3E4C59]">
                  {cliente.pctAcumulado.toFixed(1)}%
                </TableCell>
                <TableCell>
                  <Badge className={claseBadgeColors[cliente.clase]}>
                    {cliente.clase}
                  </Badge>
                </TableCell>
                <TableCell className={cliente.margenPct < 0 ? 'text-[#E05252]' : 'text-[#33A19A]'}>
                  {cliente.margenPct.toFixed(1)}%
                </TableCell>
                <TableCell className="font-mono text-xs text-[#3E4C59]">
                  {cliente.scoreRFM}
                </TableCell>
                <TableCell>
                  <Badge className={segmentBadgeColors[cliente.segmentoRFM]}>
                    {cliente.segmentoRFM}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-[#3E4C59]">
                    {cliente.clasificacion}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-[#B7CAC9]">
          No se encontraron clientes con los filtros aplicados
        </div>
      )}

      {filtered.length > 50 && (
        <div className="mt-4 text-sm text-[#3E4C59] text-center">
          Mostrando 50 de {filtered.length} clientes. Refina los filtros para ver más.
        </div>
      )}
    </div>
  );
}