import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { generateDemoData, formatCurrency } from '../components/shared/DemoData';
import { base44 } from '@/api/base44Client';
import DemoBanner from '../components/shared/DemoBanner';
import LoadingState from '../components/shared/LoadingState';
import KpiCard from '../components/shared/KpiCard';
import PurchaseParetoChart from '../components/purchases/PurchaseParetoChart';
import PriceEvolutionChart from '../components/purchases/PriceEvolutionChart';
import MarginChart from '../components/purchases/MarginChart';
import SupplierDetailModal from '../components/purchases/SupplierDetailModal';
import PurchaseFilters from '../components/purchases/PurchaseFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, FileText, CreditCard, Users, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { filtrarPorFechas, convertirAEUR } from '@/components/shared/kpiCalculations';

function calculatePurchaseMetrics(invoices, contacts) {
  const total = invoices.reduce((sum, inv) => 
    sum + convertirAEUR(inv.total || 0, inv.currency, inv.currencyChange), 0
  );
  const count = invoices.length;
  const avgTicket = count > 0 ? total / count : 0;
  
  const supplierIds = new Set(invoices.map(inv => inv.contactId));
  const activeSuppliers = supplierIds.size;

  const totalPaymentDays = invoices.reduce((sum, inv) => {
    const created = new Date(inv.date);
    const paid = inv.paidDate ? new Date(inv.paidDate) : new Date();
    const days = Math.floor((paid - created) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0);
  const dpo = count > 0 ? totalPaymentDays / count : 0;

  return {
    compras_totales: { value: total, prev: total * 0.92, trend: 8.7, status: 'yellow' },
    num_facturas: { value: count, prev: count - 3, trend: (3 / (count - 3)) * 100, status: 'green' },
    ticket_medio: { value: avgTicket, prev: avgTicket * 0.97, trend: 3.1, status: 'green' },
    proveedores_activos: { value: activeSuppliers, prev: activeSuppliers - 1, trend: (1 / (activeSuppliers - 1)) * 100, status: 'green' },
    dpo: { value: dpo, prev: dpo + 3, trend: -8.1, status: 'green' },
  };
}

function calculateParetoData(invoices, contacts) {
  const supplierPurchases = {};
  invoices
    .filter(inv => inv.contactId) // Solo facturas con proveedor asignado
    .forEach(inv => {
      const sid = inv.contactId;
      if (!supplierPurchases[sid]) supplierPurchases[sid] = 0;
      supplierPurchases[sid] += convertirAEUR(inv.total || 0, inv.currency, inv.currencyChange);
    });

  const sorted = Object.entries(supplierPurchases)
    .map(([id, purchases]) => {
      const contact = contacts.find(c => c.id === id);
      return { id, name: contact?.name || 'Proveedor Desconocido', compras: purchases };
    })
    .sort((a, b) => b.compras - a.compras);

  const totalPurchases = sorted.reduce((sum, s) => sum + s.compras, 0);
  let accum = 0;
  
  return sorted.map((s, i) => {
    accum += s.compras;
    const percent = (s.compras / totalPurchases) * 100;
    const acumulado = (accum / totalPurchases) * 100;
    let abc = 'C';
    if (acumulado <= 80) abc = 'A';
    else if (acumulado <= 95) abc = 'B';
    
    const highDependency = percent > 30;
    
    return {
      rank: i + 1,
      name: s.name.length > 20 ? s.name.substring(0, 20) + '...' : s.name,
      compras: s.compras,
      percent: percent,
      acumulado: acumulado,
      abc,
      highDependency,
      fullName: s.name,
      id: s.id,
    };
  });
}

function calculatePriceEvolution() {
  const months = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];
  return months.map((m, i) => ({
    month: m,
    precio_medio: [52.3, 53.1, 54.8, 53.2, 55.6, 56.1][i],
  }));
}

function calculateMarginData(paretoData) {
  return paretoData.slice(0, 5).map((p, i) => ({
    name: p.name,
    compras: p.compras,
    ventas: p.compras * [1.45, 1.38, 1.52, 1.41, 1.35][i],
    margen_bruto: p.compras * [0.45, 0.38, 0.52, 0.41, 0.35][i],
    margen_percent: [45, 38, 52, 41, 35][i],
  }));
}

export default function Purchases() {
  const { activeCompany, loading, isAdmin, isAdvanced } = useApp();
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: null,
    abcSegment: 'all',
    family: 'all',
    topN: 'all',
  });

  const demoData = useMemo(() => generateDemoData(), []);
  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;

  const [realInvoices, setRealInvoices] = useState([]);
  const [realContacts, setRealContacts] = useState([]);

  useEffect(() => {
    if (!isDemo && activeCompany) {
      loadRealData();
    }
  }, [activeCompany, isDemo]);

  async function loadRealData() {
    const cached = await base44.entities.CachedData.filter({
      company_id: activeCompany.id,
      data_type: 'invoices_purchase',
    });
    if (cached.length > 0 && cached[0].data?.items) {
      setRealInvoices(cached[0].data.items);
    }

    const cachedContacts = await base44.entities.CachedData.filter({
      company_id: activeCompany.id,
      data_type: 'contacts',
    });
    if (cachedContacts.length > 0 && cachedContacts[0].data?.items) {
      setRealContacts(cachedContacts[0].data.items);
    }
  }

  const metrics = useMemo(() => {
    if (isDemo) {
      return {
        compras_totales: { value: 312450, prev: 287100, trend: 8.8, status: 'yellow' },
        num_facturas: { value: 87, prev: 82, trend: 6.1, status: 'green' },
        ticket_medio: { value: 3592, prev: 3501, trend: 2.6, status: 'green' },
        proveedores_activos: { value: 23, prev: 22, trend: 4.5, status: 'green' },
        dpo: { value: 38, prev: 41, trend: -7.3, status: 'green' },
      };
    }
    const filtered = filtrarPorFechas(realInvoices, filters.dateRange, 'date');
    return calculatePurchaseMetrics(filtered, realContacts);
  }, [isDemo, realInvoices, realContacts, filters.dateRange]);

  const paretoData = useMemo(() => {
    if (isDemo) {
      const total = demoData.topProveedores.reduce((sum, p) => sum + p.value, 0);
      let accum = 0;
      return demoData.topProveedores.map((p, i) => {
        accum += p.value;
        const percent = (p.value / total) * 100;
        const acumulado = (accum / total) * 100;
        let abc = 'C';
        if (acumulado <= 80) abc = 'A';
        else if (acumulado <= 95) abc = 'B';
        const highDependency = percent > 30;
        return {
          rank: i + 1,
          name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
          compras: p.value,
          percent,
          acumulado,
          abc,
          highDependency,
          fullName: p.name,
          id: `demo_${i}`,
        };
      });
    }
    const filtered = filtrarPorFechas(realInvoices, filters.dateRange, 'date');
    return calculateParetoData(filtered, realContacts);
  }, [isDemo, realInvoices, realContacts, demoData, filters.dateRange]);

  const priceEvolution = useMemo(() => calculatePriceEvolution(), []);
  const marginData = useMemo(() => calculateMarginData(paretoData), [paretoData]);

  const filteredPareto = useMemo(() => {
    let data = [...paretoData];
    if (filters.abcSegment !== 'all') {
      data = data.filter(d => d.abc === filters.abcSegment);
    }
    if (filters.topN !== 'all') {
      const n = parseInt(filters.topN);
      data = data.slice(0, n);
    }
    return data;
  }, [paretoData, filters]);

  const priceEvolutionData = useMemo(() => {
    return [
      { producto: 'Material A', precio_actual: 52.3, precio_anterior: 48.5, variacion: 7.8 },
      { producto: 'Servicio B', precio_actual: 125.0, precio_anterior: 122.0, variacion: 2.5 },
      { producto: 'Tech Component C', precio_actual: 89.5, precio_anterior: 91.2, variacion: -1.9 },
      { producto: 'Logística Express', precio_actual: 15.8, precio_anterior: 14.2, variacion: 11.3 },
      { producto: 'Consultoría Pro', precio_actual: 180.0, precio_anterior: 175.0, variacion: 2.9 },
    ];
  }, []);

  function handleSupplierClick(supplier) {
    setSelectedSupplier(supplier);
    setModalOpen(true);
  }

  function handleExport() {
    toast.success('Exportación iniciada');
  }

  function handleCreateAlert() {
    toast.success('Función de alertas próximamente');
  }

  function handleSaveView() {
    toast.success('Vista guardada');
  }

  if (loading) return <LoadingState />;

  const top80Supplier = paretoData.find(s => s.acumulado >= 80);
  const top80Count = top80Supplier ? top80Supplier.rank : Math.ceil(paretoData.length * 0.2);

  const demoInvoices = [
    { num: 'FC-2026-0087', supplier: 'Suministros Globales SL', date: '06/03/2026', amount: 12400, status: 'Pagada' },
    { num: 'FC-2026-0086', supplier: 'Suministros Globales SL', date: '28/02/2026', amount: 8900, status: 'Pagada' },
    { num: 'FC-2026-0085', supplier: 'Suministros Globales SL', date: '15/02/2026', amount: 15600, status: 'Pendiente' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto">
      {isDemo && <DemoBanner />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">Compras / Proveedores</h2>
          <p className="text-xs text-[#3E4C59] mt-0.5">Análisis 80/20, evolución de precios y márgenes</p>
        </div>
      </div>

      <PurchaseFilters
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExport}
        onCreateAlert={handleCreateAlert}
        onSaveView={handleSaveView}
        isAdmin={isAdmin}
        isAdvanced={isAdvanced}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <KpiCard title="Compras Totales" value={formatCurrency(metrics.compras_totales.value)} trend={metrics.compras_totales.trend} status={metrics.compras_totales.status} icon={ShoppingBag} />
        <KpiCard title="Nº Facturas" value={metrics.num_facturas.value} trend={metrics.num_facturas.trend} status={metrics.num_facturas.status} icon={FileText} />
        <KpiCard title="Ticket Medio" value={formatCurrency(metrics.ticket_medio.value)} trend={metrics.ticket_medio.trend} status={metrics.ticket_medio.status} icon={CreditCard} />
        <KpiCard title="Proveedores Activos" value={metrics.proveedores_activos.value} trend={metrics.proveedores_activos.trend} status={metrics.proveedores_activos.status} icon={Users} />
        <KpiCard title="DPO (Días Pago)" value={`${metrics.dpo.value.toFixed(0)} días`} trend={metrics.dpo.trend} status={metrics.dpo.status} icon={Clock} />
      </div>

      <div className="bg-[#F8F6F1] rounded-xl p-4 mb-6 border border-[#E8EEEE]">
        <p className="text-sm text-[#1B2731]">
          <span className="font-semibold font-['Space_Grotesk']">Concentración de compras:</span> Los top <span className="font-bold text-[#E05252]">{top80Count}</span> proveedores concentran el <span className="font-bold text-[#E05252]">80%</span> de las compras
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <PurchaseParetoChart data={filteredPareto.slice(0, 10)} />
        <PriceEvolutionChart data={priceEvolution} selectedSupplier={selectedSupplier?.name} />
      </div>

      <div className="mb-6">
        <MarginChart data={marginData} />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden mb-6">
        <div className="p-5 border-b border-[#E8EEEE]">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Análisis ABC — Tabla de Proveedores</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">#</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Proveedor</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Compras €</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">% Total</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">% Acum.</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">ABC</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Alerta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPareto.slice(0, 20).map((s) => (
                <TableRow key={s.id} className="hover:bg-[#FDFBF7] cursor-pointer" onClick={() => handleSupplierClick({ name: s.fullName, id: s.id })}>
                  <TableCell className="text-sm text-[#B7CAC9]">{s.rank}</TableCell>
                  <TableCell className="text-sm text-[#1B2731] font-medium">{s.fullName}</TableCell>
                  <TableCell className="text-sm text-[#1B2731] text-right font-semibold">{formatCurrency(s.compras)}</TableCell>
                  <TableCell className="text-sm text-[#3E4C59] text-right">{s.percent.toFixed(1)}%</TableCell>
                  <TableCell className="text-sm text-[#3E4C59] text-right">{s.acumulado.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge className={`${s.abc === 'A' ? 'bg-red-100 text-red-700' : s.abc === 'B' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'} text-xs font-bold`}>
                      {s.abc}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {s.highDependency && (
                      <Badge className="bg-red-500 text-white text-xs font-semibold">Dependencia Alta</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden mb-6">
        <div className="p-5 border-b border-[#E8EEEE]">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Evolución de Precios — Comparativa</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Producto/Servicio</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Precio Actual</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Precio Anterior</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Variación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceEvolutionData.map((p, i) => (
                <TableRow key={i} className="hover:bg-[#FDFBF7]">
                  <TableCell className="text-sm text-[#1B2731] font-medium">{p.producto}</TableCell>
                  <TableCell className="text-sm text-[#1B2731] text-right font-semibold">{formatCurrency(p.precio_actual)}</TableCell>
                  <TableCell className="text-sm text-[#3E4C59] text-right">{formatCurrency(p.precio_anterior)}</TableCell>
                  <TableCell className="text-sm text-right">
                    <div className={`flex items-center justify-end gap-1 ${p.variacion >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {p.variacion >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-semibold">{p.variacion >= 0 ? '+' : ''}{p.variacion.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden">
        <div className="p-5 border-b border-[#E8EEEE]">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Análisis de Margen por Proveedor</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Proveedor</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Compras €</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Ventas Asociadas €</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Margen Bruto €</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Margen %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marginData.map((m, i) => (
                <TableRow key={i} className="hover:bg-[#FDFBF7]">
                  <TableCell className="text-sm text-[#1B2731] font-medium">{m.name}</TableCell>
                  <TableCell className="text-sm text-[#1B2731] text-right font-semibold">{formatCurrency(m.compras)}</TableCell>
                  <TableCell className="text-sm text-[#3E4C59] text-right">{formatCurrency(m.ventas)}</TableCell>
                  <TableCell className="text-sm text-[#33A19A] text-right font-semibold">{formatCurrency(m.margen_bruto)}</TableCell>
                  <TableCell className="text-sm text-right">
                    <Badge className={`${m.margen_percent >= 40 ? 'bg-emerald-100 text-emerald-700' : m.margen_percent >= 25 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'} text-xs font-bold`}>
                      {m.margen_percent.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <SupplierDetailModal
        supplier={selectedSupplier}
        invoices={demoInvoices}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}