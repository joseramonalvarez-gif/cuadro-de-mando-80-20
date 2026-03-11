import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import DateFilter from '../shared/DateFilter';
import { Download, Bell, Bookmark } from 'lucide-react';

export default function ProductFilters({ filters, onFilterChange, onExport, onCreateAlert, onSaveView, isAdmin, isAdvanced, families }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <DateFilter onDateChange={(range) => onFilterChange({ ...filters, dateRange: range })} />
        
        <Select value={filters.family} onValueChange={(v) => onFilterChange({ ...filters, family: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Familia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {families.map((fam, i) => (
              <SelectItem key={i} value={fam}>{fam}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.abcClass} onValueChange={(v) => onFilterChange({ ...filters, abcClass: v })}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Clase ABC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="A">Clase A</SelectItem>
            <SelectItem value="B">Clase B</SelectItem>
            <SelectItem value="C">Clase C</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.stockStatus} onValueChange={(v) => onFilterChange({ ...filters, stockStatus: v })}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Estado Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="with">Con stock</SelectItem>
            <SelectItem value="without">Sin stock</SelectItem>
            <SelectItem value="low">Stock bajo</SelectItem>
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