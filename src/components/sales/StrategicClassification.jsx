import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts';

const strategyColors = {
  'Proteger': '#33A19A',
  'Desarrollar': '#E6A817',
  'Corregir': '#E05252',
  'Vigilar': '#3E4C59',
  'Abandonar': '#B7CAC9'
};

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
        Margen: {data.margenPct.toFixed(1)}%
      </p>
      <p className="text-sm text-[#3E4C59]">
        Facturas: {data.numFacturas}
      </p>
      <p className="text-sm font-medium mt-1" style={{ color: strategyColors[data.clasificacion] }}>
        {data.clasificacion}
      </p>
    </div>
  );
};

export default function StrategicClassification({ clientes }) {
  const chartData = clientes.map(c => ({
    cliente: c.nombre,
    ventas: c.ventas,
    margenPct: c.margenPct,
    numFacturas: c.numFacturas,
    clasificacion: c.clasificacion
  }));

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">
        Clasificación Estratégica
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
            tickFormatter={(val) => `${val.toFixed(0)}%`}
          />
          <ZAxis type="number" dataKey="numFacturas" range={[50, 400]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={chartData}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={strategyColors[entry.clasificacion]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
        {Object.entries(strategyColors).map(([name, color]) => {
          const count = clientes.filter(c => c.clasificacion === name).length;
          return (
            <div key={name} className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-[#3E4C59]">{name} ({count})</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-4 bg-[#F0F5F5] rounded-lg text-xs text-[#3E4C59]">
        <strong>Leyenda:</strong> Tamaño de burbuja = Frecuencia de compra (nº facturas)
      </div>
    </div>
  );
}