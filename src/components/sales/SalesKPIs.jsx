import React from 'react';
import { TrendingUp, TrendingDown, Users, ShoppingCart, Package, Clock, DollarSign } from 'lucide-react';
import KpiCard from '../shared/KpiCard';

export default function SalesKPIs({ kpis, modeloNegocio }) {
  const formatCurrency = (val) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  
  const formatPercent = (val) => 
    new Intl.NumberFormat('es-ES', { style: 'percent', minimumFractionDigits: 1 }).format(val / 100);

  const baseKPIs = [
    {
      label: 'Ventas Brutas',
      value: formatCurrency(kpis.ventasBrutas || 0),
      icon: ShoppingCart,
      status: 'primary'
    },
    {
      label: 'Ventas Netas',
      value: formatCurrency(kpis.ventasNetas || 0),
      icon: DollarSign,
      status: 'success',
      trend: kpis.crecimientoYoY,
      trendLabel: 'vs año anterior'
    },
    {
      label: 'Ticket Medio',
      value: formatCurrency(kpis.ticketMedio || 0),
      icon: ShoppingCart,
      status: 'neutral'
    },
    {
      label: 'Clientes Activos',
      value: kpis.clientesActivos || 0,
      subtitle: `${kpis.clientesNuevos || 0} nuevos`,
      icon: Users,
      status: kpis.clientesPerdidos > 0 ? 'warning' : 'success',
      trend: kpis.clientesPerdidos,
      trendLabel: 'perdidos'
    }
  ];

  let specificKPIs = [];
  
  if (modeloNegocio === 'productos') {
    specificKPIs = [
      {
        label: 'Unidades Vendidas',
        value: new Intl.NumberFormat('es-ES').format(kpis.unidadesVendidas || 0),
        icon: Package,
        status: 'primary'
      },
      {
        label: 'Desviación Precio',
        value: formatPercent(kpis.desviacionPrecio || 0),
        subtitle: 'vs PVP catálogo',
        icon: TrendingDown,
        status: Math.abs(kpis.desviacionPrecio || 0) > 10 ? 'warning' : 'success'
      }
    ];
  } else if (modeloNegocio === 'servicios') {
    specificKPIs = [
      {
        label: 'Horas Facturadas',
        value: new Intl.NumberFormat('es-ES').format(kpis.horasFacturadas || 0),
        icon: Clock,
        status: 'primary'
      },
      {
        label: 'Tarifa Media',
        value: formatCurrency(kpis.tarifaMedia || 0),
        subtitle: '€/hora',
        icon: DollarSign,
        status: 'success',
        trend: kpis.tendenciaTarifa
      },
      {
        label: 'MRR',
        value: formatCurrency(kpis.mrr || 0),
        subtitle: `ARR: ${formatCurrency((kpis.mrr || 0) * 12)}`,
        icon: TrendingUp,
        status: 'success'
      }
    ];
  } else {
    // Mixto: mostrar ambos
    specificKPIs = [
      {
        label: 'Unidades Vendidas',
        value: new Intl.NumberFormat('es-ES').format(kpis.unidadesVendidas || 0),
        icon: Package,
        status: 'primary'
      },
      {
        label: 'Horas Facturadas',
        value: new Intl.NumberFormat('es-ES').format(kpis.horasFacturadas || 0),
        icon: Clock,
        status: 'primary'
      },
      {
        label: 'MRR',
        value: formatCurrency(kpis.mrr || 0),
        icon: TrendingUp,
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