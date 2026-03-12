import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Calendar, Clock, AlertTriangle } from 'lucide-react';
import KpiCard from '../shared/KpiCard';

export default function TreasuryKPIs({ kpis, modeloNegocio }) {
  const formatCurrency = (val) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

  const getRunwayStatus = (months) => {
    if (months > 6) return 'success';
    if (months >= 3) return 'warning';
    return 'danger';
  };

  const getMorosidadStatus = (pct) => {
    if (pct < 1) return 'success';
    if (pct < 3) return 'warning';
    return 'danger';
  };

  const baseKPIs = [
    {
      label: 'Saldo Total Caja',
      value: formatCurrency(kpis.saldoTotal || 0),
      icon: Wallet,
      status: kpis.saldoTotal > 0 ? 'success' : 'danger'
    },
    {
      label: 'Cash-In',
      value: formatCurrency(kpis.cashIn || 0),
      subtitle: 'Cobros del período',
      icon: TrendingUp,
      status: 'success'
    },
    {
      label: 'Cash-Out',
      value: formatCurrency(kpis.cashOut || 0),
      subtitle: 'Pagos del período',
      icon: TrendingDown,
      status: 'primary'
    },
    {
      label: 'Resultado Neto',
      value: formatCurrency((kpis.cashIn || 0) - (kpis.cashOut || 0)),
      icon: TrendingUp,
      status: kpis.cashIn > kpis.cashOut ? 'success' : 'danger'
    },
    {
      label: 'DSO Global',
      value: `${Math.round(kpis.dsoGlobal || 0)} días`,
      subtitle: 'Días de cobro medio',
      icon: Calendar,
      status: kpis.dsoGlobal > 60 ? 'warning' : 'success'
    },
    {
      label: 'Runway',
      value: `${(kpis.runway || 0).toFixed(1)} meses`,
      subtitle: kpis.runway > 6 ? '🟢 Saludable' : kpis.runway >= 3 ? '🟡 Atención' : '🔴 Crítico',
      icon: Clock,
      status: getRunwayStatus(kpis.runway)
    },
    {
      label: 'CCC',
      value: `${Math.round(kpis.ccc || 0)} días`,
      subtitle: 'Ciclo conversión caja',
      icon: Calendar,
      status: kpis.ccc > 60 ? 'warning' : 'success'
    },
    {
      label: 'Morosidad +90d',
      value: formatCurrency(kpis.morosidad90 || 0),
      subtitle: `${(kpis.morosidadPct || 0).toFixed(1)}% ${
        kpis.morosidadPct < 1 ? '🟢' : kpis.morosidadPct < 3 ? '🟡' : '🔴'
      }`,
      icon: AlertTriangle,
      status: getMorosidadStatus(kpis.morosidadPct)
    }
  ];

  let specificKPIs = [];
  
  if (modeloNegocio === 'servicios' || modeloNegocio === 'mixto') {
    specificKPIs = [
      {
        label: 'MRR Cobrado',
        value: `${(kpis.mrrCobradoPuntual || 0).toFixed(1)}%`,
        subtitle: 'Puntualidad recurrentes',
        icon: TrendingUp,
        status: kpis.mrrCobradoPuntual > 90 ? 'success' : 'warning'
      }
    ];
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...baseKPIs, ...specificKPIs].map((kpi, idx) => (
        <KpiCard key={idx} {...kpi} />
      ))}
    </div>
  );
}