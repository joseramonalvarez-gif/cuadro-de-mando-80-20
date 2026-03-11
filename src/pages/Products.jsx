import React from 'react';
import ModulePage from '../components/shared/ModulePage';
import DataTable from '../components/shared/DataTable';
import { formatCurrency, formatPercent } from '../components/shared/DemoData';
import { Package, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import KpiCard from '../components/shared/KpiCard';
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ABC_DATA = [
  { category: 'A', products: 12, revenue: 312400, pct: 68 },
  { category: 'B', products: 28, revenue: 104800, pct: 23 },
  { category: 'C', products: 65, revenue: 41200, pct: 9 },
];

const CHART_DATA = [
  { name: 'Categoría A', value: 68, fill: '#33A19A' },
  { name: 'Categoría B', value: 23, fill: '#5BB8B2' },
  { name: 'Categoría C', value: 9, fill: '#B7CAC9' },
];

const PRODUCTS = [
  { sku: 'PRD-001', name: 'Servicio Consultoría Premium', category: 'A', revenue: 89500, margin: 72.3, units: 15, stock: '—' },
  { sku: 'PRD-002', name: 'Desarrollo Software a Medida', category: 'A', revenue: 67200, margin: 65.1, units: 8, stock: '—' },
  { sku: 'PRD-003', name: 'Licencia Plataforma SaaS', category: 'A', revenue: 54800, margin: 88.5, units: 120, stock: '—' },
  { sku: 'PRD-004', name: 'Formación In-Company', category: 'B', revenue: 23100, margin: 58.2, units: 12, stock: '—' },
  { sku: 'PRD-005', name: 'Soporte Técnico Anual', category: 'B', revenue: 18400, margin: 45.7, units: 34, stock: '—' },
  { sku: 'PRD-006', name: 'Auditoría de Procesos', category: 'C', revenue: 8200, margin: 52.1, units: 4, stock: '—' },
];

const CAT_COLORS = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-amber-100 text-amber-700',
  C: 'bg-red-100 text-red-700',
};

const COLUMNS = [
  { header: 'SKU', key: 'sku' },
  { header: 'Producto / Servicio', key: 'name' },
  { header: 'ABC', render: (r) => <Badge className={`${CAT_COLORS[r.category]} text-xs font-bold`}>{r.category}</Badge> },
  { header: 'Facturación', align: 'right', render: (r) => formatCurrency(r.revenue) },
  { header: 'Margen', align: 'right', render: (r) => formatPercent(r.margin) },
  { header: 'Uds. Vendidas', align: 'right', key: 'units' },
];

export default function Products() {
  return (
    <ModulePage title="Producto / ABC" subtitle="Análisis de rentabilidad y clasificación ABC de productos">
      {() => (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard title="Productos Activos" value="105" trend={5.0} status="green" icon={Package} />
            <KpiCard title="Facturación Cat. A" value={formatCurrency(312400)} trend={12.3} status="green" icon={TrendingUp} />
            <KpiCard title="Margen Medio" value={formatPercent(63.7)} trend={3.2} status="green" icon={BarChart3} />
            <KpiCard title="Productos Sin Movimiento" value="8" trend={33.3} status="red" icon={AlertTriangle} />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 mb-6">
            <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">Distribución ABC — % Facturación</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CHART_DATA} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#B7CAC9' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#3E4C59' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                    {CHART_DATA.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-3">Catálogo de Productos</h3>
          <DataTable columns={COLUMNS} data={PRODUCTS} />
        </>
      )}
    </ModulePage>
  );
}