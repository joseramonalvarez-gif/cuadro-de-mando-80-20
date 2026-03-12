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
    const dataTypes = ['invoices_sale', 'invoices_purchase', 'contacts', 'treasuries'];
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
    
    // Calculate real KPIs from cached data
    const invoicesSale = realData.invoices_sale || [];
    const invoicesPurchase = realData.invoices_purchase || [];
    const contacts = realData.contacts || [];
    const treasuries = realData.treasuries || [];
    
    const totalVentas = invoicesSale.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalCompras = invoicesPurchase.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const margenBruto = totalVentas - totalCompras;
    const margenBrutoPercent = totalVentas > 0 ? (margenBruto / totalVentas) * 100 : 0;
    
    const clientesActivos = contacts.filter(c => c.type === 'client' || c.clientRecord).length;
    const saldoTesoreria = treasuries.reduce((sum, t) => sum + (t.balance || 0), 0);
    
    return {
      kpis: {
        ventas: { value: totalVentas, trend: 0, status: 'green' },
        margen_bruto: { value: margenBrutoPercent, trend: 0, status: 'green' },
        clientes_activos: { value: clientesActivos, trend: 0, status: 'green' },
        tesoreria: { value: saldoTesoreria, trend: 0, status: 'green' },
      },
      ventasVsCompras: generateDemoData().ventasVsCompras,
      concentracionClientes: generateDemoData().concentracionClientes,
      previsionTesoreria: generateDemoData().previsionTesoreria,
      topClientes: generateDemoData().topClientes,
    };
  }, [isDemo, realData]);

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