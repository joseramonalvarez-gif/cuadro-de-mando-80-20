import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '../shared/DemoData';
import { Calendar, AlertTriangle } from 'lucide-react';

export default function TaxCalendar({ deadlines }) {
  const now = new Date();
  
  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden">
      <div className="p-5 border-b border-[#E8EEEE] flex items-center gap-2">
        <Calendar className="w-5 h-5 text-[#33A19A]" />
        <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Calendario Fiscal — Próximos Vencimientos</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8F6F1]">
              <TableHead className="text-xs font-semibold text-[#3E4C59]">Modelo</TableHead>
              <TableHead className="text-xs font-semibold text-[#3E4C59]">Período</TableHead>
              <TableHead className="text-xs font-semibold text-[#3E4C59]">Fecha Límite</TableHead>
              <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Importe Estimado</TableHead>
              <TableHead className="text-xs font-semibold text-[#3E4C59]">Estado</TableHead>
              <TableHead className="text-xs font-semibold text-[#3E4C59]">Alerta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deadlines.map((d, i) => {
              const deadline = new Date(d.fecha_limite);
              const daysUntil = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));
              const showAlert = daysUntil <= 15 && d.estado === 'pendiente';
              const urgentAlert = daysUntil <= 5 && d.estado === 'pendiente';
              
              return (
                <TableRow key={i} className={`hover:bg-[#FDFBF7] ${urgentAlert ? 'bg-red-50' : ''}`}>
                  <TableCell className="text-sm text-[#1B2731] font-semibold">{d.modelo}</TableCell>
                  <TableCell className="text-sm text-[#3E4C59]">{d.periodo}</TableCell>
                  <TableCell className="text-sm text-[#1B2731]">{d.fecha_limite}</TableCell>
                  <TableCell className="text-sm text-[#1B2731] text-right font-semibold">{formatCurrency(d.importe)}</TableCell>
                  <TableCell>
                    <Badge className={`${d.estado === 'presentado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} text-xs`}>
                      {d.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {showAlert && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className={`w-4 h-4 ${urgentAlert ? 'text-red-600' : 'text-amber-600'}`} />
                        <span className={`text-xs font-semibold ${urgentAlert ? 'text-red-600' : 'text-amber-600'}`}>
                          {daysUntil} días
                        </span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}