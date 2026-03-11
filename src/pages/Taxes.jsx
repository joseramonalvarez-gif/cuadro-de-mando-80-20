import React from 'react';
import ModulePage from '../components/shared/ModulePage';
import DataTable from '../components/shared/DataTable';
import { formatCurrency } from '../components/shared/DemoData';
import { Receipt, FileText, Calculator, CalendarDays } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Badge } from "@/components/ui/badge";

const KPIS = [
  { key: 'saldo_iva', title: 'Saldo IVA Estimado', format: formatCurrency, icon: Receipt },
];

const IVA_DATA = [
  { name: 'IVA Repercutido', value: 48750, fill: '#33A19A' },
  { name: 'IVA Soportado', value: 36410, fill: '#B7CAC9' },
];

const OBLIGATIONS = [
  { model: 'Modelo 303', desc: 'IVA Trimestral', period: 'T1 2026', deadline: '20/04/2026', status: 'Pendiente', amount: -12340 },
  { model: 'Modelo 111', desc: 'Retenciones IRPF', period: 'T1 2026', deadline: '20/04/2026', status: 'Pendiente', amount: -4200 },
  { model: 'Modelo 115', desc: 'Retenciones Alquileres', period: 'T1 2026', deadline: '20/04/2026', status: 'Pendiente', amount: -1800 },
  { model: 'Modelo 303', desc: 'IVA Trimestral', period: 'T4 2025', deadline: '30/01/2026', status: 'Presentado', amount: -8900 },
  { model: 'Modelo 390', desc: 'Resumen Anual IVA', period: '2025', deadline: '30/01/2026', status: 'Presentado', amount: 0 },
];

const STATUS_COLORS = {
  Pendiente: 'bg-amber-100 text-amber-700',
  Presentado: 'bg-emerald-100 text-emerald-700',
};

const COLUMNS = [
  { header: 'Modelo', key: 'model' },
  { header: 'Descripción', key: 'desc' },
  { header: 'Período', key: 'period' },
  { header: 'Vencimiento', key: 'deadline' },
  { header: 'Estado', render: (r) => (
    <Badge className={`${STATUS_COLORS[r.status]} text-xs font-medium`}>{r.status}</Badge>
  )},
  { header: 'Importe', align: 'right', render: (r) => (
    <span className={r.amount < 0 ? 'text-[#E05252]' : 'text-[#1B2731]'}>{formatCurrency(r.amount)}</span>
  )},
];

export default function Taxes() {
  return (
    <ModulePage title="Fiscalidad" subtitle="Impuestos, modelos tributarios y saldo IVA" kpiConfigs={KPIS}>
      {() => (
        <>
          <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 mb-6">
            <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">Desglose IVA Trimestral</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={IVA_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                    {IVA_DATA.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-3">Obligaciones Tributarias</h3>
          <DataTable columns={COLUMNS} data={OBLIGATIONS} />
        </>
      )}
    </ModulePage>
  );
}