import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#B7CAC9] rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-[#1B2731] mb-2">{data.trimestre}</p>
      <p className="text-sm text-[#33A19A]">
        Repercutido: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.repercutido)}
      </p>
      <p className="text-sm text-[#E05252]">
        Soportado: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.soportado)}
      </p>
      <p className="text-sm text-[#1B2731] font-semibold mt-1">
        Saldo: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.saldo)}
      </p>
    </div>
  );
};

export default function QuarterlyEvolutionChart({ data }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">
        Evolución Trimestral IVA
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" />
          <XAxis 
            dataKey="trimestre" 
            tick={{ fontSize: 11, fill: '#3E4C59' }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#3E4C59' }}
            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k€`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="repercutido" 
            name="IVA Repercutido"
            fill="#33A19A"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="soportado" 
            name="IVA Soportado"
            fill="#E6A817"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="saldo" 
            name="Saldo Neto"
            fill="#3E4C59"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 p-4 bg-[#F0F5F5] rounded-lg">
        <p className="text-sm text-[#3E4C59]">
          <strong>Nota:</strong> El saldo positivo indica IVA a ingresar en Hacienda. 
          El saldo negativo indica IVA a compensar o devolver.
        </p>
      </div>
    </div>
  );
}