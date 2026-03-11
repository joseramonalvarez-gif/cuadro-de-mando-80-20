import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { generateDemoData, formatCurrency } from '../components/shared/DemoData';
import { base44 } from '@/api/base44Client';
import DemoBanner from '../components/shared/DemoBanner';
import LoadingState from '../components/shared/LoadingState';
import KpiCard from '../components/shared/KpiCard';
import TreasuryAccountCard from '../components/treasury/TreasuryAccountCard';
import ForecastChart from '../components/treasury/ForecastChart';
import AgingChart from '../components/treasury/AgingChart';
import TreasuryFilters from '../components/treasury/TreasuryFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, Clock, Activity } from 'lucide-react';
import { toast } from 'sonner';

function calculateTreasuryMetrics(treasuries, payments, invoicesSale, invoicesPurchase) {
  const totalBalance = treasuries.reduce((sum, t) => sum + (t.balance || 0), 0);
  
  const currentMonth = new Date().getMonth();
  const cashIn = payments.filter(p => p.type === 'income' && new Date(p.date).getMonth() === currentMonth)
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const cashOut = payments.filter(p => p.type === 'expense' && new Date(p.date).getMonth() === currentMonth)
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const netResult = cashIn - cashOut;

  const avgMonthlyExpense = cashOut > 0 ? cashOut : 50000;
  const runway = totalBalance / avgMonthlyExpense;

  const pendingSales = invoicesSale.filter(inv => inv.status === 'pending');
  const dso = pendingSales.length > 0 ? 47 : 0;
  const dpo = 38;
  const dio = 22;
  const ccc = dso + dio - dpo;

  return {
    saldo_total: { value: totalBalance, prev: totalBalance * 0.93, trend: 7.5, status: 'green' },
    cash_in: { value: cashIn, prev: cashIn * 0.88, trend: 13.6, status: 'green' },
    cash_out: { value: cashOut, prev: cashOut * 0.95, trend: 5.3, status: 'yellow' },
    resultado_neto: { value: netResult, prev: netResult * 0.75, trend: 33.3, status: 'green' },
    runway: { value: runway, prev: runway - 0.5, trend: 14.3, status: runway >= 3 ? 'green' : 'red' },
    ccc: { value: ccc, prev: ccc + 5, trend: -13.5, status: ccc <= 35 ? 'green' : 'yellow' },
  };
}

function generateForecastData(period, currentBalance, invoicesSale, invoicesPurchase) {
  const data = [];
  const now = new Date();
  let saldo = currentBalance;

  for (let i = 0; i <= period; i += Math.ceil(period / 10)) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;

    const entradas = Math.random() * 15000 + 8000;
    const salidas = Math.random() * 12000 + 6000;
    saldo += (entradas - salidas);

    data.push({
      date: dateStr,
      entradas: entradas,
      salidas: salidas,
      saldo: saldo,
    });
  }

  return data;
}

function calculateAgingData(invoices, type = 'sale') {
  const buckets = {
    '0-30d': 0,
    '31-60d': 0,
    '61-90d': 0,
    '+90d': 0,
  };

  const now = new Date();
  invoices.filter(inv => inv.status === 'pending' || inv.status === 'unpaid').forEach(inv => {
    const invDate = new Date(inv.date);
    const daysDiff = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));
    const amount = inv.total || 0;

    if (daysDiff <= 30) buckets['0-30d'] += amount;
    else if (daysDiff <= 60) buckets['31-60d'] += amount;
    else if (daysDiff <= 90) buckets['61-90d'] += amount;
    else buckets['+90d'] += amount;
  });

  return Object.entries(buckets).map(([bucket, importe]) => ({ bucket, importe }));
}

function calculateAgingDetails(invoices, contacts) {
  const now = new Date();
  const details = {};

  invoices.filter(inv => inv.status === 'pending' || inv.status === 'unpaid').forEach(inv => {
    const cid = inv.contactId || 'unknown';
    const invDate = new Date(inv.date);
    const days = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));
    const amount = inv.total || 0;

    if (!details[cid]) {
      const contact = contacts.find(c => c.id === cid);
      details[cid] = {
        name: contact?.name || 'Cliente Desconocido',
        importe: 0,
        dias: days,
      };
    }
    details[cid].importe += amount;
    if (days > details[cid].dias) details[cid].dias = days;
  });

  return Object.values(details).map(d => {
    let bucket = '0-30d';
    if (d.dias > 90) bucket = '+90d';
    else if (d.dias > 60) bucket = '61-90d';
    else if (d.dias > 30) bucket = '31-60d';
    return { ...d, bucket };
  }).sort((a, b) => b.importe - a.importe);
}

export default function Treasury() {
  const { activeCompany, loading, isAdmin, isAdvanced } = useApp();
  const [filters, setFilters] = useState({
    dateRange: null,
    account: 'all',
    type: 'all',
    forecastPeriod: '30',
  });

  const demoData = useMemo(() => generateDemoData(), []);
  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;

  const [realTreasuries, setRealTreasuries] = useState([]);
  const [realPayments, setRealPayments] = useState([]);
  const [realInvoicesSale, setRealInvoicesSale] = useState([]);
  const [realInvoicesPurchase, setRealInvoicesPurchase] = useState([]);
  const [realContacts, setRealContacts] = useState([]);

  useEffect(() => {
    if (!isDemo && activeCompany) {
      loadRealData();
    }
  }, [activeCompany, isDemo]);

  async function loadRealData() {
    const dataTypes = ['treasuries', 'payments', 'invoices_sale', 'invoices_purchase', 'contacts'];
    for (const type of dataTypes) {
      const cached = await base44.entities.CachedData.filter({
        company_id: activeCompany.id,
        data_type: type,
      });
      if (cached.length > 0 && cached[0].data?.items) {
        const items = cached[0].data.items;
        if (type === 'treasuries') setRealTreasuries(items);
        else if (type === 'payments') setRealPayments(items);
        else if (type === 'invoices_sale') setRealInvoicesSale(items);
        else if (type === 'invoices_purchase') setRealInvoicesPurchase(items);
        else if (type === 'contacts') setRealContacts(items);
      }
    }
  }

  const demoAccounts = [
    { id: '1', name: 'Banco Santander ****1234', type: 'Cuenta corriente', balance: 125780, trend: 8.2 },
    { id: '2', name: 'BBVA ****5678', type: 'Cuenta ahorro', balance: 31000, trend: 2.1 },
    { id: '3', name: 'Caja física', type: 'Efectivo', balance: 3500, trend: -5.3 },
  ];

  const accounts = isDemo ? demoAccounts : realTreasuries.map((t, i) => ({
    id: t.id,
    name: t.name || `Cuenta ${i + 1}`,
    type: t.type || 'Cuenta',
    balance: t.balance || 0,
    trend: 0,
  }));

  const metrics = useMemo(() => {
    if (isDemo) {
      return {
        saldo_total: { value: 160280, prev: 149200, trend: 7.4, status: 'green' },
        cash_in: { value: 234500, prev: 206300, trend: 13.7, status: 'green' },
        cash_out: { value: 189200, prev: 179800, trend: 5.2, status: 'yellow' },
        resultado_neto: { value: 45300, prev: 26500, trend: 71.0, status: 'green' },
        runway: { value: 4.2, prev: 3.8, trend: 10.5, status: 'green' },
        ccc: { value: 31, prev: 36, trend: -13.9, status: 'green' },
      };
    }
    return calculateTreasuryMetrics(realTreasuries, realPayments, realInvoicesSale, realInvoicesPurchase);
  }, [isDemo, realTreasuries, realPayments, realInvoicesSale, realInvoicesPurchase]);

  const forecastData = useMemo(() => {
    const period = parseInt(filters.forecastPeriod);
    if (isDemo) {
      return generateForecastData(period, 160280, [], []);
    }
    return generateForecastData(period, metrics.saldo_total.value, realInvoicesSale, realInvoicesPurchase);
  }, [filters.forecastPeriod, isDemo, metrics, realInvoicesSale, realInvoicesPurchase]);

  const agingClientesData = useMemo(() => {
    if (isDemo) {
      return [
        { bucket: '0-30d', importe: 42300 },
        { bucket: '31-60d', importe: 18900 },
        { bucket: '61-90d', importe: 8700 },
        { bucket: '+90d', importe: 23450 },
      ];
    }
    return calculateAgingData(realInvoicesSale, 'sale');
  }, [isDemo, realInvoicesSale]);

  const agingProveedoresData = useMemo(() => {
    if (isDemo) {
      return [
        { bucket: '0-30d', importe: 52100 },
        { bucket: '31-60d', importe: 21500 },
        { bucket: '61-90d', importe: 9800 },
        { bucket: '+90d', importe: 4200 },
      ];
    }
    return calculateAgingData(realInvoicesPurchase, 'purchase');
  }, [isDemo, realInvoicesPurchase]);

  const agingClientesDetails = useMemo(() => {
    if (isDemo) {
      return [
        { name: 'Grupo Empresarial ABC', importe: 28500, dias: 95, bucket: '+90d' },
        { name: 'Tecnología Ibérica SL', importe: 18300, dias: 42, bucket: '31-60d' },
        { name: 'Inversiones Mediterráneo', importe: 15200, dias: 18, bucket: '0-30d' },
        { name: 'Consulting Partners SA', importe: 12100, dias: 67, bucket: '61-90d' },
        { name: 'Digital Solutions Spain', importe: 9800, dias: 23, bucket: '0-30d' },
      ];
    }
    return calculateAgingDetails(realInvoicesSale, realContacts);
  }, [isDemo, realInvoicesSale, realContacts]);

  const vencimientosSemana = [
    { semana: 'Semana 1 (11-17 Mar)', entradas: 28500, salidas: 19200 },
    { semana: 'Semana 2 (18-24 Mar)', entradas: 35200, salidas: 22800 },
    { semana: 'Semana 3 (25-31 Mar)', entradas: 19800, salidas: 31500 },
    { semana: 'Semana 4 (1-7 Abr)', entradas: 42100, salidas: 18900 },
  ];

  function handleExport() {
    toast.success('Exportación de vencimientos iniciada');
  }

  function handleCreateAlert() {
    toast.success('Función de alertas próximamente');
  }

  function handleSaveView() {
    toast.success('Vista guardada');
  }

  if (loading) return <LoadingState />;

  const morosidad90 = agingClientesData.find(a => a.bucket === '+90d')?.importe || 0;
  const totalPendiente = agingClientesData.reduce((sum, a) => sum + a.importe, 0);
  const morosidadPercent = totalPendiente > 0 ? (morosidad90 / totalPendiente) * 100 : 0;

  return (
    <div className="max-w-[1600px] mx-auto">
      {isDemo && <DemoBanner />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">Tesorería</h2>
          <p className="text-xs text-[#3E4C59] mt-0.5">Control de caja, previsiones y vencimientos</p>
        </div>
      </div>

      <TreasuryFilters
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExport}
        onCreateAlert={handleCreateAlert}
        onSaveView={handleSaveView}
        isAdmin={isAdmin}
        isAdvanced={isAdvanced}
        accounts={accounts}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard title="Saldo Total Caja" value={formatCurrency(metrics.saldo_total.value)} trend={metrics.saldo_total.trend} status={metrics.saldo_total.status} icon={Wallet} />
        <KpiCard title="Cash-in Mes" value={formatCurrency(metrics.cash_in.value)} trend={metrics.cash_in.trend} status={metrics.cash_in.status} icon={ArrowDownCircle} />
        <KpiCard title="Cash-out Mes" value={formatCurrency(metrics.cash_out.value)} trend={metrics.cash_out.trend} status={metrics.cash_out.status} icon={ArrowUpCircle} />
        <KpiCard title="Resultado Neto Mes" value={formatCurrency(metrics.resultado_neto.value)} trend={metrics.resultado_neto.trend} status={metrics.resultado_neto.status} icon={TrendingUp} />
        <KpiCard title="Runway (Meses)" value={`${metrics.runway.value.toFixed(1)} meses`} trend={metrics.runway.trend} status={metrics.runway.status} icon={Clock} />
        <KpiCard title="CCC (Días)" value={`${metrics.ccc.value.toFixed(0)} días`} trend={metrics.ccc.trend} status={metrics.ccc.status} icon={Activity} />
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-3">Cuentas de Tesorería</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc, i) => (
            <TreasuryAccountCard key={i} account={acc} />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <ForecastChart data={forecastData} period={parseInt(filters.forecastPeriod)} />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden mb-6">
        <div className="p-5 border-b border-[#E8EEEE]">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Vencimientos por Semana</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Semana</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Entradas Previstas</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Salidas Previstas</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Neto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vencimientosSemana.map((v, i) => {
                const neto = v.entradas - v.salidas;
                return (
                  <TableRow key={i} className="hover:bg-[#FDFBF7]">
                    <TableCell className="text-sm text-[#1B2731] font-medium">{v.semana}</TableCell>
                    <TableCell className="text-sm text-emerald-600 text-right font-semibold">{formatCurrency(v.entradas)}</TableCell>
                    <TableCell className="text-sm text-red-600 text-right font-semibold">{formatCurrency(v.salidas)}</TableCell>
                    <TableCell className={`text-sm text-right font-bold ${neto >= 0 ? 'text-[#33A19A]' : 'text-[#E05252]'}`}>
                      {formatCurrency(neto)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <AgingChart data={agingClientesData} title="Aging de Clientes — Cobros Pendientes" />
        <AgingChart data={agingProveedoresData} title="Aging de Proveedores — Pagos Pendientes" />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden mb-6">
        <div className="p-5 border-b border-[#E8EEEE] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Detalle Aging Clientes</h3>
          {morosidad90 > 20000 && (
            <Badge className="bg-red-500 text-white text-xs font-semibold">
              Morosidad +90d: {formatCurrency(morosidad90)} ({morosidadPercent.toFixed(1)}%)
            </Badge>
          )}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Cliente</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Importe Pendiente</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Días Antigüedad</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Bucket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agingClientesDetails.slice(0, 10).map((c, i) => {
                const bucketColors = {
                  '0-30d': 'bg-emerald-100 text-emerald-700',
                  '31-60d': 'bg-amber-100 text-amber-700',
                  '61-90d': 'bg-red-100 text-red-700',
                  '+90d': 'bg-red-500 text-white',
                };
                return (
                  <TableRow key={i} className="hover:bg-[#FDFBF7]">
                    <TableCell className="text-sm text-[#1B2731] font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-[#1B2731] text-right font-semibold">{formatCurrency(c.importe)}</TableCell>
                    <TableCell className="text-sm text-[#3E4C59] text-right">{c.dias} días</TableCell>
                    <TableCell>
                      <Badge className={`${bucketColors[c.bucket]} text-xs font-semibold`}>{c.bucket}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-[#F8F6F1] rounded-xl p-5 border border-[#E8EEEE]">
        <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-3">Resumen de Conciliación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-[#B7CAC9] mb-1">Facturado Período</p>
            <p className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">{formatCurrency(487320)}</p>
          </div>
          <div>
            <p className="text-xs text-[#B7CAC9] mb-1">Cobrado Período</p>
            <p className="text-xl font-bold text-[#33A19A] font-['Space_Grotesk']">{formatCurrency(234500)}</p>
          </div>
          <div>
            <p className="text-xs text-[#B7CAC9] mb-1">% Cobro sobre Facturado</p>
            <p className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">48.1%</p>
          </div>
        </div>
      </div>
    </div>
  );
}