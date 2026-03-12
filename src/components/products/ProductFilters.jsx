import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Filter } from 'lucide-react';

export default function ProductFilters({ filters, onFiltersChange, modeloNegocio }) {
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
          </SelectContent>
        </Select>

        <Select 
          value={filters.claseABC} 
          onValueChange={(val) => onFiltersChange({ ...filters, claseABC: val })}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las clases</SelectItem>
            <SelectItem value="A">Solo clase A</SelectItem>
            <SelectItem value="B">Solo clase B</SelectItem>
            <SelectItem value="C">Solo clase C</SelectItem>
          </SelectContent>
        </Select>

        {(modeloNegocio === 'productos' || modeloNegocio === 'mixto') && (
          <Select 
            value={filters.stock} 
            onValueChange={(val) => onFiltersChange({ ...filters, stock: val })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ruptura">Solo con ruptura</SelectItem>
              <SelectItem value="bajo">Stock bajo</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onFiltersChange({
            periodo: 'mes',
            claseABC: 'all',
            stock: 'all'
          })}
        >
          Resetear
        </Button>
      </div>
    </div>
  );
}