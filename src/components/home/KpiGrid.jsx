import React from 'react';
import KpiCard from '../shared/KpiCard';
import { formatCurrency, formatPercent, formatNumber } from '../shared/DemoData';
import {
  DollarSign, Percent, Target, TrendingUp, Wallet,
  ArrowDownCircle, ArrowUpCircle, Eye, Clock, AlertTriangle,
  Timer, Users, ShoppingCart, Receipt
} from 'lucide-react';

export default function KpiGrid({ kpis }) {
  if (!kpis) return null;

  const cards = [
    { key: 'ventas_netas', title: 'Ventas Netas', format: formatCurrency, icon: DollarSign },
    { key: 'margen_bruto', title: 'Margen Bruto', format: formatPercent, icon: Percent },
    { key: 'ebitda', title: 'EBITDA', format: formatPercent, icon: Target },
    { key: 'punto_equilibrio', title: 'Punto de Equilibrio', format: formatCurrency, icon: TrendingUp },
    { key: 'opex_ventas', title: 'OPEX % s/ Ventas', format: formatPercent, icon: Receipt },
    { key: 'caja_actual', title: 'Caja Actual', format: formatCurrency, icon: Wallet },
    { key: 'cash_in', title: 'Cash-in Mes', format: formatCurrency, icon: ArrowDownCircle },
    { key: 'cash_out', title: 'Cash-out Mes', format: formatCurrency, icon: ArrowUpCircle },
    { key: 'prevision_30d', title: 'Previsión 30d', format: formatCurrency, icon: Eye },
    { key: 'dso', title: 'DSO (Días Cobro)', format: (v) => `${formatNumber(v)} días`, icon: Clock },
    { key: 'morosidad_90', title: 'Morosidad +90d', format: formatCurrency, icon: AlertTriangle },
    { key: 'dpo', title: 'DPO (Días Pago)', format: (v) => `${formatNumber(v)} días`, icon: Timer },
    { key: 'margen_top10', title: 'Margen Top 10 Clientes', format: formatPercent, icon: Users },
    { key: 'concentracion_top1', title: 'Concentración Top 1', format: formatPercent, icon: Users, subtitle: 'cliente' },
    { key: 'concentracion_top5', title: 'Concentración Top 5', format: formatPercent, icon: Users, subtitle: 'clientes' },
    { key: 'compras_top1', title: 'Compras Top 1 Proveedor', format: formatPercent, icon: ShoppingCart },
    { key: 'saldo_iva', title: 'Saldo IVA Estimado', format: formatCurrency, icon: Receipt },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {cards.map(card => {
        const data = kpis[card.key];
        if (!data) return null;
        return (
          <KpiCard
            key={card.key}
            title={card.title}
            value={card.format(data.value)}
            trend={data.trend}
            status={data.status}
            icon={card.icon}
            subtitle={card.subtitle}
          />
        );
      })}
    </div>
  );
}