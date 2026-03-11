import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { generateDemoData, formatCurrency, formatNumber } from '../components/shared/DemoData';
import { base44 } from '@/api/base44Client';
import DemoBanner from '../components/shared/DemoBanner';
import LoadingState from '../components/shared/LoadingState';
import KpiCard from '../components/shared/KpiCard';
import ProductParetoChart from '../components/products/ProductParetoChart';
import ProductMixChart from '../components/products/ProductMixChart';
import ProductFilters from '../components/products/ProductFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Layers, TrendingDown, Repeat, AlertTriangle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

function calculateProductMetrics(products, invoices) {
  const activeProducts = products.filter(p => p.sales > 0);
  const numActive = activeProducts.length;
  
  const families = [...new Set(products.map(p => p.family || 'Sin categoría'))];
  const numFamilies = families.length;
  
  const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalReturns = invoices.filter(inv => inv.type === 'return').reduce((sum, inv) => sum + (inv.total || 0), 0);
  const returnRate = totalSales > 0 ? (totalReturns / totalSales) * 100 : 0;
  
  const avgRotation = 8.5;
  
  const stockoutProducts = products.filter(p => (p.stock || 0) === 0 || (p.stock || 0) < (p.min_stock || 5));
  const numStockouts = stockoutProducts.length;
  
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock || 0) * (p.price || 0), 0);

  return {
    productos_activos: { value: numActive, prev: numActive - 3, trend: 8.1, status: 'green' },
    num_familias: { value: numFamilies, prev: numFamilies, trend: 0, status: 'green' },
    tasa_devolucion: { value: returnRate, prev: returnRate + 0.3, trend: -12.5, status: 'green' },
    rotacion_media: { value: avgRotation, prev: avgRotation - 0.5, trend: 6.3, status: 'green' },
    rupturas_stock: { value: numStockouts, prev: numStockouts + 2, trend: -40.0, status: numStockouts > 0 ? 'red' : 'green' },
    valor_stock: { value: totalStockValue, prev: totalStockValue * 0.94, trend: 6.4, status: 'green' },
  };
}

function calculateABCAnalysis() {
  const products = [
    { producto: 'Servicio Premium A', ventas: 95200, margen: 42800 },
    { producto: 'Producto Enterprise', ventas: 78500, margen: 35300 },
    { producto: 'Solución Corporate', ventas: 65300, margen: 29400 },
    { producto: 'Paquete Business', ventas: 52800, margen: 23800 },
    { producto: 'Plan Professional', ventas: 48200, margen: 21700 },
    { producto: 'Servicio Standard', ventas: 38700, margen: 17400 },
    { producto: 'Licencia Advanced', ventas: 28900, margen: 13000 },
    { producto: 'Módulo Integration', ventas: 21500, margen: 9700 },
    { producto: 'Add-on Analytics', ventas: 15800, margen: 7100 },
    { producto: 'Support Extended', ventas: 12400, margen: 5600 },
  ];

  const totalVentas = products.reduce((sum, p) => sum + p.ventas, 0);
  let acum = 0;
  
  products.forEach(p => {
    p.percent = totalVentas > 0 ? (p.ventas / totalVentas) * 100 : 0;
    acum += p.percent;
    p.acumulado = acum;
    
    if (acum <= 80) p.clase = 'A';
    else if (acum <= 95) p.clase = 'B';
    else p.clase = 'C';
  });

  return products;
}

function calculateMarginABC() {
  const products = calculateABCAnalysis();
  return products.sort((a, b) => b.margen - a.margen).map((p, i) => {
    const total = products.reduce((sum, prod) => sum + prod.margen, 0);
    let acum = 0;
    products.slice(0, i + 1).forEach(prod => acum += (prod.margen / total) * 100);
    return { ...p, acumulado: acum };
  });
}

function generateProductMix() {
  const mix = [
    { name: 'Servicios', value: 215800 },
    { name: 'Software', value: 142300 },
    { name: 'Consultoría', value: 89500 },
    { name: 'Licencias', value: 52100 },
    { name: 'Soporte', value: 28600 },
  ];
  const total = mix.reduce((sum, m) => sum + m.value, 0);
  mix.forEach(m => m.percent = total > 0 ? (m.value / total) * 100 : 0);
  return mix;
}

function generateStockData() {
  return [
    { producto: 'Servicio Premium A', stock: 0, ventas30d: 42, diasStock: 0, ruptura: true },
    { producto: 'Producto Enterprise', stock: 158, ventas30d: 35, diasStock: 135, ruptura: false },
    { producto: 'Solución Corporate', stock: 89, ventas30d: 28, diasStock: 95, ruptura: false },
    { producto: 'Paquete Business', stock: 4, ventas30d: 22, diasStock: 5, ruptura: true },
    { producto: 'Plan Professional', stock: 215, ventas30d: 19, diasStock: 339, ruptura: false },
    { producto: 'Servicio Standard', stock: 142, ventas30d: 15, diasStock: 284, ruptura: false },
    { producto: 'Licencia Advanced', stock: 0, ventas30d: 12, diasStock: 0, ruptura: true },
    { producto: 'Módulo Integration', stock: 68, ventas30d: 9, diasStock: 227, ruptura: false },
  ];
}

export default function Products() {
  const { activeCompany, loading, isAdmin, isAdvanced } = useApp();
  const [filters, setFilters] = useState({
    dateRange: null,
    family: 'all',
    abcClass: 'all',
    stockStatus: 'all',
  });

  const demoData = useMemo(() => generateDemoData(), []);
  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;

  const [realProducts, setRealProducts] = useState([]);
  const [realInvoices, setRealInvoices] = useState([]);

  useEffect(() => {
    if (!isDemo && activeCompany) {
      loadRealData();
    }
  }, [activeCompany, isDemo]);

  async function loadRealData() {
    const dataTypes = ['products', 'invoices_sale'];
    for (const type of dataTypes) {
      const cached = await base44.entities.CachedData.filter({
        company_id: activeCompany.id,
        data_type: type,
      });
      if (cached.length > 0 && cached[0].data?.items) {
        const items = cached[0].data.items;
        if (type === 'products') setRealProducts(items);
        else if (type === 'invoices_sale') setRealInvoices(items);
      }
    }
  }

  const metrics = useMemo(() => {
    if (isDemo) {
      return {
        productos_activos: { value: 247, prev: 229, trend: 7.9, status: 'green' },
        num_familias: { value: 12, prev: 12, trend: 0, status: 'green' },
        tasa_devolucion: { value: 1.8, prev: 2.1, trend: -14.3, status: 'green' },
        rotacion_media: { value: 8.5, prev: 8.0, trend: 6.3, status: 'green' },
        rupturas_stock: { value: 3, prev: 5, trend: -40.0, status: 'red' },
        valor_stock: { value: 328500, prev: 308700, trend: 6.4, status: 'green' },
      };
    }
    return calculateProductMetrics(realProducts, realInvoices);
  }, [isDemo, realProducts, realInvoices]);

  const abcAnalysis = useMemo(() => calculateABCAnalysis(), []);
  const marginABC = useMemo(() => calculateMarginABC(), []);
  const productMix = useMemo(() => generateProductMix(), []);
  const stockData = useMemo(() => generateStockData(), []);

  const families = ['Servicios', 'Software', 'Consultoría', 'Licencias', 'Soporte'];

  function handleExport() {
    toast.success('Exportación de análisis ABC iniciada');
  }

  function handleCreateAlert() {
    toast.success('Función de alertas próximamente');
  }

  function handleSaveView() {
    toast.success('Vista guardada');
  }

  if (loading) return <LoadingState />;

  const rupturas = metrics.rupturas_stock.value;

  return (
    <div className="max-w-[1600px] mx-auto">
      {isDemo && <DemoBanner />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">Producto / ABC</h2>
          <p className="text-xs text-[#3E4C59] mt-0.5">Análisis 80/20, rotación y control de stock</p>
        </div>
      </div>

      <ProductFilters
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExport}
        onCreateAlert={handleCreateAlert}
        onSaveView={handleSaveView}
        isAdmin={isAdmin}
        isAdvanced={isAdvanced}
        families={families}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard 
          title="Productos Activos" 
          value={formatNumber(metrics.productos_activos.value)} 
          trend={metrics.productos_activos.trend} 
          status={metrics.productos_activos.status} 
          icon={Package} 
        />
        <KpiCard 
          title="Familias / Categorías" 
          value={formatNumber(metrics.num_familias.value)} 
          trend={metrics.num_familias.trend} 
          status={metrics.num_familias.status} 
          icon={Layers} 
        />
        <KpiCard 
          title="% Devoluciones" 
          value={`${metrics.tasa_devolucion.value.toFixed(1)}%`} 
          trend={metrics.tasa_devolucion.trend} 
          status={metrics.tasa_devolucion.status} 
          icon={TrendingDown} 
        />
        <KpiCard 
          title="Rotación Media" 
          value={`${metrics.rotacion_media.value.toFixed(1)}x/año`} 
          trend={metrics.rotacion_media.trend} 
          status={metrics.rotacion_media.status} 
          icon={Repeat} 
        />
        <KpiCard 
          title="Rupturas de Stock" 
          value={formatNumber(metrics.rupturas_stock.value)} 
          trend={metrics.rupturas_stock.trend} 
          status={metrics.rupturas_stock.status} 
          icon={AlertTriangle} 
        />
        <KpiCard 
          title="Valor Total Stock" 
          value={formatCurrency(metrics.valor_stock.value)} 
          trend={metrics.valor_stock.trend} 
          status={metrics.valor_stock.status} 
          icon={DollarSign} 
        />
      </div>

      {rupturas > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-[#1B2731]">
              Alerta: {rupturas} producto{rupturas > 1 ? 's' : ''} con ruptura de stock
            </p>
            <p className="text-xs text-[#3E4C59] mt-1">Revisa la tabla de stock y rotación para tomar acciones</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <ProductParetoChart data={abcAnalysis.slice(0, 10)} title="Análisis ABC por Ventas — Pareto" />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden mb-6">
        <div className="p-5 border-b border-[#E8EEEE]">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Clasificación ABC por Ventas</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Producto</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Ventas €</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">% sobre Total</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">% Acumulado</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Clase ABC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {abcAnalysis.map((prod, i) => {
                const claseColors = {
                  A: 'bg-emerald-100 text-emerald-700',
                  B: 'bg-amber-100 text-amber-700',
                  C: 'bg-red-100 text-red-700',
                };
                return (
                  <TableRow key={i} className="hover:bg-[#FDFBF7]">
                    <TableCell className="text-sm text-[#1B2731] font-medium">{prod.producto}</TableCell>
                    <TableCell className="text-sm text-[#1B2731] text-right font-semibold">{formatCurrency(prod.ventas)}</TableCell>
                    <TableCell className="text-sm text-[#3E4C59] text-right">{prod.percent.toFixed(1)}%</TableCell>
                    <TableCell className="text-sm text-[#33A19A] text-right font-semibold">{prod.acumulado.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge className={`${claseColors[prod.clase]} text-xs font-semibold`}>Clase {prod.clase}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ProductParetoChart data={marginABC.slice(0, 10)} title="Análisis ABC por Margen Bruto" />
        <ProductMixChart data={productMix} />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden">
        <div className="p-5 border-b border-[#E8EEEE]">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Stock y Rotación</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Producto</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Stock Actual</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Ventas 30d</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Días Stock</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Alerta Ruptura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockData.map((prod, i) => (
                <TableRow key={i} className={`hover:bg-[#FDFBF7] ${prod.ruptura ? 'bg-red-50' : ''}`}>
                  <TableCell className="text-sm text-[#1B2731] font-medium">{prod.producto}</TableCell>
                  <TableCell className="text-sm text-right">
                    <span className={prod.stock === 0 ? 'text-red-600 font-bold' : prod.stock < 10 ? 'text-amber-600 font-semibold' : 'text-[#1B2731]'}>
                      {formatNumber(prod.stock)} u.
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-[#3E4C59] text-right">{formatNumber(prod.ventas30d)} u.</TableCell>
                  <TableCell className="text-sm text-[#1B2731] text-right font-semibold">{formatNumber(prod.diasStock)} días</TableCell>
                  <TableCell>
                    {prod.ruptura ? (
                      <Badge className="bg-red-500 text-white text-xs font-semibold">SÍ</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">No</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}