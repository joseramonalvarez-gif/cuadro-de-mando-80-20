import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from 'lucide-react';

export default function AlertFilters({ filters, onFilterChange, onCreateAlert, isAdmin, isAdvanced }) {
  const modules = ['Todos', 'Ventas', 'Compras', 'Tesorería', 'Fiscalidad', 'RRHH', 'Producto'];
  const statuses = ['Todas', 'Activas', 'Pausadas', 'Disparadas'];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-[#B7CAC9]" />
        
        <Select value={filters.module} onValueChange={(v) => onFilterChange({ ...filters, module: v })}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            {modules.map((mod, i) => (
              <SelectItem key={i} value={mod.toLowerCase()}>{mod}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => onFilterChange({ ...filters, status: v })}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((st, i) => (
              <SelectItem key={i} value={st.toLowerCase()}>{st}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Select value={filters.creator} onValueChange={(v) => onFilterChange({ ...filters, creator: v })}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Creador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
              <SelectItem value="users">Usuarios</SelectItem>
            </SelectContent>
          </Select>
        )}

        {(isAdmin || isAdvanced) && (
          <div className="ml-auto">
            <Button onClick={onCreateAlert} className="bg-[#33A19A] hover:bg-[#2A8A84]">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Alerta
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}