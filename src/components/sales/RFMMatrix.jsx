import React from 'react';
import { Badge } from "@/components/ui/badge";

const SEGMENTS = {
  champion: { label: 'Campeón', color: 'bg-emerald-500', textColor: 'text-white' },
  loyal: { label: 'Cliente Fiel', color: 'bg-[#33A19A]', textColor: 'text-white' },
  at_risk: { label: 'En Riesgo', color: 'bg-amber-500', textColor: 'text-white' },
  lost: { label: 'Perdido', color: 'bg-red-500', textColor: 'text-white' },
  new: { label: 'Nuevo', color: 'bg-blue-500', textColor: 'text-white' },
  promising: { label: 'Prometedor', color: 'bg-violet-500', textColor: 'text-white' },
};

export default function RFMMatrix({ data }) {
  const grouped = data.reduce((acc, item) => {
    const seg = item.rfm_segment;
    if (!acc[seg]) acc[seg] = [];
    acc[seg].push(item);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60">
      <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">Segmentación RFM</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(SEGMENTS).map(([key, config]) => {
          const count = grouped[key]?.length || 0;
          const total = grouped[key]?.reduce((sum, c) => sum + c.valor_total, 0) || 0;
          return (
            <div key={key} className="border border-[#E8EEEE] rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${config.color}`} />
                <span className="text-xs font-semibold text-[#3E4C59]">{config.label}</span>
              </div>
              <div className="text-2xl font-bold text-[#1B2731] font-['Space_Grotesk']">{count}</div>
              <div className="text-xs text-[#B7CAC9] mt-1">
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(total)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}