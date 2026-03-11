import React, { useState, useMemo } from 'react';
import { useApp } from './DemoContext';
import { generateDemoData } from './DemoData';
import DemoBanner from './DemoBanner';
import DateFilter from './DateFilter';
import LoadingState from './LoadingState';
import KpiCard from './KpiCard';

export default function ModulePage({ title, subtitle, kpiConfigs, children }) {
  const { activeCompany, loading } = useApp();
  const [dateRange, setDateRange] = useState(null);

  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;
  const demoData = useMemo(() => generateDemoData(), []);

  if (loading) return <LoadingState />;

  return (
    <div className="max-w-[1600px] mx-auto">
      {isDemo && <DemoBanner />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">{title}</h2>
          {subtitle && <p className="text-xs text-[#3E4C59] mt-0.5">{subtitle}</p>}
        </div>
        <DateFilter onDateChange={setDateRange} />
      </div>

      {kpiConfigs && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {kpiConfigs.map(kpi => {
            const data = demoData.kpis[kpi.key];
            if (!data) return null;
            return (
              <KpiCard
                key={kpi.key}
                title={kpi.title}
                value={kpi.format(data.value)}
                trend={data.trend}
                status={data.status}
                icon={kpi.icon}
              />
            );
          })}
        </div>
      )}

      {typeof children === 'function' ? children({ demoData, dateRange, isDemo }) : children}
    </div>
  );
}