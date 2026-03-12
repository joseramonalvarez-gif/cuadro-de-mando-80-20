import React from 'react';
import { Badge } from '@/components/ui/badge';

const segmentColors = {
  'Campeón': 'bg-[#33A19A] text-white',
  'Cliente fiel': 'bg-[#3E4C59] text-white',
  'Nuevo prometedor': 'bg-[#E6A817] text-white',
  'En riesgo': 'bg-[#E05252] text-white',
  'Perdido': 'bg-[#B7CAC9] text-[#3E4C59]',
  'Otros': 'bg-[#F0F5F5] text-[#3E4C59]'
};

export default function RFMSegmentMatrix({ clientes }) {
  // Agrupar por segmento
  const segmentCounts = clientes.reduce((acc, c) => {
    acc[c.segmentoRFM] = (acc[c.segmentoRFM] || 0) + 1;
    return acc;
  }, {});

  const segments = Object.entries(segmentCounts).map(([name, count]) => ({
    name,
    count,
    pct: ((count / clientes.length) * 100).toFixed(1)
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">
        Segmentación RFM
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {segments.map(seg => (
          <div 
            key={seg.name}
            className="border border-[#E8EEEE] rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <Badge className={segmentColors[seg.name] || segmentColors['Otros']}>
              {seg.name}
            </Badge>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[#1B2731] font-['Space_Grotesk']">
                {seg.count}
              </div>
              <div className="text-sm text-[#3E4C59]">
                {seg.pct}% del total
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-[#F0F5F5] rounded-lg">
        <h4 className="font-semibold text-[#1B2731] text-sm mb-2">Definiciones RFM:</h4>
        <ul className="text-xs text-[#3E4C59] space-y-1">
          <li><strong>R</strong> (Recency): Días desde última compra</li>
          <li><strong>F</strong> (Frequency): Número de facturas últimos 12 meses</li>
          <li><strong>M</strong> (Monetary): Importe total últimos 12 meses</li>
        </ul>
      </div>
    </div>
  );
}