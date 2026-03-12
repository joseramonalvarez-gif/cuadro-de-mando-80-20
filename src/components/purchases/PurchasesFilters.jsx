import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

export default function PurchasesFilters({ filters, onFiltersChange, modeloNegocio }) {
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
          value={filters.comparativa} 
          onValueChange={(val) => onFiltersChange({ ...filters, comparativa: val })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="anterior">vs Período anterior</SelectItem>
            <SelectItem value="año_anterior">vs Año anterior</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.claseABC} 
          onValueChange={(val) => onFiltersChange({ ...filters, claseABC: val })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las clases</SelectItem>
            <SelectItem value="A">Clase A</SelectItem>
            <SelectItem value="B">Clase B</SelectItem>
            <SelectItem value="C">Clase C</SelectItem>
          </SelectContent>
        </Select>

        {(modeloNegocio === 'servicios' || modeloNegocio === 'mixto') && (
          <Select 
            value={filters.tipoGasto} 
            onValueChange={(val) => onFiltersChange({ ...filters, tipoGasto: val })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los gastos</SelectItem>
              <SelectItem value="subcontratacion">Subcontratación</SelectItem>
              <SelectItem value="licencias">Licencias</SelectItem>
              <SelectItem value="infraestructura">Infraestructura</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select 
          value={filters.topN} 
          onValueChange={(val) => onFiltersChange({ ...filters, topN: parseInt(val) })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">Top 10</SelectItem>
            <SelectItem value="20">Top 20</SelectItem>
            <SelectItem value="50">Top 50</SelectItem>
            <SelectItem value="100">Todos</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onFiltersChange({
            periodo: 'mes',
            comparativa: 'anterior',
            claseABC: 'all',
            tipoGasto: 'all',
            topN: 20
          })}
        >
          Resetear
        </Button>
      </div>
    </div>
  );
}