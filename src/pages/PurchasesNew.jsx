import React, { useState, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import LoadingState from '../components/shared/LoadingState';
import DemoBanner from '../components/shared/DemoBanner';
import PurchasesKPIs from '../components/purchases/PurchasesKPIs';
import ParetoProveedoresChart from '../components/purchases/ParetoProveedoresChart';
import PriceEvolutionChart from '../components/purchases/PriceEvolutionChart';
import AgingProveedoresTable from '../components/purchases/AgingProveedoresTable';
import PurchasesFilters from '../components/purchases/PurchasesFilters';

export default function PurchasesNew() {
  const { activeCompany, loading: contextLoading } = useApp();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    periodo: 'mes',
    comparativa: 'anterior',
    claseABC: 'all',
    tipoGasto: 'all',
    topN: 20
  });
  
  const [kpis, setKpis] = useState({});
  const [proveedoresABC, setProveedoresABC] = useState([]);
  const [priceEvolution, setPriceEvolution] = useState([]);
  const [agingFacturas, setAgingFacturas] = useState([]);
  const [selectedProveedor, setSelectedProveedor] = useState(null);

  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;
  const modeloNegocio = activeCompany?.modelo_negocio || 'mixto';

  useEffect(() => {
    if (!contextLoading && activeCompany) {
      loadPurchasesData();
    }
  }, [activeCompany, contextLoading, filters.periodo]);

  async function loadPurchasesData() {
    setLoading(true);
    
    if (isDemo) {
      setKpis(generateDemoKPIs(modeloNegocio));
      setProveedoresABC(generateDemoProveedores());
      setAgingFacturas(generateDemoAging());
      setLoading(false);
      return;
    }

    try {
      const [lineasCompra, contactos] = await Promise.all([
        base44.entities.LineasCompra.filter({ company_id: activeCompany.id }),
        base44.entities.Contactos.filter({ company_id: activeCompany.id })
      ]);

      const calculatedKPIs = calculateKPIs(lineasCompra, modeloNegocio);
      setKpis(calculatedKPIs);

      const proveedoresAnalysis = calculateProveedoresAnalysis(lineasCompra, contactos);
      setProveedoresABC(proveedoresAnalysis);

      const aging = calculateAging(lineasCompra, contactos);
      setAgingFacturas(aging);

    } catch (error) {
      console.error('Error loading purchases data:', error);
    }
    
    setLoading(false);
  }

  function calculateKPIs(lineas, modelo) {
    const comprasTotales = lineas
      .filter(l => !l.esDevolucion)
      .reduce((sum, l) => sum + (l.importeNeto || 0), 0);

    const proveedoresActivos = new Set(lineas.map(l => l.proveedorId)).size;

    const pendientesPago = lineas.filter(l => l.estadoPago !== 'paid');
    const pendientePago = pendientesPago.reduce((sum, l) => sum + (l.importeNeto || 0), 0);
    
    const dpoMedio = comprasTotales > 0 
      ? (pendientePago / comprasTotales) * 365 
      : 0;

    let specificKPIs = {};
    
    if (modelo === 'servicios' || modelo === 'mixto') {
      const costeSubcontratacion = lineas
        .filter(l => l.tipoGasto === 'subcontratacion')
        .reduce((sum, l) => sum + (l.importeNeto || 0), 0);
      
      const pctSubcontratacion = comprasTotales > 0 
        ? (costeSubcontratacion / comprasTotales) * 100 
        : 0;

      specificKPIs = {
        costeSubcontratacion,
        pctSubcontratacion
      };
    }

    return {
      comprasTotales,
      proveedoresActivos,
      pendientePago,
      dpoMedio,
      variacionCompras: 0, // TODO: calcular vs año anterior
      ...specificKPIs
    };
  }

  function calculateProveedoresAnalysis(lineas, contactos) {
    const comprasPorProveedor = {};
    lineas.forEach(linea => {
      if (!comprasPorProveedor[linea.proveedorId]) {
        comprasPorProveedor[linea.proveedorId] = { compras: 0 };
      }
      comprasPorProveedor[linea.proveedorId].compras += linea.importeNeto || 0;
    });

    const totalCompras = Object.values(comprasPorProveedor).reduce((sum, p) => sum + p.compras, 0);

    const proveedoresOrdenados = Object.entries(comprasPorProveedor)
      .map(([proveedorId, data]) => {
        const contacto = contactos.find(c => c.contactId === proveedorId);
        return {
          proveedorId,
          proveedor: contacto?.nombre || 'Sin nombre',
          compras: data.compras,
          pctTotal: (data.compras / totalCompras) * 100,
          dependencia: (data.compras / totalCompras) * 100
        };
      })
      .sort((a, b) => b.compras - a.compras);

    let acumulado = 0;
    proveedoresOrdenados.forEach((proveedor, idx) => {
      proveedor.rank = idx + 1;
      acumulado += proveedor.pctTotal;
      proveedor.pctAcumulado = acumulado;
      
      if (acumulado <= 80) {
        proveedor.clase = 'A';
      } else if (acumulado <= 95) {
        proveedor.clase = 'B';
      } else {
        proveedor.clase = 'C';
      }
    });

    return proveedoresOrdenados;
  }

  function calculateAging(lineas, contactos) {
    const hoy = new Date();
    const facturasAgrupadas = {};

    lineas.forEach(linea => {
      if (linea.estadoPago === 'paid') return;
      
      const key = linea.facturaId;
      if (!facturasAgrupadas[key]) {
        const contacto = contactos.find(c => c.contactId === linea.proveedorId);
        facturasAgrupadas[key] = {
          numeroFactura: linea.facturaId,
          proveedor: contacto?.nombre || 'Sin nombre',
          importe: 0,
          fechaVencimiento: linea.fechaVencimiento,
          diasVencida: linea.diasVencida || 0
        };
      }
      facturasAgrupadas[key].importe += linea.importeNeto || 0;
    });

    return Object.values(facturasAgrupadas).sort((a, b) => b.diasVencida - a.diasVencida);
  }

  function generateDemoKPIs(modelo) {
    const base = {
      comprasTotales: 280000,
      proveedoresActivos: 35,
      pendientePago: 45000,
      dpoMedio: 52,
      variacionCompras: -8.5
    };

    if (modelo === 'servicios' || modelo === 'mixto') {
      return {
        ...base,
        costeSubcontratacion: 85000,
        pctSubcontratacion: 30.4
      };
    }

    return base;
  }

  function generateDemoProveedores() {
    const nombres = [
      'Proveedor Global SL', 'Distribuciones Tech', 'Suministros Pro', 'Import Export SA',
      'Mayorista Central', 'Logistics Plus', 'Material Office', 'TechSupply',
      'Servicios Integrales', 'Consultoría Externa'
    ];

    return nombres.map((nombre, idx) => {
      const compras = 80000 * Math.pow(0.7, idx);
      const clase = idx < 2 ? 'A' : idx < 7 ? 'B' : 'C';
      const dependencia = (compras / 280000) * 100;
      
      return {
        proveedorId: `demo_${idx}`,
        proveedor: nombre,
        compras,
        rank: idx + 1,
        pctTotal: (compras / 280000) * 100,
        pctAcumulado: idx === 0 ? (compras / 280000) * 100 : 0,
        clase,
        dependencia
      };
    });
  }

  function generateDemoAging() {
    return [
      { numeroFactura: 'FC-2024-1234', proveedor: 'Proveedor Global SL', importe: 12500, fechaVencimiento: '2024-01-15', diasVencida: 120 },
      { numeroFactura: 'FC-2024-1567', proveedor: 'Distribuciones Tech', importe: 8700, fechaVencimiento: '2024-02-10', diasVencida: 95 },
      { numeroFactura: 'FC-2024-1890', proveedor: 'Suministros Pro', importe: 5400, fechaVencimiento: '2024-03-01', diasVencida: 75 },
      { numeroFactura: 'FC-2024-2123', proveedor: 'Import Export SA', importe: 3200, fechaVencimiento: '2024-03-20', diasVencida: 45 },
      { numeroFactura: 'FC-2024-2456', proveedor: 'Mayorista Central', importe: 2100, fechaVencimiento: '2024-04-05', diasVencida: 20 }
    ];
  }

  if (contextLoading || loading) {
    return <LoadingState message="Cargando análisis de compras..." />;
  }

  return (
    <div className="space-y-6">
      {isDemo && <DemoBanner />}
      
      <PurchasesFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
        modeloNegocio={modeloNegocio}
      />
      
      <PurchasesKPIs kpis={kpis} modeloNegocio={modeloNegocio} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ParetoProveedoresChart data={proveedoresABC} topN={filters.topN} />
        <PriceEvolutionChart 
          data={priceEvolution} 
          selectedProveedor={selectedProveedor}
        />
      </div>

      <AgingProveedoresTable facturas={agingFacturas} />
    </div>
  );
}