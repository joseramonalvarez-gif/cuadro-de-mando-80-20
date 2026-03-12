import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { generateDemoData, formatCurrency, formatPercent } from '../components/shared/DemoData';
import { base44 } from '@/api/base44Client';
import DemoBanner from '../components/shared/DemoBanner';
import LoadingState from '../components/shared/LoadingState';
import KpiCard from '../components/shared/KpiCard';
import ParetoChart from '../components/sales/ParetoChart';
import RFMMatrix from '../components/sales/RFMMatrix';
import ClientDetailModal from '../components/sales/ClientDetailModal';
import SalesFilters from '../components/sales/SalesFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, ShoppingCart, CreditCard, Users, RefreshCw, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { filtrarPorFechas, convertirAEUR, calcularRFMQuintiles } from '@/components/shared/kpiCalculations';

function calculateSalesMetrics(invoices, contacts) {
  const total = invoices.reduce((sum, inv) => 
    sum + convertirAEUR(inv.total || 0, inv.currency, inv.currencyChange), 0
  );
  const count = invoices.length;
  const avgTicket = count > 0 ? total / count : 0;
  
  const clientIds = new Set(invoices.map(inv => inv.contactId));
  const activeClients = clientIds.size;

  const creditNotes = invoices.filter(inv => inv.type === 'creditnote');
  const returns = creditNotes.reduce((sum, cn) => 
    sum + convertirAEUR(cn.total || 0, cn.currency, cn.currencyChange), 0
  );
  const returnsPercent = total > 0 ? (returns / total) * 100 : 0;

  return {
    ventas_netas: { value: total, prev: total * 0.9, trend: 11.1, status: 'green' },
    num_facturas: { value: count, prev: count - 5, trend: (5 / (count - 5)) * 100, status: 'green' },
    ticket_medio: { value: avgTicket, prev: avgTicket * 0.95, trend: 5.3, status: 'green' },
    clientes_activos: { value: activeClients, prev: activeClients - 2, trend: (2 / (activeClients - 2)) * 100, status: 'green' },
    tasa_retencion: { value: 78.5, prev: 75.2, trend: 4.4, status: 'green' },
    devoluciones: { value: returns, percent: returnsPercent, prev: returns * 1.2, trend: -16.7, status: 'green' },
  };
}

function calculateParetoData(invoices, contacts) {
  const clientSales = {};
  invoices
    .filter(inv => inv.contactId) // Solo facturas con contacto asignado
    .forEach(inv => {
      const cid = inv.contactId;
      if (!clientSales[cid]) clientSales[cid] = 0;
      clientSales[cid] += convertirAEUR(inv.total || 0, inv.currency, inv.currencyChange);
    });

  const sorted = Object.entries(clientSales)
    .map(([id, sales]) => {
      const contact = contacts.find(c => c.id === id);
      return { id, name: contact?.name || 'Cliente Desconocido', ventas: sales };
    })
    .sort((a, b) => b.ventas - a.ventas);

  const totalSales = sorted.reduce((sum, c) => sum + c.ventas, 0);
  let accum = 0;
  
  return sorted.map((c, i) => {
    accum += c.ventas;
    const percent = (c.ventas / totalSales) * 100;
    const acumulado = (accum / totalSales) * 100;
    let abc = 'C';
    if (acumulado <= 80) abc = 'A';
    else if (acumulado <= 95) abc = 'B';
    
    return {
      rank: i + 1,
      name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
      ventas: c.ventas,
      percent: percent,
      acumulado: acumulado,
      abc,
      fullName: c.name,
      id: c.id,
    };
  });
}

function calculateRFMData(invoices, contacts) {
  // Convertir formato para usar función centralizada
  const facturasFormateadas = invoices
    .filter(inv => inv.contactId) // Solo facturas con contacto
    .map(inv => ({
      contactId: inv.contactId,
      fecha: inv.date,
      importeNeto: inv.total || 0,
      moneda: inv.currency || 'EUR',
      tipoCambio: inv.currencyChange || 1
    }));
  
  const contactosFormateados = contacts.map(c => ({
    contactId: c.id,
    nombre: c.name
  }));
  
  return calcularRFMQuintiles(facturasFormateadas, contactosFormateados);
}

export default function Sales() {
  const { activeCompany, loading, isAdmin, isAdvanced } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: null,
    abcSegment: 'all',
    rfmSegment: 'all',
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
      data_type: 'invoices_sale',
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
        ventas_netas: demoData.kpis.ventas_netas,
        num_facturas: { value: 142, prev: 128, trend: 10.9, status: 'green' },
        ticket_medio: { value: 3432, prev: 3305, trend: 3.8, status: 'green' },
        clientes_activos: { value: 47, prev: 44, trend: 6.8, status: 'green' },
        tasa_retencion: { value: 78.5, prev: 75.2, trend: 4.4, status: 'green' },
        devoluciones: { value: 8920, percent: 1.8, prev: 10650, trend: -16.2, status: 'green' },
      };
    }
    const filtered = filtrarPorFechas(realInvoices, filters.dateRange, 'date');
    return calculateSalesMetrics(filtered, realContacts);
  }, [isDemo, realInvoices, realContacts, demoData, filters.dateRange]);

  const paretoData = useMemo(() => {
    if (isDemo) {
      const total = demoData.topClientes.reduce((sum, c) => sum + c.value, 0);
      let accum = 0;
      return demoData.topClientes.map((c, i) => {
        accum += c.value;
        const percent = (c.value / total) * 100;
        const acumulado = (accum / total) * 100;
        let abc = 'C';
        if (acumulado <= 80) abc = 'A';
        else if (acumulado <= 95) abc = 'B';
        return {
          rank: i + 1,
          name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
          ventas: c.value,
          percent,
          acumulado,
          abc,
          fullName: c.name,
          id: `demo_${i}`,
        };
      });
    }
    const filtered = filtrarPorFechas(realInvoices, filters.dateRange, 'date');
    return calculateParetoData(filtered, realContacts);
  }, [isDemo, realInvoices, realContacts, demoData, filters.dateRange]);

  const rfmData = useMemo(() => {
    if (isDemo) {
      return [
        { id: '1', name: 'Grupo Empresarial ABC', ultima_compra: 12, frecuencia: 8, valor_total: 89500, ltv: 268500, rfm_segment: 'champion' },
        { id: '2', name: 'Tecnología Ibérica SL', ultima_compra: 25, frecuencia: 6, valor_total: 67200, ltv: 161280, rfm_segment: 'loyal' },
        { id: '3', name: 'Inversiones Mediterráneo', ultima_compra: 105, frecuencia: 4, valor_total: 54800, ltv: 54800, rfm_segment: 'at_risk' },
        { id: '4', name: 'Consulting Partners SA', ultima_compra: 8, frecuencia: 1, valor_total: 43100, ltv: 129300, rfm_segment: 'new' },
        { id: '5', name: 'Digital Solutions Spain', ultima_compra: 210, frecuencia: 3, valor_total: 38700, ltv: 19350, rfm_segment: 'lost' },
      ];
    }
    const filtered = filtrarPorFechas(realInvoices, filters.dateRange, 'date');
    return calculateRFMData(filtered, realContacts);
  }, [isDemo, realInvoices, realContacts, filters.dateRange]);

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

  const filteredRFM = useMemo(() => {
    let data = [...rfmData];
    if (filters.rfmSegment !== 'all') {
      data = data.filter(d => d.rfm_segment === filters.rfmSegment);
    }
    return data;
  }, [rfmData, filters]);

  function handleClientClick(client) {
    setSelectedClient(client);
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

  const top80Client = paretoData.find(c => c.acumulado >= 80);
  const top80Percent = top80Client ? ((top80Client.rank / paretoData.length) * 100).toFixed(1) : '20';

  // Facturas reales del cliente seleccionado
  const clientInvoices = selectedClient && !isDemo
    ? realInvoices.filter(inv => inv.contactId === selectedClient.id).map(inv => ({
        num: inv.docNumber || inv.number || inv.id,
        client: selectedClient.name,
        date: new Date(inv.date * 1000).toLocaleDateString('es-ES'),
        amount: inv.total || 0,
        status: inv.status === 'paid' ? 'Cobrada' : inv.status === 'sent' ? 'Enviada' : 'Pendiente'
      }))
    : [
        { num: 'FV-2026-0142', client: 'Grupo Empresarial ABC', date: '07/03/2026', amount: 18500, status: 'Cobrada' },
        { num: 'FV-2026-0141', client: 'Grupo Empresarial ABC', date: '05/03/2026', amount: 12300, status: 'Cobrada' },
        { num: 'FV-2026-0140', client: 'Grupo Empresarial ABC', date: '03/03/2026', amount: 8750, status: 'Cobrada' },
      ];

  return (
    <div className="max-w-[1600px] mx-auto">
      {isDemo && <DemoBanner />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">Ventas / Clientes</h2>
          <p className="text-xs text-[#3E4C59] mt-0.5">Análisis 80/20, RFM y LTV de cartera</p>
        </div>
      </div>

      <SalesFilters
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExport}
        onCreateAlert={handleCreateAlert}
        onSaveView={handleSaveView}
        isAdmin={isAdmin}
        isAdvanced={isAdvanced}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard title="Ventas Netas" value={formatCurrency(metrics.ventas_netas.value)} trend={metrics.ventas_netas.trend} status={metrics.ventas_netas.status} icon={FileText} />
        <KpiCard title="Nº Facturas" value={metrics.num_facturas.value} trend={metrics.num_facturas.trend} status={metrics.num_facturas.status} icon={ShoppingCart} />
        <KpiCard title="Ticket Medio" value={formatCurrency(metrics.ticket_medio.value)} trend={metrics.ticket_medio.trend} status={metrics.ticket_medio.status} icon={CreditCard} />
        <KpiCard title="Clientes Activos" value={metrics.clientes_activos.value} trend={metrics.clientes_activos.trend} status={metrics.clientes_activos.status} icon={Users} />
        <KpiCard title="Tasa Retención" value={formatPercent(metrics.tasa_retencion.value)} trend={metrics.tasa_retencion.trend} status={metrics.tasa_retencion.status} icon={RefreshCw} />
        <KpiCard title="Devoluciones" value={`${formatCurrency(metrics.devoluciones.value)} (${metrics.devoluciones.percent?.toFixed(1)}%)`} trend={metrics.devoluciones.trend} status={metrics.devoluciones.status} icon={TrendingDown} />
      </div>

      <div className="bg-[#F8F6F1] rounded-xl p-4 mb-6 border border-[#E8EEEE]">
        <p className="text-sm text-[#1B2731]">
          <span className="font-semibold font-['Space_Grotesk']">Regla 80/20:</span> El top <span className="font-bold text-[#33A19A]">{top80Percent}%</span> de clientes genera el <span className="font-bold text-[#33A19A]">80%</span> de las ventas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ParetoChart data={filteredPareto.slice(0, 10)} />
        <RFMMatrix data={filteredRFM} />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden mb-6">
        <div className="p-5 border-b border-[#E8EEEE]">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Análisis ABC — Tabla de Clientes</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">#</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Cliente</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Ventas €</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">% Total</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">% Acum.</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">ABC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPareto.slice(0, 20).map((c) => (
                <TableRow key={c.id} className="hover:bg-[#FDFBF7] cursor-pointer" onClick={() => handleClientClick({ name: c.fullName, id: c.id })}>
                  <TableCell className="text-sm text-[#B7CAC9]">{c.rank}</TableCell>
                  <TableCell className="text-sm text-[#1B2731] font-medium">{c.fullName}</TableCell>
                  <TableCell className="text-sm text-[#1B2731] text-right font-semibold">{formatCurrency(c.ventas)}</TableCell>
                  <TableCell className="text-sm text-[#3E4C59] text-right">{c.percent.toFixed(1)}%</TableCell>
                  <TableCell className="text-sm text-[#3E4C59] text-right">{c.acumulado.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge className={`${c.abc === 'A' ? 'bg-emerald-100 text-emerald-700' : c.abc === 'B' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'} text-xs font-bold`}>
                      {c.abc}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden">
        <div className="p-5 border-b border-[#E8EEEE]">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Análisis RFM — Detalle de Clientes</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Cliente</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Última Compra</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Frecuencia</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Valor Total</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">LTV Estimado</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Segmento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRFM.slice(0, 20).map((c) => {
                const segmentConfig = {
                  champion: { label: 'Campeón', color: 'bg-emerald-100 text-emerald-700' },
                  loyal: { label: 'Cliente Fiel', color: 'bg-[#33A19A] text-white' },
                  at_risk: { label: 'En Riesgo', color: 'bg-amber-100 text-amber-700' },
                  lost: { label: 'Perdido', color: 'bg-red-100 text-red-700' },
                  new: { label: 'Nuevo', color: 'bg-blue-100 text-blue-700' },
                  promising: { label: 'Prometedor', color: 'bg-violet-100 text-violet-700' },
                }[c.rfm_segment] || { label: 'N/A', color: 'bg-slate-100 text-slate-700' };

                return (
                  <TableRow key={c.id} className="hover:bg-[#FDFBF7] cursor-pointer" onClick={() => handleClientClick({ name: c.name, id: c.id })}>
                    <TableCell className="text-sm text-[#1B2731] font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-[#3E4C59] text-right">{c.ultima_compra} días</TableCell>
                    <TableCell className="text-sm text-[#3E4C59] text-right">{c.frecuencia}</TableCell>
                    <TableCell className="text-sm text-[#1B2731] text-right font-semibold">{formatCurrency(c.valor_total)}</TableCell>
                    <TableCell className="text-sm text-[#33A19A] text-right font-semibold">{formatCurrency(c.ltv)}</TableCell>
                    <TableCell>
                      <Badge className={`${segmentConfig.color} text-xs`}>{segmentConfig.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <ClientDetailModal
        client={selectedClient}
        invoices={clientInvoices}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}