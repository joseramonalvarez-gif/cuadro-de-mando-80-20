import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import DateFilter from '../shared/DateFilter';
import { Download, Bell, Bookmark } from 'lucide-react';

export default function PurchaseFilters({ filters, onFilterChange, onExport, onCreateAlert, onSaveView, isAdmin, isAdvanced }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <DateFilter onDateChange={(range) => onFilterChange({ ...filters, dateRange: range })} />
        
        <Select value={filters.abcSegment} onValueChange={(v) => onFilterChange({ ...filters, abcSegment: v })}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Segmento ABC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="A">A (Top 80%)</SelectItem>
            <SelectItem value="B">B (15%)</SelectItem>
            <SelectItem value="C">C (5%)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.family} onValueChange={(v) => onFilterChange({ ...filters, family: v })}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Familia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="materiales">Materiales</SelectItem>
            <SelectItem value="servicios">Servicios</SelectItem>
            <SelectItem value="tecnologia">Tecnología</SelectItem>
            <SelectItem value="logistica">Logística</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.topN} onValueChange={(v) => onFilterChange({ ...filters, topN: v })}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Top N" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="5">Top 5</SelectItem>
            <SelectItem value="10">Top 10</SelectItem>
            <SelectItem value="20">Top 20</SelectItem>
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