import React, { useMemo } from 'react';
import ModulePage from '../components/shared/ModulePage';
import DataTable from '../components/shared/DataTable';
import TopClientesChart from '../components/home/TopClientesChart';
import { formatCurrency, formatPercent, generateDemoData } from '../components/shared/DemoData';
import { DollarSign, Percent, Users, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";

const KPIS = [
  { key: 'ventas_netas', title: 'Ventas Netas', format: formatCurrency, icon: DollarSign },
  { key: 'margen_bruto', title: 'Margen Bruto', format: formatPercent, icon: Percent },
  { key: 'dso', title: 'DSO (Días Cobro)', format: (v) => `${v} días`, icon: Clock },
  { key: 'concentracion_top5', title: 'Concentración Top 5', format: formatPercent, icon: Users },
];

const DEMO_INVOICES = [
  { num: 'FV-2026-0142', client: 'Grupo Empresarial ABC', date: '07/03/2026', amount: 18500, status: 'Cobrada' },
  { num: 'FV-2026-0141', client: 'Tecnología Ibérica SL', date: '05/03/2026', amount: 12300, status: 'Pendiente' },
  { num: 'FV-2026-0140', client: 'Inversiones Mediterráneo', date: '03/03/2026', amount: 8750, status: 'Cobrada' },
  { num: 'FV-2026-0139', client: 'Consulting Partners SA', date: '01/03/2026', amount: 15200, status: 'Vencida' },
  { num: 'FV-2026-0138', client: 'Digital Solutions Spain', date: '28/02/2026', amount: 6800, status: 'Cobrada' },
  { num: 'FV-2026-0137', client: 'Grupo Empresarial ABC', date: '25/02/2026', amount: 22100, status: 'Cobrada' },
  { num: 'FV-2026-0136', client: 'MediaTech Pro SL', date: '22/02/2026', amount: 9400, status: 'Pendiente' },
];

const STATUS_COLORS = {
  Cobrada: 'bg-emerald-100 text-emerald-700',
  Pendiente: 'bg-amber-100 text-amber-700',
  Vencida: 'bg-red-100 text-red-700',
};

const COLUMNS = [
  { header: 'Nº Factura', key: 'num' },
  { header: 'Cliente', key: 'client' },
  { header: 'Fecha', key: 'date' },
  { header: 'Importe', align: 'right', render: (r) => formatCurrency(r.amount) },
  { header: 'Estado', render: (r) => (
    <Badge className={`${STATUS_COLORS[r.status]} text-xs font-medium`}>{r.status}</Badge>
  )},
];

export default function Sales() {
  const demoData = useMemo(() => generateDemoData(), []);

  return (
    <ModulePage title="Ventas / Clientes" subtitle="Análisis de facturación y cartera de clientes" kpiConfigs={KPIS}>
      {() => (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60">
              <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">Evolución Ventas Mensuales</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demoData.ventasVsCompras}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#3E4C59' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#B7CAC9' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip />
                    <Bar dataKey="ventas" name="Ventas" fill="#33A19A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <TopClientesChart data={demoData.topClientes} />
          </div>

          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-3">Últimas Facturas de Venta</h3>
          <DataTable columns={COLUMNS} data={DEMO_INVOICES} />
        </>
      )}
    </ModulePage>
  );
}