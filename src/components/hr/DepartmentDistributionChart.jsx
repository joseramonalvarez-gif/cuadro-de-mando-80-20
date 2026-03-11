import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DEPT_COLORS = ['#33A19A', '#5BB8B2', '#B7CAC9', '#E8EEEE', '#F8F6F1'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload[0]) return null;
  const data = payload[0].payload;
  const fmt = (v) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  return (
    <div className="bg-white border border-[#E8EEEE] rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-[#1B2731] mb-1">{data.name}</p>
      <p className="text-[#3E4C59]">Coste: {fmt(data.value)}</p>
      <p className="font-semibold text-[#33A19A]">{data.percent.toFixed(1)}% del total</p>
    </div>
  );
};

export default function DepartmentDistributionChart({ data }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60">
      <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">Distribución Coste por Departamento</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={(entry) => `${entry.name}: ${entry.percent.toFixed(1)}%`}
              labelLine={true}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}