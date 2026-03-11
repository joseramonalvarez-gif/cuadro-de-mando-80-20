import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Bell, Bookmark } from 'lucide-react';

export default function TaxFilters({ filters, onFilterChange, onExport, onCreateAlert, onSaveView, isAdmin, isAdvanced }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filters.period} onValueChange={(v) => onFilterChange({ ...filters, period: v })}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Mes</SelectItem>
            <SelectItem value="quarter">Trimestre</SelectItem>
            <SelectItem value="year">Año</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.taxType} onValueChange={(v) => onFilterChange({ ...filters, taxType: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo Impuesto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="iva">IVA</SelectItem>
            <SelectItem value="irpf">IRPF/Retenciones</SelectItem>
            <SelectItem value="otros">Otros</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.comparison} onValueChange={(v) => onFilterChange({ ...filters, comparison: v })}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Comparativa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin comparativa</SelectItem>
            <SelectItem value="previous">Período anterior</SelectItem>
            <SelectItem value="yoy">Año anterior (YoY)</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={onSaveView}>
            <Bookmark className="w-4 h-4 mr-2" />
            Guardar
          </Button>
          {(isAdmin || isAdvanced) && (
            <>
              <Button variant="outline" size="sm" onClick={onCreateAlert}>
                <Bell className="w-4 h-4 mr-2" />
                Alerta
              </Button>
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}