import React, { useState, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import LoadingState from '../components/shared/LoadingState';
import DemoBanner from '../components/shared/DemoBanner';
import ProductParetoChart from '../components/products/ProductParetoChart';
import ProductMixChart from '../components/products/ProductMixChart';
import ProductFilters from '../components/products/ProductFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function Products() {
  const { activeCompany, loading: contextLoading } = useApp();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    periodo: 'mes',
    claseABC: 'all',
    stock: 'all'
  });
  
  const [productosABC, setProductosABC] = useState([]);
  const [mixData, setMixData] = useState([]);

  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;
  const modeloNegocio = activeCompany?.modelo_negocio || 'mixto';

  useEffect(() => {
    if (!contextLoading && activeCompany) {
      loadProductsData();
    }
  }, [activeCompany, contextLoading, filters.periodo]);

  async function loadProductsData() {
    setLoading(true);
    
    if (isDemo) {
      setProductosABC(generateDemoProductos());
      setMixData(generateDemoMix());
      setLoading(false);
      return;
    }

    try {
      const [lineasVenta, productos] = await Promise.all([
        base44.entities.LineasVenta.filter({ company_id: activeCompany.id }),
        base44.entities.Productos.filter({ company_id: activeCompany.id })
      ]);

      const analisisABC = calculateABCAnalisis(lineasVenta, productos);
      setProductosABC(analisisABC);

      const mix = calculateProductMix(lineasVenta, productos);
      setMixData(mix);

    } catch (error) {
      console.error('Error loading products data:', error);
    }
    
    setLoading(false);
  }

  function calculateABCAnalisis(lineas, productos) {
    const ventasPorItem = {};
    const margenPorItem = {};

    lineas.forEach(linea => {
      const itemId = linea.itemId;
      if (!ventasPorItem[itemId]) {
        ventasPorItem[itemId] = 0;
        margenPorItem[itemId] = 0;
      }
      ventasPorItem[itemId] += linea.importeNeto || 0;
      margenPorItem[itemId] += linea.margenBruto || 0;
    });

    const totalVentas = Object.values(ventasPorItem).reduce((sum, v) => sum + v, 0);
    const totalMargen = Object.values(margenPorItem).reduce((sum, m) => sum + m, 0);

    // ABC por ventas
    let itemsVentas = Object.entries(ventasPorItem).map(([itemId, ventas]) => ({
      itemId,
      item: productos.find(p => p.productoId === itemId)?.nombre || itemId,
      ventas,
      margen: margenPorItem[itemId] || 0,
      pctTotal: (ventas / totalVentas) * 100
    })).sort((a, b) => b.ventas - a.ventas);

    let acumVentas = 0;
    itemsVentas = itemsVentas.map(item => {
      acumVentas += item.pctTotal;
      return {
        ...item,
        pctAcumulado: acumVentas,
        claseVentas: acumVentas <= 80 ? 'A' : acumVentas <= 95 ? 'B' : 'C'
      };
    });

    // ABC por margen
    let itemsMargen = itemsVentas.slice().sort((a, b) => b.margen - a.margen);
    let acumMargen = 0;
    itemsMargen = itemsMargen.map(item => {
      const pctMargen = (item.margen / totalMargen) * 100;
      acumMargen += pctMargen;
      return {
        ...item,
        claseMargen: acumMargen <= 80 ? 'A' : acumMargen <= 95 ? 'B' : 'C'
      };
    });

    // Combinar
    return itemsVentas.map(item => {
      const itemMargen = itemsMargen.find(m => m.itemId === item.itemId);
      return {
        ...item,
        claseMargen: itemMargen?.claseMargen || 'C'
      };
    });
  }

  function calculateProductMix(lineas, productos) {
    const itemsData = {};

    lineas.forEach(linea => {
      const itemId = linea.itemId;
      if (!itemsData[itemId]) {
        itemsData[itemId] = {
          ventas: 0,
          margen: 0,
          clientes: new Set()
        };
      }
      itemsData[itemId].ventas += linea.importeNeto || 0;
      itemsData[itemId].margen += linea.margenBruto || 0;
      itemsData[itemId].clientes.add(linea.clienteId);
    });

    const items = Object.entries(itemsData).map(([itemId, data]) => {
      const producto = productos.find(p => p.productoId === itemId);
      const margenPct = data.ventas > 0 ? (data.margen / data.ventas) * 100 : 0;
      
      // Determinar categoría
      const ventasAltas = data.ventas > 50000;
      const margenAlto = margenPct > 30;

      let categoria;
      if (ventasAltas && margenAlto) categoria = 'Estrella';
      else if (ventasAltas && !margenAlto) categoria = 'Gancho';
      else if (!ventasAltas && margenAlto) categoria = 'Potencial';
      else categoria = 'Revisar';

      return {
        itemId,
        item: producto?.nombre || itemId,
        ventas: data.ventas,
        margenPct,
        numClientes: data.clientes.size,
        categoria
      };
    });

    return items;
  }

  function generateDemoProductos() {
    const nombres = [
      'Producto Premium', 'Servicio Consultoría', 'Licencia Software', 'Producto Standard',
      'Servicio Mantenimiento', 'Producto Básico', 'Formación Online', 'Soporte Técnico'
    ];

    return nombres.map((nombre, idx) => {
      const ventas = 120000 * Math.pow(0.65, idx);
      const margen = ventas * (0.4 - idx * 0.03);
      const acumVentas = idx === 0 ? (ventas / 400000) * 100 : 0;
      
      return {
        itemId: `demo_${idx}`,
        item: nombre,
        ventas,
        margen,
        pctTotal: (ventas / 400000) * 100,
        pctAcumulado: acumVentas,
        claseVentas: idx < 3 ? 'A' : idx < 6 ? 'B' : 'C',
        claseMargen: idx < 2 ? 'A' : idx < 5 ? 'B' : 'C'
      };
    });
  }

  function generateDemoMix() {
    return [
      { item: 'Producto Premium', ventas: 120000, margenPct: 42, numClientes: 35, categoria: 'Estrella' },
      { item: 'Servicio Consultoría', ventas: 85000, margenPct: 38, numClientes: 28, categoria: 'Estrella' },
      { item: 'Licencia Software', ventas: 95000, margenPct: 22, numClientes: 45, categoria: 'Gancho' },
      { item: 'Formación Online', ventas: 25000, margenPct: 55, numClientes: 12, categoria: 'Potencial' },
      { item: 'Producto Básico', ventas: 18000, margenPct: 15, numClientes: 8, categoria: 'Revisar' }
    ];
  }

  if (contextLoading || loading) {
    return <LoadingState message="Cargando análisis de productos..." />;
  }

  return (
    <div className="space-y-6">
      {isDemo && <DemoBanner />}
      
      <ProductFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        modeloNegocio={modeloNegocio}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductParetoChart data={productosABC} tipo="ventas" topN={20} />
        <ProductParetoChart data={productosABC} tipo="margen" topN={20} />
      </div>

      <ProductMixChart data={mixData} />

      <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
        <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">
          Comparativa ABC: Ventas vs Margen
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto/Servicio</TableHead>
                <TableHead>Ventas €</TableHead>
                <TableHead>Margen €</TableHead>
                <TableHead>Clase Ventas</TableHead>
                <TableHead>Clase Margen</TableHead>
                <TableHead>Alerta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productosABC.slice(0, 20).map((prod, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium text-[#1B2731]">{prod.item}</TableCell>
                  <TableCell>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(prod.ventas)}</TableCell>
                  <TableCell>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(prod.margen)}</TableCell>
                  <TableCell>
                    <Badge className={prod.claseVentas === 'A' ? 'bg-[#E6F7F6] text-[#33A19A]' : prod.claseVentas === 'B' ? 'bg-[#FFF4E6] text-[#E6A817]' : 'bg-[#E8EEEE] text-[#3E4C59]'}>
                      {prod.claseVentas}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={prod.claseMargen === 'A' ? 'bg-[#E6F7F6] text-[#33A19A]' : prod.claseMargen === 'B' ? 'bg-[#FFF4E6] text-[#E6A817]' : 'bg-[#E8EEEE] text-[#3E4C59]'}>
                      {prod.claseMargen}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {prod.claseVentas === 'A' && prod.claseMargen === 'C' && (
                      <Badge className="bg-[#FFE6E6] text-[#E05252]">⚠️ Alto volumen, bajo margen</Badge>
                    )}
                    {prod.claseVentas === 'C' && prod.claseMargen === 'A' && (
                      <Badge className="bg-[#E6F4FF] text-[#3E8CDD]">💡 Potencial oculto</Badge>
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