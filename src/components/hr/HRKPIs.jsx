import React from 'react';
import { Users, TrendingUp, Clock, Euro, Activity } from 'lucide-react';
import KpiCard from '../shared/KpiCard';

export default function HRKPIs({ kpis, modeloNegocio }) {
  const formatCurrency = (val) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

  const getPctRRHHStatus = (pct) => {
    if (pct < 25) return 'success';
    if (pct < 35) return 'warning';
    return 'danger';
  };

  const getOcupacionStatus = (pct) => {
    if (pct > 75) return 'success';
    if (pct >= 60) return 'warning';
    return 'danger';
  };

  const baseKPIs = [
    {
      label: 'Coste Total RRHH',
      value: formatCurrency(kpis.costeRRHH || 0),
      icon: Euro,
      status: 'primary'
    },
    {
      label: '% RRHH sobre Ventas',
      value: `${(kpis.pctRRHHSobreVentas || 0).toFixed(1)}%`,
      subtitle: kpis.pctRRHHSobreVentas < 25 ? '🟢 Bajo' : kpis.pctRRHHSobreVentas < 35 ? '🟡 Medio' : '🔴 Alto',
      icon: TrendingUp,
      status: getPctRRHHStatus(kpis.pctRRHHSobreVentas)
    },
    {
      label: 'Productividad',
      value: formatCurrency(kpis.productividad || 0),
      subtitle: 'Ventas por empleado',
      icon: Activity,
      status: 'success'
    },
    {
      label: 'Empleados Activos',
      value: kpis.empleadosActivos || 0,
      icon: Users,
      status: 'neutral'
    }
  ];

  let specificKPIs = [];

  if (modeloNegocio === 'servicios' || modeloNegocio === 'mixto') {
    specificKPIs = [
      {
        label: 'Ocupación del Equipo',
        value: `${(kpis.ocupacionPct || 0).toFixed(1)}%`,
        subtitle: kpis.ocupacionPct > 75 ? '🟢 Óptima' : kpis.ocupacionPct >= 60 ? '🟡 Media' : '🔴 Baja',
        icon: Clock,
        status: getOcupacionStatus(kpis.ocupacionPct)
      },
      {
        label: 'Margen del Equipo',
        value: formatCurrency(kpis.margenEquipo || 0),
        icon: TrendingUp,
        status: kpis.margenEquipo > 0 ? 'success' : 'danger'
      },
      {
        label: 'Horas Facturables',
        value: Math.round(kpis.horasFacturables || 0),
        subtitle: `${((kpis.horasFacturables || 0) / (kpis.horasRegistradas || 1) * 100).toFixed(0)}% del total`,
        icon: Clock,
        status: 'success'
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