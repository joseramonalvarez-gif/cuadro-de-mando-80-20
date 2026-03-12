import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#B7CAC9] rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-[#1B2731] mb-1">{data.item}</p>
      <p className="text-sm text-[#3E4C59]">
        Ventas: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.ventas)}
      </p>
      <p className="text-sm text-[#3E4C59]">
        % Acumulado: {data.pctAcumulado.toFixed(1)}%
      </p>
      <p className="text-sm font-medium" style={{ color: data.color }}>
        Clase {data.claseVentas}
      </p>
    </div>
  );
};

export default function ProductParetoChart({ data, tipo, topN = 20 }) {
  const displayData = data.slice(0, topN);
  
  const claseColors = {
    A: '#33A19A',
    B: '#E6A817',
    C: '#B7CAC9'
  };

  const chartData = displayData.map(item => ({
    ...item,
    color: claseColors[tipo === 'ventas' ? item.claseVentas : item.claseMargen]
  }));

  const itemsA = data.filter(p => (tipo === 'ventas' ? p.claseVentas : p.claseMargen) === 'A').length;

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
          Análisis Pareto - {tipo === 'ventas' ? 'Ventas' : 'Margen'}
        </h3>
        <Badge className="bg-[#E6F7F6] text-[#33A19A]">
          {itemsA} ítems clase A (80% del {tipo})
        </Badge>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" />
          <XAxis 
            dataKey="item" 
            tick={{ fontSize: 10, fill: '#3E4C59' }}
            angle={-45}
            textAnchor="end"
            height={120}
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
            dataKey={tipo === 'ventas' ? 'ventas' : 'margen'}
            name={tipo === 'ventas' ? 'Ventas €' : 'Margen €'}
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
    </div>
  );
}