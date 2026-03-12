import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useApp } from '../components/shared/DemoContext';
import { generateDemoData } from '../components/shared/DemoData';
import DemoBanner from '../components/shared/DemoBanner';
import DateFilter from '../components/shared/DateFilter';
import LoadingState from '../components/shared/LoadingState';
import KpiGrid from '../components/home/KpiGrid';
import VentasComprasChart from '../components/home/VentasComprasChart';
import ConcentracionChart from '../components/home/ConcentracionChart';
import TresoreryChart from '../components/home/TresoreryChart.jsx';
import TopClientesChart from '../components/home/TopClientesChart';
import { 
  filtrarPorFechas, 
  calcularVentasNetas, 
  calcularMargenBruto,
  convertirAEUR 
} from '../components/shared/kpiCalculations';

export default function Home() {
  const { activeCompany, loading } = useApp();
  const [dateRange, setDateRange] = useState(null);
  const [realData, setRealData] = useState(null);

  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;
  
  useEffect(() => {
    if (!isDemo && activeCompany) {
      loadRealData();
    }
  }, [activeCompany, isDemo]);

  async function loadRealData() {
    const dataTypes = ['invoices_sale', 'invoices_purchase', 'contacts', 'treasuries', 'products', 'creditnotes'];
    const loaded = {};
    
    for (const type of dataTypes) {
      const cached = await base44.entities.CachedData.filter({
        company_id: activeCompany.id,
        data_type: type,
      });
      if (cached.length > 0 && cached[0].data?.items) {
        loaded[type] = cached[0].data.items;
      }
    }
    
    if (Object.keys(loaded).length > 0) {
      setRealData(loaded);
    }
  }

  const data = useMemo(() => {
    if (isDemo || !realData) {
      return generateDemoData();
    }
    
    // Filtrar datos por rango de fechas
    const invoicesSale = filtrarPorFechas(
      realData.invoices_sale || [], 
      dateRange, 
      'date'
    );
    const invoicesPurchase = filtrarPorFechas(
      realData.invoices_purchase || [], 
      dateRange,
      'date'
    );
    const contacts = realData.contacts || [];
    const treasuries = realData.treasuries || [];
    const products = realData.products || [];
    const creditNotes = realData.creditnotes || [];
    
    // Convertir facturas a líneas para cálculos
    const lineasVenta = invoicesSale.flatMap(inv => 
      (inv.products || []).map(line => ({
        ...line,
        facturaId: inv.id,
        clienteId: inv.contactId,
        fecha: inv.date,
        moneda: inv.currency || 'EUR',
        tipoCambio: inv.currencyChange || 1,
        estadoPago: inv.status,
        esDevolucion: false,
        importeNeto: line.subtotal || (line.units * line.price * (1 - (line.discount || 0) / 100)),
        itemId: line.productId
      }))
    );
    
    // Cálculos con conversión multidivisa
    const ventasNetas = calcularVentasNetas(lineasVenta, creditNotes);
    
    const totalCompras = invoicesPurchase.reduce((sum, inv) => 
      sum + convertirAEUR(inv.total || 0, inv.currency, inv.currencyChange), 0
    );
    
    const margenData = calcularMargenBruto(lineasVenta, products);
    
    const clientesActivos = contacts.filter(c => c.type === 'client' || c.clientRecord).length;
    const saldoTesoreria = treasuries.reduce((sum, t) => sum + (t.balance || 0), 0);
    
    return {
      kpis: {
        ventas_netas: { value: ventasNetas, trend: 0, status: 'green' },
        margen_bruto: { value: margenData.margenPct, trend: 0, status: margenData.margenPct > 25 ? 'green' : 'yellow' },
        clientes_activos: { value: clientesActivos, trend: 0, status: 'green' },
        caja_actual: { value: saldoTesoreria, trend: 0, status: 'green' },
      },
      ventasVsCompras: generateDemoData().ventasVsCompras,
      concentracionClientes: generateDemoData().concentracionClientes,
      previsionTesoreria: generateDemoData().previsionTesoreria,
      topClientes: generateDemoData().topClientes,
    };
  }, [isDemo, realData, dateRange]);

  if (loading) return <LoadingState />;

  return (
    <div className="max-w-[1600px] mx-auto">
      {isDemo && <DemoBanner />}

      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">Panel de Control</h2>
          <p className="text-xs text-[#3E4C59] mt-0.5">Resumen financiero y operativo</p>
        </div>
        <div className="flex items-center gap-2">
          <DateFilter onDateChange={setDateRange} />
        </div>
      </div>

      {/* KPI Grid */}
      <KpiGrid kpis={data.kpis} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <VentasComprasChart data={data.ventasVsCompras} />
        <ConcentracionChart data={data.concentracionClientes} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <TresoreryChart data={data.previsionTesoreria} />
        <TopClientesChart data={data.topClientes} />
      </div>
    </div>
  );
}