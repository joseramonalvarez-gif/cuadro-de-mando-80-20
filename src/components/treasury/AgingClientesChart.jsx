import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#B7CAC9] rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-[#1B2731] mb-2">{data.bucket}</p>
      <p className="text-sm text-[#3E4C59]">
        Importe: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.importe)}
      </p>
      <p className="text-sm text-[#3E4C59]">
        Facturas: {data.numFacturas}
      </p>
    </div>
  );
};

export default function AgingClientesChart({ data }) {
  const bucketColors = {
    'No vencida': '#33A19A',
    '0-30d': '#E6A817',
    '31-60d': '#E05252',
    '61-90d': '#8B0000',
    '+90d': '#5C0000'
  };

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">
        Aging de Clientes - Cobros Pendientes
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" />
          <XAxis 
            dataKey="bucket" 
            tick={{ fontSize: 11, fill: '#3E4C59' }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#3E4C59' }}
            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k€`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="importe" 
            name="Importe Pendiente"
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Bar key={index} fill={bucketColors[entry.bucket] || '#B7CAC9'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-4 text-xs flex-wrap">
        {Object.entries(bucketColors).map(([bucket, color]) => (
          <div key={bucket} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
            <span className="text-[#3E4C59]">{bucket}</span>
          </div>
        ))}
      </div>
    </div>
  );
}