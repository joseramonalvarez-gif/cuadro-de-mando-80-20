import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#B7CAC9] rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-[#1B2731] mb-2">{data.proyecto}</p>
      <p className="text-sm text-[#3E4C59]">
        Presupuestadas: {data.horasPresupuestadas}h
      </p>
      <p className="text-sm text-[#3E4C59]">
        Consumidas: {data.horasConsumidas}h
      </p>
      <p className={`text-sm font-semibold ${data.desviacion > 0 ? 'text-[#E05252]' : 'text-[#33A19A]'}`}>
        Desviación: {data.desviacion > 0 ? '+' : ''}{data.desviacion.toFixed(1)}%
      </p>
    </div>
  );
};

export default function ProjectDeviationChart({ proyectos }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">
        Desviación de Horas por Proyecto
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={proyectos}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" />
          <XAxis 
            dataKey="proyecto" 
            tick={{ fontSize: 11, fill: '#3E4C59' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#3E4C59' }}
            tickFormatter={(val) => `${val}h`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="horasPresupuestadas" 
            name="Presupuestadas"
            fill="#B7CAC9"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="horasConsumidas" 
            name="Consumidas"
            radius={[4, 4, 0, 0]}
          >
            {proyectos.map((entry, index) => (
              <Cell key={index} fill={entry.desviacion > 20 ? '#E05252' : '#33A19A'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {proyectos.filter(p => p.desviacion > 20).length > 0 && (
        <div className="mt-4 p-4 bg-[#FFE6E6] rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#E05252] mt-0.5" />
          <div className="text-sm text-[#3E4C59]">
            <strong className="text-[#E05252]">Alerta:</strong> {proyectos.filter(p => p.desviacion > 20).length} proyectos 
            con desviación superior al 20%
          </div>
        </div>
      )}
    </div>
  );
}