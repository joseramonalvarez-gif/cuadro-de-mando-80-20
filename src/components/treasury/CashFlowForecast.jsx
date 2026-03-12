import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#B7CAC9] rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-[#1B2731] mb-2">{data.semana}</p>
      <p className="text-sm text-[#33A19A]">
        Entradas: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.entradas)}
      </p>
      <p className="text-sm text-[#E05252]">
        Salidas: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.salidas)}
      </p>
      <p className="text-sm text-[#1B2731] font-semibold mt-1">
        Saldo: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.saldoAcumulado)}
      </p>
    </div>
  );
};

export default function CashFlowForecast({ data }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">
        Previsión de Tesorería 90 días
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" />
          <XAxis 
            dataKey="semana" 
            tick={{ fontSize: 11, fill: '#3E4C59' }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#3E4C59' }}
            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k€`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="entradas" 
            name="Entradas Previstas"
            stroke="#33A19A" 
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="salidas" 
            name="Salidas Previstas"
            stroke="#E05252" 
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="saldoAcumulado" 
            name="Saldo Acumulado"
            stroke="#3E4C59" 
            strokeWidth={3}
            dot={{ r: 4 }}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 p-4 bg-[#F0F5F5] rounded-lg">
        <p className="text-sm text-[#3E4C59]">
          <strong>Nota:</strong> La previsión se basa en facturas pendientes de cobro y pago con vencimientos conocidos.
          El saldo acumulado parte del saldo actual de caja.
        </p>
      </div>
    </div>
  );
}