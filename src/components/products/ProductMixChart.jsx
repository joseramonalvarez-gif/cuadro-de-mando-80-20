import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#B7CAC9] rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-[#1B2731] mb-2">{data.item}</p>
      <p className="text-sm text-[#3E4C59]">
        Ventas: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.ventas)}
      </p>
      <p className="text-sm text-[#3E4C59]">
        Margen: {data.margenPct.toFixed(1)}%
      </p>
      <p className="text-sm text-[#3E4C59]">
        Clientes: {data.numClientes}
      </p>
      <p className="text-sm font-semibold" style={{ color: data.color }}>
        {data.categoria}
      </p>
    </div>
  );
};

export default function ProductMixChart({ data }) {
  const categorias = {
    'Estrella': { color: '#33A19A', label: 'Alto volumen + Alto margen' },
    'Gancho': { color: '#E6A817', label: 'Alto volumen + Bajo margen' },
    'Potencial': { color: '#3E8CDD', label: 'Bajo volumen + Alto margen' },
    'Revisar': { color: '#E05252', label: 'Bajo volumen + Bajo margen' }
  };

  const chartData = data.map(item => ({
    ...item,
    color: categorias[item.categoria]?.color || '#B7CAC9'
  }));

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">
        Matriz Volumen × Margen
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" />
          <XAxis 
            type="number" 
            dataKey="ventas" 
            name="Ventas"
            tick={{ fontSize: 11, fill: '#3E4C59' }}
            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k€`}
          />
          <YAxis 
            type="number" 
            dataKey="margenPct" 
            name="Margen %"
            tick={{ fontSize: 11, fill: '#3E4C59' }}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={chartData} dataKey="numClientes">
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(categorias).map(([cat, info]) => (
          <div key={cat} className="border border-[#E8EEEE] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: info.color }}></div>
              <span className="text-sm font-semibold text-[#1B2731]">{cat}</span>
            </div>
            <p className="text-xs text-[#3E4C59]">{info.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}