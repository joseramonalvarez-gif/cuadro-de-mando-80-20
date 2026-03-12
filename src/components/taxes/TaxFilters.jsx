import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Filter } from 'lucide-react';

export default function TaxFilters({ filters, onFiltersChange }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-4">
      <div className="flex flex-wrap gap-3">
        <Select 
          value={filters.periodo} 
          onValueChange={(val) => onFiltersChange({ ...filters, periodo: val })}
        >
          <SelectTrigger className="w-[140px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mes">Este mes</SelectItem>
            <SelectItem value="trimestre">Este trimestre</SelectItem>
            <SelectItem value="año">Este año</SelectItem>
            <SelectItem value="ytd">YTD</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.tipoImpuesto} 
          onValueChange={(val) => onFiltersChange({ ...filters, tipoImpuesto: val })}
        >
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="21">IVA 21%</SelectItem>
            <SelectItem value="10">IVA 10%</SelectItem>
            <SelectItem value="4">IVA 4%</SelectItem>
            <SelectItem value="0">IVA 0%</SelectItem>
            <SelectItem value="exento">Exento</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.comparativa} 
          onValueChange={(val) => onFiltersChange({ ...filters, comparativa: val })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin comparativa</SelectItem>
            <SelectItem value="año_anterior">vs Año anterior</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onFiltersChange({
            periodo: 'trimestre',
            tipoImpuesto: 'all',
            comparativa: 'none'
          })}
        >
          Resetear
        </Button>
      </div>
    </div>
  );
}