import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  const fmt = (v) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  return (
    <div className="bg-white border border-[#E8EEEE] rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-[#1B2731] mb-1">{label}</p>
      <p style={{ color: payload[0].color }}>Importe: {fmt(payload[0].value)}</p>
    </div>
  );
};

const BUCKET_COLORS = {
  '0-30d': '#33A19A',
  '31-60d': '#F59E0B',
  '61-90d': '#EF4444',
  '+90d': '#991B1B',
};

export default function AgingChart({ data, title }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60">
      <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">{title}</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" vertical={false} />
            <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#3E4C59' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#B7CAC9' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="importe" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BUCKET_COLORS[entry.bucket] || '#B7CAC9'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}