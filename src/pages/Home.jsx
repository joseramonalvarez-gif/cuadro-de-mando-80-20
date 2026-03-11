import React, { useState, useMemo } from 'react';
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

  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;
  const data = useMemo(() => generateDemoData(), []);

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