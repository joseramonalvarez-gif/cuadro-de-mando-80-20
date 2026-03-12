import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#B7CAC9] rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-[#1B2731] mb-2">IVA {data.tipo}</p>
      <p className="text-sm text-[#3E4C59]">
        Base Imponible: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.baseImponible)}
      </p>
      <p className="text-sm text-[#33A19A] font-semibold">
        Cuota IVA: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.cuotaIVA)}
      </p>
      <p className="text-sm text-[#3E4C59]">
        {data.pctSobreTotal.toFixed(1)}% del total
      </p>
    </div>
  );
};

export default function VATBreakdownChart({ data }) {
  const colors = {
    '21%': '#33A19A',
    '10%': '#E6A817',
    '4%': '#B7CAC9',
    '0%': '#E8EEEE',
    'Exento': '#F0F5F5'
  };

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">
        Desglose por Tipo de IVA
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" />
          <XAxis 
            dataKey="tipo" 
            tick={{ fontSize: 11, fill: '#3E4C59' }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#3E4C59' }}
            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k€`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="baseImponible" 
            name="Base Imponible"
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={colors[entry.tipo] || '#B7CAC9'} opacity={0.3} />
            ))}
          </Bar>
          <Bar 
            dataKey="cuotaIVA" 
            name="Cuota IVA"
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={colors[entry.tipo] || '#33A19A'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        {data.map((item) => (
          <div key={item.tipo} className="border border-[#E8EEEE] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: colors[item.tipo] || '#B7CAC9' }}
              ></div>
              <span className="text-sm font-semibold text-[#1B2731]">{item.tipo}</span>
            </div>
            <div className="text-xs text-[#3E4C59]">
              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(item.cuotaIVA)}
            </div>
            <div className="text-xs text-[#B7CAC9]">
              {item.pctSobreTotal.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}