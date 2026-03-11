import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '../shared/DemoData';
import { ShoppingBag, Calendar, CreditCard } from 'lucide-react';

export default function SupplierDetailModal({ supplier, invoices, open, onClose }) {
  if (!supplier) return null;

  const totalPurchases = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const avgTicket = totalPurchases / invoices.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk'] text-xl">{supplier.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-[#F8F6F1] rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-[#3E4C59] mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span>Compras Totales</span>
            </div>
            <div className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">{formatCurrency(totalPurchases)}</div>
          </div>
          <div className="bg-[#F8F6F1] rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-[#3E4C59] mb-1">
              <Calendar className="w-4 h-4" />
              <span>Facturas Recibidas</span>
            </div>
            <div className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">{invoices.length}</div>
          </div>
          <div className="bg-[#F8F6F1] rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-[#3E4C59] mb-1">
              <CreditCard className="w-4 h-4" />
              <span>Ticket Medio</span>
            </div>
            <div className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">{formatCurrency(avgTicket)}</div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-3">Historial de Facturas de Compra</h4>
          <div className="space-y-2">
            {invoices.map((inv, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white border border-[#E8EEEE] rounded-lg hover:bg-[#FDFBF7] transition-colors">
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#1B2731]">{inv.num}</div>
                  <div className="text-xs text-[#B7CAC9] mt-0.5">{inv.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-[#1B2731]">{formatCurrency(inv.amount)}</div>
                  <Badge className={`${inv.status === 'Pagada' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'} text-xs`}>
                    {inv.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}