import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#B7CAC9] rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-[#1B2731] mb-1">{data.cliente}</p>
      <p className="text-sm text-[#3E4C59]">
        Ventas: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.ventas)}
      </p>
      <p className="text-sm text-[#3E4C59]">
        % Acumulado: {data.pctAcumulado.toFixed(1)}%
      </p>
      <p className="text-sm font-medium" style={{ color: data.color }}>
        Clase {data.clase}
      </p>
    </div>
  );
};

export default function ParetoABCChart({ data, topN = 20 }) {
  const displayData = data.slice(0, topN);
  
  const claseColors = {
    A: '#33A19A',
    B: '#E6A817',
    C: '#B7CAC9'
  };

  const chartData = displayData.map(item => ({
    ...item,
    color: claseColors[item.clase]
  }));

  // Calcular resumen
  const clientesA = data.filter(c => c.clase === 'A').length;
  const pctClientesA = ((clientesA / data.length) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
          Análisis Pareto 80/20
        </h3>
        <div className="text-sm text-[#3E4C59] bg-[#F0F5F5] px-3 py-1 rounded-lg">
          Los <span className="font-semibold text-[#33A19A]">{clientesA} clientes</span> del bloque A 
          ({pctClientesA}% del total) generan el <span className="font-semibold text-[#33A19A]">80%</span> de las ventas
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" />
          <XAxis 
            dataKey="cliente" 
            tick={{ fontSize: 11, fill: '#3E4C59' }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 11, fill: '#3E4C59' }}
            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k€`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#3E4C59' }}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="ventas" 
            name="Ventas €"
            fill="#33A19A"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Bar key={index} fill={entry.color} />
            ))}
          </Bar>
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="pctAcumulado" 
            name="% Acumulado"
            stroke="#E05252" 
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#33A19A' }}></div>
          <span className="text-[#3E4C59]">Clase A (≤80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#E6A817' }}></div>
          <span className="text-[#3E4C59]">Clase B (80-95%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#B7CAC9' }}></div>
          <span className="text-[#3E4C59]">Clase C (>95%)</span>
        </div>
      </div>
    </div>
  );
}