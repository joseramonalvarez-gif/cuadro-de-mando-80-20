import React, { useState, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import LoadingState from '../components/shared/LoadingState';
import DemoBanner from '../components/shared/DemoBanner';
import TaxKPIs from '../components/taxes/TaxKPIs';
import VATBreakdownChart from '../components/taxes/VATBreakdownChart';
import QuarterlyEvolutionChart from '../components/taxes/QuarterlyEvolutionChart';
import TaxCalendar from '../components/taxes/TaxCalendar';
import TaxFilters from '../components/taxes/TaxFilters';

export default function Taxes() {
  const { activeCompany, loading: contextLoading } = useApp();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    periodo: 'trimestre',
    tipoImpuesto: 'all',
    comparativa: 'none'
  });
  
  const [kpis, setKpis] = useState({});
  const [vatBreakdown, setVatBreakdown] = useState([]);
  const [quarterlyData, setQuarterlyData] = useState([]);
  const [vencimientos, setVencimientos] = useState([]);

  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;

  useEffect(() => {
    if (!contextLoading && activeCompany) {
      loadTaxData();
    }
  }, [activeCompany, contextLoading, filters.periodo]);

  async function loadTaxData() {
    setLoading(true);
    
    if (isDemo) {
      setKpis(generateDemoKPIs());
      setVatBreakdown(generateDemoVATBreakdown());
      setQuarterlyData(generateDemoQuarterly());
      setVencimientos(generateDemoVencimientos());
      setLoading(false);
      return;
    }

    try {
      const [lineasVenta, lineasCompra] = await Promise.all([
        base44.entities.LineasVenta.filter({ company_id: activeCompany.id }),
        base44.entities.LineasCompra.filter({ company_id: activeCompany.id })
      ]);

      const calculatedKPIs = calculateTaxKPIs(lineasVenta, lineasCompra);
      setKpis(calculatedKPIs);

      const breakdown = calculateVATBreakdown(lineasVenta);
      setVatBreakdown(breakdown);

      const quarterly = calculateQuarterly(lineasVenta, lineasCompra);
      setQuarterlyData(quarterly);

      const fiscal = generateFiscalCalendar(calculatedKPIs, quarterly);
      setVencimientos(fiscal);

    } catch (error) {
      console.error('Error loading tax data:', error);
    }
    
    setLoading(false);
  }

  function calculateTaxKPIs(lineasVenta, lineasCompra) {
    // Calcular IVA repercutido (asumiendo 21% si no hay datos de impuestos)
    const ivaRepercutido = lineasVenta
      .filter(l => !l.esDevolucion)
      .reduce((sum, l) => {
        const taxRate = 21; // TODO: obtener de impuestoId cruzado con /taxes
        return sum + ((l.importeNeto || 0) * taxRate / 100);
      }, 0);

    // Calcular IVA soportado
    const ivaSoportado = lineasCompra
      .filter(l => !l.esDevolucion)
      .reduce((sum, l) => {
        const taxRate = 21;
        return sum + ((l.importeNeto || 0) * taxRate / 100);
      }, 0);

    // Retenciones (simplificado - asumir 15% IRPF en servicios profesionales)
    const retencionesPracticadas = lineasVenta
      .filter(l => l.esServicio)
      .reduce((sum, l) => sum + ((l.importeNeto || 0) * 0.15), 0);

    const retencionesSoportadas = lineasCompra
      .filter(l => l.tipoGasto === 'subcontratacion')
      .reduce((sum, l) => sum + ((l.importeNeto || 0) * 0.15), 0);

    return {
      ivaRepercutido,
      ivaSoportado,
      retencionesPracticadas,
      retencionesSoportadas
    };
  }

  function calculateVATBreakdown(lineasVenta) {
    const breakdown = {
      '21%': { baseImponible: 0, cuotaIVA: 0 },
      '10%': { baseImponible: 0, cuotaIVA: 0 },
      '4%': { baseImponible: 0, cuotaIVA: 0 },
      '0%': { baseImponible: 0, cuotaIVA: 0 },
      'Exento': { baseImponible: 0, cuotaIVA: 0 }
    };

    lineasVenta.forEach(linea => {
      const base = linea.importeNeto || 0;
      // TODO: obtener taxRate real del impuestoId
      const tipo = '21%'; // Asumiendo 21% por defecto
      
      breakdown[tipo].baseImponible += base;
      breakdown[tipo].cuotaIVA += base * 0.21;
    });

    const totalIVA = Object.values(breakdown).reduce((sum, item) => sum + item.cuotaIVA, 0);

    return Object.entries(breakdown)
      .filter(([_, data]) => data.cuotaIVA > 0)
      .map(([tipo, data]) => ({
        tipo,
        baseImponible: data.baseImponible,
        cuotaIVA: data.cuotaIVA,
        pctSobreTotal: totalIVA > 0 ? (data.cuotaIVA / totalIVA) * 100 : 0
      }));
  }

  function calculateQuarterly(lineasVenta, lineasCompra) {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    return quarters.map((q, idx) => {
      const ventasQ = lineasVenta.filter(l => l.trimestre === idx + 1);
      const comprasQ = lineasCompra.filter(l => l.trimestre === idx + 1);

      const repercutido = ventasQ.reduce((sum, l) => sum + ((l.importeNeto || 0) * 0.21), 0);
      const soportado = comprasQ.reduce((sum, l) => sum + ((l.importeNeto || 0) * 0.21), 0);

      return {
        trimestre: q,
        repercutido,
        soportado,
        saldo: repercutido - soportado
      };
    });
  }

  function generateFiscalCalendar(kpis, quarterly) {
    const vencimientos = [];
    const año = new Date().getFullYear();

    // Modelo 303 (IVA trimestral)
    quarterly.forEach((q, idx) => {
      const mesVencimiento = (idx + 1) * 3; // Marzo, Junio, Septiembre, Diciembre
      vencimientos.push({
        modelo: 'Modelo 303',
        periodo: `${q.trimestre} ${año}`,
        fechaLimite: `${año}-${mesVencimiento.toString().padStart(2, '0')}-20`,
        importeEstimado: Math.abs(q.saldo),
        estado: idx < 1 ? 'presentado' : 'pendiente'
      });
    });

    // Modelo 111 (Retenciones trimestrales)
    if (kpis.retencionesPracticadas > 0) {
      vencimientos.push({
        modelo: 'Modelo 111',
        periodo: 'Q1 ' + año,
        fechaLimite: `${año}-04-20`,
        importeEstimado: kpis.retencionesPracticadas / 4,
        estado: 'pendiente'
      });
    }

    return vencimientos.sort((a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite));
  }

  function generateDemoKPIs() {
    return {
      ivaRepercutido: 95000,
      ivaSoportado: 42000,
      retencionesPracticadas: 18500,
      retencionesSoportadas: 8200
    };
  }

  function generateDemoVATBreakdown() {
    return [
      { tipo: '21%', baseImponible: 380000, cuotaIVA: 79800, pctSobreTotal: 84 },
      { tipo: '10%', baseImponible: 95000, cuotaIVA: 9500, pctSobreTotal: 10 },
      { tipo: '4%', baseImponible: 60000, cuotaIVA: 2400, pctSobreTotal: 2.5 },
      { tipo: '0%', baseImponible: 15000, cuotaIVA: 0, pctSobreTotal: 0 },
      { tipo: 'Exento', baseImponible: 25000, cuotaIVA: 0, pctSobreTotal: 0 }
    ];
  }

  function generateDemoQuarterly() {
    return [
      { trimestre: 'Q1', repercutido: 88000, soportado: 38000, saldo: 50000 },
      { trimestre: 'Q2', repercutido: 95000, soportado: 42000, saldo: 53000 },
      { trimestre: 'Q3', repercutido: 102000, soportado: 45000, saldo: 57000 },
      { trimestre: 'Q4', repercutido: 110000, soportado: 48000, saldo: 62000 }
    ];
  }

  function generateDemoVencimientos() {
    return [
      { modelo: 'Modelo 303', periodo: 'Q1 2026', fechaLimite: '2026-04-20', importeEstimado: 50000, estado: 'pendiente' },
      { modelo: 'Modelo 111', periodo: 'Q1 2026', fechaLimite: '2026-04-20', importeEstimado: 18500, estado: 'pendiente' },
      { modelo: 'Modelo 303', periodo: 'Q2 2026', fechaLimite: '2026-07-20', importeEstimado: 53000, estado: 'pendiente' },
      { modelo: 'Modelo 190', periodo: 'Anual 2025', fechaLimite: '2026-01-31', importeEstimado: 0, estado: 'presentado' }
    ];
  }

  if (contextLoading || loading) {
    return <LoadingState message="Cargando análisis fiscal..." />;
  }

  return (
    <div className="space-y-6">
      {isDemo && <DemoBanner />}
      
      <TaxFilters filters={filters} onFiltersChange={setFilters} />
      
      <TaxKPIs kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VATBreakdownChart data={vatBreakdown} />
        <QuarterlyEvolutionChart data={quarterlyData} />
      </div>

      <TaxCalendar vencimientos={vencimientos} />
    </div>
  );
}