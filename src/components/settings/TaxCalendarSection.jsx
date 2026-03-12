import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function TaxCalendarSection() {
  const [events, setEvents] = useState([
    {
      id: '1',
      modelo: '303 IVA',
      periodo: 'Q1 2026',
      fechaLimite: '2026-04-20',
      importeEstimado: 8500,
      estado: 'pendiente'
    },
    {
      id: '2',
      modelo: '111 IRPF',
      periodo: 'Febrero 2026',
      fechaLimite: '2026-03-20',
      importeEstimado: 3200,
      estado: 'pagado'
    }
  ]);

  function getDaysUntil(date) {
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function getStatusBadge(event) {
    if (event.estado === 'pagado') {
      return <Badge className="bg-[#E6F7F6] text-[#33A19A]">✅ Pagado</Badge>;
    }

    const days = getDaysUntil(event.fechaLimite);
    
    if (days < 0) {
      return <Badge className="bg-[#E05252] text-white">🔴 Vencido</Badge>;
    }
    if (days <= 5) {
      return <Badge className="bg-[#E05252] text-white">🔴 {days}d</Badge>;
    }
    if (days <= 15) {
      return <Badge className="bg-[#FFF4E6] text-[#E6A817]">🟡 {days}d</Badge>;
    }
    return <Badge className="bg-[#E8EEEE] text-[#3E4C59]">⏳ {days}d</Badge>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
          Calendario Fiscal
        </h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Añadir Vencimiento
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E8EEEE]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modelo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Fecha Límite</TableHead>
              <TableHead>Importe Estimado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map(event => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.modelo}</TableCell>
                <TableCell className="text-[#3E4C59]">{event.periodo}</TableCell>
                <TableCell className="text-[#3E4C59]">
                  {new Date(event.fechaLimite).toLocaleDateString('es-ES')}
                </TableCell>
                <TableCell className="font-semibold">
                  {new Intl.NumberFormat('es-ES', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  }).format(event.importeEstimado)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(event)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Pencil className="w-4 h-4 text-[#3E4C59]" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4 text-[#E05252]" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}