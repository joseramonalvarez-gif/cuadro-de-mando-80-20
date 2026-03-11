import React, { useMemo } from 'react';
import ModulePage from '../components/shared/ModulePage';
import TresoreryChart from '../components/home/TresoreryChart';
import DataTable from '../components/shared/DataTable';
import { formatCurrency, generateDemoData } from '../components/shared/DemoData';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Eye } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const KPIS = [
  { key: 'caja_actual', title: 'Caja Actual', format: formatCurrency, icon: Wallet },
  { key: 'cash_in', title: 'Cash-in Mes', format: formatCurrency, icon: ArrowDownCircle },
  { key: 'cash_out', title: 'Cash-out Mes', format: formatCurrency, icon: ArrowUpCircle },
  { key: 'prevision_30d', title: 'Previsión 30d', format: formatCurrency, icon: Eye },
];

const DEMO_MOVEMENTS = [
  { date: '07/03/2026', concept: 'Cobro FV-2026-0142', type: 'Entrada', amount: 18500, balance: 175280 },
  { date: '06/03/2026', concept: 'Pago FC-2026-087', type: 'Salida', amount: -12400, balance: 156780 },
  { date: '05/03/2026', concept: 'Cobro FV-2026-0140', type: 'Entrada', amount: 8750, balance: 169180 },
  { date: '04/03/2026', concept: 'Nóminas Febrero', type: 'Salida', amount: -32500, balance: 160430 },
  { date: '03/03/2026', concept: 'Cobro FV-2026-0138', type: 'Entrada', amount: 6800, balance: 192930 },
];

const COLUMNS = [
  { header: 'Fecha', key: 'date' },
  { header: 'Concepto', key: 'concept' },
  { header: 'Tipo', render: (r) => (
    <Badge className={`${r.type === 'Entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} text-xs font-medium`}>
      {r.type}
    </Badge>
  )},
  { header: 'Importe', align: 'right', render: (r) => (
    <span className={r.amount >= 0 ? 'text-emerald-600' : 'text-[#E05252]'}>{formatCurrency(r.amount)}</span>
  )},
  { header: 'Saldo', align: 'right', render: (r) => formatCurrency(r.balance) },
];

export default function Treasury() {
  const demoData = useMemo(() => generateDemoData(), []);

  return (
    <ModulePage title="Tesorería" subtitle="Control de caja, flujos y previsiones" kpiConfigs={KPIS}>
      {() => (
        <>
          <div className="mb-6">
            <TresoreryChart data={demoData.previsionTesoreria} />
          </div>
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-3">Últimos Movimientos</h3>
          <DataTable columns={COLUMNS} data={DEMO_MOVEMENTS} />
        </>
      )}
    </ModulePage>
  );
}