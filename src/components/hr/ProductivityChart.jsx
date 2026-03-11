import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  const fmt = (v) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  return (
    <div className="bg-white border border-[#E8EEEE] rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-[#1B2731] mb-1">{label}</p>
      <p style={{ color: payload[0].color }}>Productividad: {fmt(payload[0].value)}/FTE</p>
    </div>
  );
};

export default function ProductivityChart({ data }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60">
      <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">Productividad — Ventas por Empleado (FTE)</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#3E4C59' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#B7CAC9' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="productividad" name="Ventas/FTE" stroke="#33A19A" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}