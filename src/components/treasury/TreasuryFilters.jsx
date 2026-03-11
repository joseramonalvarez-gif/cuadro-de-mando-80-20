import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import DateFilter from '../shared/DateFilter';
import { Download, Bell, Bookmark } from 'lucide-react';

export default function TreasuryFilters({ filters, onFilterChange, onExport, onCreateAlert, onSaveView, isAdmin, isAdvanced, accounts }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <DateFilter onDateChange={(range) => onFilterChange({ ...filters, dateRange: range })} />
        
        <Select value={filters.account} onValueChange={(v) => onFilterChange({ ...filters, account: v })}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Cuenta Tesorería" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las cuentas</SelectItem>
            {accounts.map((acc, i) => (
              <SelectItem key={i} value={acc.id || acc.name}>{acc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={(v) => onFilterChange({ ...filters, type: v })}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="cobros">Cobros</SelectItem>
            <SelectItem value="pagos">Pagos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.forecastPeriod} onValueChange={(v) => onFilterChange({ ...filters, forecastPeriod: v })}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Previsión" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 días</SelectItem>
            <SelectItem value="60">60 días</SelectItem>
            <SelectItem value="90">90 días</SelectItem>
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