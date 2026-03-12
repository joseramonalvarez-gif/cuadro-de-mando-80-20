import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

export default function AlertFilters({ filters, onFiltersChange }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-4">
      <div className="flex flex-wrap gap-3">
        <Select 
          value={filters.estado} 
          onValueChange={(val) => onFiltersChange({ ...filters, estado: val })}
        >
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Solo activas</SelectItem>
            <SelectItem value="paused">Solo pausadas</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.severidad} 
          onValueChange={(val) => onFiltersChange({ ...filters, severidad: val })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las severidades</SelectItem>
            <SelectItem value="yellow">🟡 Solo avisos</SelectItem>
            <SelectItem value="red">🔴 Solo críticas</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.modulo} 
          onValueChange={(val) => onFiltersChange({ ...filters, modulo: val })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los módulos</SelectItem>
            <SelectItem value="ventas">Ventas</SelectItem>
            <SelectItem value="compras">Compras</SelectItem>
            <SelectItem value="tesoreria">Tesorería</SelectItem>
            <SelectItem value="fiscal">Fiscal</SelectItem>
            <SelectItem value="rrhh">RRHH</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onFiltersChange({
            estado: 'all',
            severidad: 'all',
            modulo: 'all'
          })}
        >
          Resetear
        </Button>
      </div>
    </div>
  );
}