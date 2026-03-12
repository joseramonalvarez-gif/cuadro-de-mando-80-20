import React from 'react';
import { ShoppingBag, Users, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import KpiCard from '../shared/KpiCard';

export default function PurchasesKPIs({ kpis, modeloNegocio }) {
  const formatCurrency = (val) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  
  const formatPercent = (val) => 
    new Intl.NumberFormat('es-ES', { style: 'percent', minimumFractionDigits: 1 }).format(val / 100);

  const baseKPIs = [
    {
      label: 'Compras Totales',
      value: formatCurrency(kpis.comprasTotales || 0),
      icon: ShoppingBag,
      status: 'primary',
      trend: kpis.variacionCompras,
      trendLabel: 'vs año anterior'
    },
    {
      label: 'DPO Medio',
      value: `${Math.round(kpis.dpoMedio || 0)} días`,
      subtitle: 'Días de pago a proveedores',
      icon: Calendar,
      status: kpis.dpoMedio > 60 ? 'warning' : 'success'
    },
    {
      label: 'Proveedores Activos',
      value: kpis.proveedoresActivos || 0,
      icon: Users,
      status: 'neutral'
    },
    {
      label: 'Pendiente de Pago',
      value: formatCurrency(kpis.pendientePago || 0),
      icon: AlertTriangle,
      status: kpis.pendientePago > 50000 ? 'warning' : 'success'
    }
  ];

  let specificKPIs = [];
  
  if (modeloNegocio === 'servicios' || modeloNegocio === 'mixto') {
    const pctSubcontratacion = kpis.pctSubcontratacion || 0;
    let statusSubcontratacion = 'success';
    if (pctSubcontratacion > 35) statusSubcontratacion = 'danger';
    else if (pctSubcontratacion > 20) statusSubcontratacion = 'warning';

    specificKPIs = [
      {
        label: 'Coste Subcontratación',
        value: formatCurrency(kpis.costeSubcontratacion || 0),
        icon: Users,
        status: 'primary'
      },
      {
        label: '% Subcontratación',
        value: formatPercent(pctSubcontratacion),
        subtitle: pctSubcontratacion < 20 ? '🟢 Bajo' : pctSubcontratacion < 35 ? '🟡 Medio' : '🔴 Alto',
        icon: TrendingUp,
        status: statusSubcontratacion
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