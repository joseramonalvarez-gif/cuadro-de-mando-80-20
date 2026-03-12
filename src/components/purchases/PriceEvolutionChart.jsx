import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-white border border-[#B7CAC9] rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-[#1B2731] mb-1">{payload[0].payload.mes}</p>
      {payload.map((item, idx) => (
        <p key={idx} className="text-sm" style={{ color: item.color }}>
          {item.name}: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.value)}
        </p>
      ))}
    </div>
  );
};

export default function PriceEvolutionChart({ data, selectedProveedor }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
        <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">
          Evolución de Precios
        </h3>
        <div className="text-center py-12 text-[#B7CAC9]">
          Selecciona un proveedor para ver la evolución de precios
        </div>
      </div>
    );
  }

  // Calcular variación general
  const firstMonth = data[0];
  const lastMonth = data[data.length - 1];
  const variation = firstMonth && lastMonth 
    ? ((lastMonth.precioMedio - firstMonth.precioMedio) / firstMonth.precioMedio) * 100 
    : 0;

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
          Evolución de Precios {selectedProveedor && `- ${selectedProveedor}`}
        </h3>
        {variation !== 0 && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
            variation > 0 ? 'bg-[#FFE6E6] text-[#E05252]' : 'bg-[#E6F7F6] text-[#33A19A]'
          }`}>
            {variation > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-semibold">
              {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" />
          <XAxis 
            dataKey="mes" 
            tick={{ fontSize: 11, fill: '#3E4C59' }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#3E4C59' }}
            tickFormatter={(val) => `${val.toFixed(0)}€`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="precioMedio" 
            name="Precio Medio"
            stroke="#33A19A" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}