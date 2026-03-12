import React from 'react';
import { Calculator, TrendingUp, TrendingDown, AlertCircle, FileText } from 'lucide-react';
import KpiCard from '../shared/KpiCard';

export default function TaxKPIs({ kpis }) {
  const formatCurrency = (val) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

  const saldoIVA = (kpis.ivaRepercutido || 0) - (kpis.ivaSoportado || 0);
  const saldoPositivo = saldoIVA > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="IVA Repercutido"
        value={formatCurrency(kpis.ivaRepercutido || 0)}
        subtitle="Cobrado a clientes"
        icon={TrendingUp}
        status="primary"
      />
      
      <KpiCard
        label="IVA Soportado"
        value={formatCurrency(kpis.ivaSoportado || 0)}
        subtitle="Pagado a proveedores"
        icon={TrendingDown}
        status="neutral"
      />

      <KpiCard
        label="Saldo IVA"
        value={formatCurrency(Math.abs(saldoIVA))}
        subtitle={saldoPositivo ? '🔴 A ingresar' : '🟢 A devolver'}
        icon={Calculator}
        status={saldoPositivo ? 'danger' : 'success'}
      />

      <KpiCard
        label="Retenciones Practicadas"
        value={formatCurrency(kpis.retencionesPracticadas || 0)}
        subtitle="IRPF en facturas emitidas"
        icon={FileText}
        status="warning"
      />

      <KpiCard
        label="Retenciones Soportadas"
        value={formatCurrency(kpis.retencionesSoportadas || 0)}
        subtitle="IRPF en facturas recibidas"
        icon={FileText}
        status="neutral"
      />

      <KpiCard
        label="Modelo 303 Estimado"
        value={formatCurrency(Math.abs(saldoIVA))}
        subtitle={saldoPositivo ? 'A pagar' : 'A compensar'}
        icon={AlertCircle}
        status={saldoPositivo ? 'warning' : 'success'}
      />
    </div>
  );
}