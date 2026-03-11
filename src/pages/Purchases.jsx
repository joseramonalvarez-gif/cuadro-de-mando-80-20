import React, { useMemo } from 'react';
import ModulePage from '../components/shared/ModulePage';
import DataTable from '../components/shared/DataTable';
import TopClientesChart from '../components/home/TopClientesChart';
import { formatCurrency, formatPercent, generateDemoData } from '../components/shared/DemoData';
import { ShoppingCart, Percent, Timer, TrendingUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const KPIS = [
  { key: 'cash_out', title: 'Total Compras Mes', format: formatCurrency, icon: ShoppingCart },
  { key: 'compras_top1', title: 'Concentración Top 1 Proveedor', format: formatPercent, icon: TrendingUp },
  { key: 'compras_top5', title: 'Concentración Top 5 Proveedores', format: formatPercent, icon: Percent },
  { key: 'dpo', title: 'DPO (Días Pago)', format: (v) => `${v} días`, icon: Timer },
];

const DEMO_PURCHASES = [
  { num: 'FC-2026-087', vendor: 'Suministros Globales SL', date: '06/03/2026', amount: 12400, status: 'Pagada' },
  { num: 'FC-2026-086', vendor: 'Tech Components EU', date: '04/03/2026', amount: 8900, status: 'Pendiente' },
  { num: 'FC-2026-085', vendor: 'Servicios Profesionales SA', date: '02/03/2026', amount: 5600, status: 'Pagada' },
  { num: 'FC-2026-084', vendor: 'Logística Express', date: '28/02/2026', amount: 3200, status: 'Pendiente' },
  { num: 'FC-2026-083', vendor: 'Material Office Pro', date: '25/02/2026', amount: 2100, status: 'Pagada' },
];

const STATUS_COLORS = {
  Pagada: 'bg-emerald-100 text-emerald-700',
  Pendiente: 'bg-amber-100 text-amber-700',
};

const COLUMNS = [
  { header: 'Nº Factura', key: 'num' },
  { header: 'Proveedor', key: 'vendor' },
  { header: 'Fecha', key: 'date' },
  { header: 'Importe', align: 'right', render: (r) => formatCurrency(r.amount) },
  { header: 'Estado', render: (r) => (
    <Badge className={`${STATUS_COLORS[r.status]} text-xs font-medium`}>{r.status}</Badge>
  )},
];

export default function Purchases() {
  const demoData = useMemo(() => generateDemoData(), []);

  return (
    <ModulePage title="Compras / Proveedores" subtitle="Gestión de compras y análisis de proveedores" kpiConfigs={KPIS}>
      {() => (
        <>
          <div className="mb-6">
            <TopClientesChart data={demoData.topProveedores} title="Top 5 Proveedores — Volumen de Compra" />
          </div>
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-3">Últimas Facturas de Compra</h3>
          <DataTable columns={COLUMNS} data={DEMO_PURCHASES} />
        </>
      )}
    </ModulePage>
  );
}