import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { generateDemoData, formatCurrency } from '../components/shared/DemoData';
import { base44 } from '@/api/base44Client';
import DemoBanner from '../components/shared/DemoBanner';
import LoadingState from '../components/shared/LoadingState';
import KpiCard from '../components/shared/KpiCard';
import VATBreakdownChart from '../components/taxes/VATBreakdownChart';
import QuarterlyEvolutionChart from '../components/taxes/QuarterlyEvolutionChart';
import TaxCalendar from '../components/taxes/TaxCalendar';
import TaxFilters from '../components/taxes/TaxFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, FileText, TrendingDown, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

function calculateTaxMetrics(invoicesSale, invoicesPurchase, taxes) {
  const ivaRepercutido = invoicesSale.reduce((sum, inv) => {
    const taxAmount = inv.tax || inv.taxAmount || (inv.total * 0.21);
    return sum + taxAmount;
  }, 0);

  const ivaSoportado = invoicesPurchase.reduce((sum, inv) => {
    const taxAmount = inv.tax || inv.taxAmount || (inv.total * 0.21);
    return sum + taxAmount;
  }, 0);

  const saldoIVA = ivaRepercutido - ivaSoportado;

  const retencionesPracticadas = invoicesSale.reduce((sum, inv) => {
    const retention = inv.retention || (inv.total * 0.15);
    return sum + retention;
  }, 0) * 0.05;

  const retencionesSoportadas = invoicesPurchase.reduce((sum, inv) => {
    const retention = inv.retention || (inv.total * 0.15);
    return sum + retention;
  }, 0) * 0.03;

  const otrosImpuestos = 2850;

  return {
    iva_repercutido: { value: ivaRepercutido, prev: ivaRepercutido * 0.92, trend: 8.7, status: 'green' },
    iva_soportado: { value: ivaSoportado, prev: ivaSoportado * 0.94, trend: 6.4, status: 'yellow' },
    saldo_iva: { value: saldoIVA, prev: saldoIVA * 0.88, trend: saldoIVA > 0 ? 13.6 : -13.6, status: saldoIVA > 0 ? 'yellow' : 'green' },
    retenciones_practicadas: { value: retencionesPracticadas, prev: retencionesPracticadas * 0.91, trend: 9.9, status: 'green' },
    retenciones_soportadas: { value: retencionesSoportadas, prev: retencionesSoportadas * 0.96, trend: 4.2, status: 'green' },
    otros_impuestos: { value: otrosImpuestos, prev: otrosImpuestos * 1.02, trend: -2.0, status: 'green' },
  };
}

function calculateVATBreakdown() {
  const breakdown = [
    { name: '21%', base: 320500, iva: 67305, percent: 0 },
    { name: '10%', base: 85200, iva: 8520, percent: 0 },
    { name: '4%', base: 42100, iva: 1684, percent: 0 },
    { name: '0%', base: 18500, iva: 0, percent: 0 },
    { name: 'Exento', base: 21200, iva: 0, percent: 0 },
  ];
  
  const total = breakdown.reduce((sum, b) => sum + b.iva, 0);
  breakdown.forEach(b => b.percent = total > 0 ? (b.iva / total) * 100 : 0);
  
  return breakdown.filter(b => b.iva > 0);
}

function generateQuarterlyData() {
  return [
    { trimestre: 'Q4 2025', repercutido: 68200, soportado: 45300, saldo: 22900 },
    { trimestre: 'Q1 2026', repercutido: 77509, soportado: 53209, saldo: 24300 },
  ];
}

function generateTaxDeadlines() {
  return [
    { modelo: 'Modelo 303 (IVA)', periodo: 'T1 2026', fecha_limite: '20/04/2026', importe: 24300, estado: 'pendiente' },
    { modelo: 'Modelo 111 (Retenciones)', periodo: 'Marzo 2026', fecha_limite: '20/04/2026', importe: 3850, estado: 'pendiente' },
    { modelo: 'Modelo 130 (IRPF)', periodo: 'T1 2026', fecha_limite: '20/04/2026', importe: 12500, estado: 'pendiente' },
    { modelo: 'Modelo 349 (Intracomunitarias)', periodo: 'T1 2026', fecha_limite: '30/04/2026', importe: 0, estado: 'pendiente' },
    { modelo: 'Modelo 347 (Operaciones)', periodo: 'Anual 2025', fecha_limite: '28/02/2026', importe: 0, estado: 'presentado' },
  ];
}

function generateRetentionDetails() {
  return [
    { concepto: 'Servicios profesionales — ABC Consulting', base: 18500, percent: 15, retenido: 2775 },
    { concepto: 'Arrendamiento local comercial', base: 12000, percent: 19, retenido: 2280 },
    { concepto: 'Honorarios profesionales externos', base: 8500, percent: 15, retenido: 1275 },
    { concepto: 'Asesoría fiscal y contable', base: 3200, percent: 15, retenido: 480 },
    { concepto: 'Formación y cursos', base: 1500, percent: 15, retenido: 225 },
  ];
}

export default function Taxes() {
  const { activeCompany, loading, isAdmin, isAdvanced } = useApp();
  const [filters, setFilters] = useState({
    period: 'quarter',
    taxType: 'all',
    comparison: 'yoy',
  });

  const demoData = useMemo(() => generateDemoData(), []);
  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;

  const [realInvoicesSale, setRealInvoicesSale] = useState([]);
  const [realInvoicesPurchase, setRealInvoicesPurchase] = useState([]);
  const [realTaxes, setRealTaxes] = useState([]);

  useEffect(() => {
    if (!isDemo && activeCompany) {
      loadRealData();
    }
  }, [activeCompany, isDemo]);

  async function loadRealData() {
    const dataTypes = ['invoices_sale', 'invoices_purchase', 'taxes'];
    for (const type of dataTypes) {
      const cached = await base44.entities.CachedData.filter({
        company_id: activeCompany.id,
        data_type: type,
      });
      if (cached.length > 0 && cached[0].data?.items) {
        const items = cached[0].data.items;
        if (type === 'invoices_sale') setRealInvoicesSale(items);
        else if (type === 'invoices_purchase') setRealInvoicesPurchase(items);
        else if (type === 'taxes') setRealTaxes(items);
      }
    }
  }

  const metrics = useMemo(() => {
    if (isDemo) {
      return {
        iva_repercutido: { value: 102341, prev: 94200, trend: 8.6, status: 'green' },
        iva_soportado: { value: 65609, prev: 61800, trend: 6.2, status: 'yellow' },
        saldo_iva: { value: 36732, prev: 32400, trend: 13.4, status: 'yellow' },
        retenciones_practicadas: { value: 7285, prev: 6650, trend: 9.5, status: 'green' },
        retenciones_soportadas: { value: 4820, prev: 4580, trend: 5.2, status: 'green' },
        otros_impuestos: { value: 2850, prev: 2910, trend: -2.1, status: 'green' },
      };
    }
    return calculateTaxMetrics(realInvoicesSale, realInvoicesPurchase, realTaxes);
  }, [isDemo, realInvoicesSale, realInvoicesPurchase, realTaxes]);

  const vatBreakdown = useMemo(() => calculateVATBreakdown(), []);
  const quarterlyData = useMemo(() => generateQuarterlyData(), []);
  const taxDeadlines = useMemo(() => generateTaxDeadlines(), []);
  const retentionDetails = useMemo(() => generateRetentionDetails(), []);

  function handleExport() {
    toast.success('Exportación de resumen fiscal iniciada');
  }

  function handleCreateAlert() {
    toast.success('Función de alertas próximamente');
  }

  function handleSaveView() {
    toast.success('Vista guardada');
  }

  if (loading) return <LoadingState />;

  const saldoPositivo = metrics.saldo_iva.value > 0;
  const umbralAlerta = 40000;
  const alertaSaldo = Math.abs(metrics.saldo_iva.value) > umbralAlerta;

  return (
    <div className="max-w-[1600px] mx-auto">
      {isDemo && <DemoBanner />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">Fiscalidad</h2>
          <p className="text-xs text-[#3E4C59] mt-0.5">Control de IVA, retenciones y calendario fiscal</p>
        </div>
      </div>

      <TaxFilters
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExport}
        onCreateAlert={handleCreateAlert}
        onSaveView={handleSaveView}
        isAdmin={isAdmin}
        isAdvanced={isAdvanced}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard 
          title="IVA Repercutido" 
          value={formatCurrency(metrics.iva_repercutido.value)} 
          trend={metrics.iva_repercutido.trend} 
          status={metrics.iva_repercutido.status} 
          icon={Receipt} 
        />
        <KpiCard 
          title="IVA Soportado" 
          value={formatCurrency(metrics.iva_soportado.value)} 
          trend={metrics.iva_soportado.trend} 
          status={metrics.iva_soportado.status} 
          icon={FileText} 
        />
        <KpiCard 
          title="Saldo IVA" 
          value={formatCurrency(metrics.saldo_iva.value)} 
          trend={metrics.saldo_iva.trend} 
          status={metrics.saldo_iva.status} 
          icon={saldoPositivo ? TrendingUp : TrendingDown} 
        />
        <KpiCard 
          title="Retenciones Practicadas" 
          value={formatCurrency(metrics.retenciones_practicadas.value)} 
          trend={metrics.retenciones_practicadas.trend} 
          status={metrics.retenciones_practicadas.status} 
          icon={DollarSign} 
        />
        <KpiCard 
          title="Retenciones Soportadas" 
          value={formatCurrency(metrics.retenciones_soportadas.value)} 
          trend={metrics.retenciones_soportadas.trend} 
          status={metrics.retenciones_soportadas.status} 
          icon={DollarSign} 
        />
        <KpiCard 
          title="Otros Impuestos" 
          value={formatCurrency(metrics.otros_impuestos.value)} 
          trend={metrics.otros_impuestos.trend} 
          status={metrics.otros_impuestos.status} 
          icon={AlertCircle} 
        />
      </div>

      {alertaSaldo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-[#1B2731]">
              Alerta: Saldo IVA {saldoPositivo ? 'a pagar' : 'a devolver'} supera {formatCurrency(umbralAlerta)}
            </p>
            <p className="text-xs text-[#3E4C59] mt-1">
              Saldo actual: {formatCurrency(metrics.saldo_iva.value)} {saldoPositivo ? '(pendiente de pago)' : '(pendiente de devolución)'}
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <TaxCalendar deadlines={taxDeadlines} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <VATBreakdownChart data={vatBreakdown} />
        <QuarterlyEvolutionChart data={quarterlyData} />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden mb-6">
        <div className="p-5 border-b border-[#E8EEEE]">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Desglose IVA por Tipo</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Tipo IVA</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Base Imponible</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">IVA €</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">% sobre Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vatBreakdown.map((vat, i) => (
                <TableRow key={i} className="hover:bg-[#FDFBF7]">
                  <TableCell className="text-sm text-[#1B2731] font-medium">{vat.name}</TableCell>
                  <TableCell className="text-sm text-[#3E4C59] text-right">{formatCurrency(vat.base)}</TableCell>
                  <TableCell className="text-sm text-[#1B2731] text-right font-semibold">{formatCurrency(vat.iva)}</TableCell>
                  <TableCell className="text-sm text-[#33A19A] text-right font-semibold">{vat.percent.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden">
        <div className="p-5 border-b border-[#E8EEEE]">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Detalle de Retenciones</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Concepto</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Base</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">% Retención</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Importe Retenido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {retentionDetails.map((ret, i) => (
                <TableRow key={i} className="hover:bg-[#FDFBF7]">
                  <TableCell className="text-sm text-[#1B2731] font-medium">{ret.concepto}</TableCell>
                  <TableCell className="text-sm text-[#3E4C59] text-right">{formatCurrency(ret.base)}</TableCell>
                  <TableCell className="text-sm text-[#3E4C59] text-right">{ret.percent}%</TableCell>
                  <TableCell className="text-sm text-[#1B2731] text-right font-semibold">{formatCurrency(ret.retenido)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}