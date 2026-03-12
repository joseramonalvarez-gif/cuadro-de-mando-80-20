import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Filter } from 'lucide-react';

export default function HRFilters({ filters, onFiltersChange }) {
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
          value={filters.perfil} 
          onValueChange={(val) => onFiltersChange({ ...filters, perfil: val })}
        >
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los perfiles</SelectItem>
            <SelectItem value="senior">Senior</SelectItem>
            <SelectItem value="junior">Junior</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onFiltersChange({
            periodo: 'mes',
            perfil: 'all'
          })}
        >
          Resetear
        </Button>
      </div>
    </div>
  );
}