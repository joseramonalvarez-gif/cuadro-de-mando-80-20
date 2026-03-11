import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import DateFilter from '../shared/DateFilter';
import { Download, Bell, Bookmark } from 'lucide-react';

export default function HRFilters({ filters, onFilterChange, onExport, onCreateAlert, onSaveView, isAdmin, isAdvanced, departments, employees }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <DateFilter onDateChange={(range) => onFilterChange({ ...filters, dateRange: range })} />
        
        <Select value={filters.department} onValueChange={(v) => onFilterChange({ ...filters, department: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {departments.map((dept, i) => (
              <SelectItem key={i} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.employee} onValueChange={(v) => onFilterChange({ ...filters, employee: v })}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Empleado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los empleados</SelectItem>
            {employees.map((emp, i) => (
              <SelectItem key={i} value={emp.id || emp.name}>{emp.name}</SelectItem>
            ))}
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