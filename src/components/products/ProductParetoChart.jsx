import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  const fmt = (v) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  return (
    <div className="bg-white border border-[#E8EEEE] rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-[#1B2731] mb-1">{label}</p>
      <p className="text-[#33A19A]">Ventas: {fmt(payload[0]?.value || 0)}</p>
      <p className="text-[#5BB8B2]">% Acumulado: {(payload[1]?.value || 0).toFixed(1)}%</p>
    </div>
  );
};

export default function ProductParetoChart({ data, title = "Análisis ABC — Pareto de Ventas" }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60">
      <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">{title}</h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" vertical={false} />
            <XAxis dataKey="producto" tick={{ fontSize: 10, fill: '#3E4C59' }} angle={-45} textAnchor="end" height={80} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#B7CAC9' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#5BB8B2' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="ventas" name="Ventas €" fill="#33A19A" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="acumulado" name="% Acumulado" stroke="#5BB8B2" strokeWidth={2.5} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}