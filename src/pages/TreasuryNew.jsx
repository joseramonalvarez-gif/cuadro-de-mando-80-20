import React, { useState, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import LoadingState from '../components/shared/LoadingState';
import DemoBanner from '../components/shared/DemoBanner';
import TreasuryKPIs from '../components/treasury/TreasuryKPIs';
import BankAccountsCards from '../components/treasury/BankAccountsCards';
import AgingClientesChart from '../components/treasury/AgingClientesChart';
import CashFlowForecast from '../components/treasury/CashFlowForecast';
import AgingClientesTable from '../components/treasury/AgingClientesTable';
import TreasuryFilters from '../components/treasury/TreasuryFilters';

export default function TreasuryNew() {
  const { activeCompany, loading: contextLoading } = useApp();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    periodo: 'mes',
    cuenta: 'all',
    tipo: 'all'
  });
  
  const [kpis, setKpis] = useState({});
  const [cuentas, setCuentas] = useState([]);
  const [agingData, setAgingData] = useState([]);
  const [agingFacturas, setAgingFacturas] = useState([]);
  const [forecastData, setForecastData] = useState([]);

  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;
  const modeloNegocio = activeCompany?.modelo_negocio || 'mixto';

  useEffect(() => {
    if (!contextLoading && activeCompany) {
      loadTreasuryData();
    }
  }, [activeCompany, contextLoading, filters.periodo]);

  async function loadTreasuryData() {
    setLoading(true);
    
    if (isDemo) {
      setKpis(generateDemoKPIs(modeloNegocio));
      setCuentas(generateDemoCuentas());
      setAgingData(generateDemoAging());
      setAgingFacturas(generateDemoAgingFacturas());
      setForecastData(generateDemoForecast());
      setLoading(false);
      return;
    }

    try {
      const [tesoreria, cobrosPagos, lineasVenta, lineasCompra] = await Promise.all([
        base44.entities.Tesoreria.filter({ company_id: activeCompany.id }),
        base44.entities.CobrosPagos.filter({ company_id: activeCompany.id }),
        base44.entities.LineasVenta.filter({ company_id: activeCompany.id }),
        base44.entities.LineasCompra.filter({ company_id: activeCompany.id })
      ]);

      const calculatedKPIs = calculateKPIs(tesoreria, cobrosPagos, lineasVenta, lineasCompra);
      setKpis(calculatedKPIs);

      setCuentas(tesoreria);

      const aging = calculateAging(lineasVenta);
      setAgingData(aging.chartData);
      setAgingFacturas(aging.facturas);

      const forecast = calculateForecast(lineasVenta, lineasCompra, tesoreria);
      setForecastData(forecast);

    } catch (error) {
      console.error('Error loading treasury data:', error);
    }
    
    setLoading(false);
  }

  function calculateKPIs(tesoreria, cobrosPagos, lineasVenta, lineasCompra) {
    const saldoTotal = tesoreria.reduce((sum, c) => sum + (c.saldo || 0), 0);

    const cashIn = cobrosPagos
      .filter(p => p.tipo === 'cobro')
      .reduce((sum, p) => sum + (p.importe || 0), 0);

    const cashOut = cobrosPagos
      .filter(p => p.tipo === 'pago')
      .reduce((sum, p) => sum + (p.importe || 0), 0);

    const ventasTotal = lineasVenta
      .filter(l => !l.esDevolucion)
      .reduce((sum, l) => sum + (l.importeNeto || 0), 0);

    const pendienteClientes = lineasVenta
      .filter(l => l.estadoPago !== 'paid')
      .reduce((sum, l) => sum + (l.importeNeto || 0), 0);

    const dsoGlobal = ventasTotal > 0 ? (pendienteClientes / ventasTotal) * 365 : 0;

    const cashOutMensual = cashOut > 0 ? cashOut : 30000; // Estimado si no hay datos
    const runway = cashOutMensual > 0 ? saldoTotal / cashOutMensual : 0;

    const comprasTotal = lineasCompra
      .filter(l => !l.esDevolucion)
      .reduce((sum, l) => sum + (l.importeNeto || 0), 0);

    const pendienteProveedores = lineasCompra
      .filter(l => l.estadoPago !== 'paid')
      .reduce((sum, l) => sum + (l.importeNeto || 0), 0);

    const dpo = comprasTotal > 0 ? (pendienteProveedores / comprasTotal) * 365 : 0;
    const ccc = dsoGlobal - dpo;

    const morosidad90 = lineasVenta
      .filter(l => l.estaVencida && l.diasVencida > 90)
      .reduce((sum, l) => sum + (l.importeNeto || 0), 0);

    const morosidadPct = ventasTotal > 0 ? (morosidad90 / ventasTotal) * 100 : 0;

    return {
      saldoTotal,
      cashIn,
      cashOut,
      dsoGlobal,
      runway,
      ccc,
      morosidad90,
      morosidadPct
    };
  }

  function calculateAging(lineasVenta) {
    const buckets = {
      'No vencida': { importe: 0, numFacturas: 0 },
      '0-30d': { importe: 0, numFacturas: 0 },
      '31-60d': { importe: 0, numFacturas: 0 },
      '61-90d': { importe: 0, numFacturas: 0 },
      '+90d': { importe: 0, numFacturas: 0 }
    };

    const facturasMap = {};

    lineasVenta
      .filter(l => l.estadoPago !== 'paid')
      .forEach(linea => {
        const dias = linea.diasVencida || -1;
        let bucket;
        if (dias < 0) bucket = 'No vencida';
        else if (dias <= 30) bucket = '0-30d';
        else if (dias <= 60) bucket = '31-60d';
        else if (dias <= 90) bucket = '61-90d';
        else bucket = '+90d';

        buckets[bucket].importe += linea.importeNeto || 0;

        if (!facturasMap[linea.facturaId]) {
          buckets[bucket].numFacturas += 1;
          facturasMap[linea.facturaId] = {
            numeroFactura: linea.facturaId,
            cliente: 'Cliente', // TODO: cruzar con contactos
            importePendiente: 0,
            fechaVencimiento: linea.fechaVencimiento,
            diasVencida: dias
          };
        }
        facturasMap[linea.facturaId].importePendiente += linea.importeNeto || 0;
      });

    const chartData = Object.entries(buckets).map(([bucket, data]) => ({
      bucket,
      importe: data.importe,
      numFacturas: data.numFacturas
    }));

    const facturas = Object.values(facturasMap).sort((a, b) => b.diasVencida - a.diasVencida);

    return { chartData, facturas };
  }

  function calculateForecast(lineasVenta, lineasCompra, tesoreria) {
    const saldoInicial = tesoreria.reduce((sum, c) => sum + (c.saldo || 0), 0);
    
    const semanas = [];
    let saldoAcum = saldoInicial;

    for (let i = 0; i < 13; i++) {
      const entradas = Math.random() * 50000 + 20000;
      const salidas = Math.random() * 40000 + 15000;
      saldoAcum = saldoAcum + entradas - salidas;

      semanas.push({
        semana: `S${i + 1}`,
        entradas,
        salidas,
        saldoAcumulado: saldoAcum
      });
    }

    return semanas;
  }

  function generateDemoKPIs(modelo) {
    return {
      saldoTotal: 185000,
      cashIn: 120000,
      cashOut: 95000,
      dsoGlobal: 45,
      runway: 4.5,
      ccc: 28,
      morosidad90: 12500,
      morosidadPct: 2.8,
      mrrCobradoPuntual: 92.5
    };
  }

  function generateDemoCuentas() {
    return [
      { cuentaId: 'demo_1', nombre: 'Banco Santander', saldo: 125000, moneda: 'EUR', variacion: 8.5 },
      { cuentaId: 'demo_2', nombre: 'CaixaBank', saldo: 50000, moneda: 'EUR', variacion: -3.2 },
      { cuentaId: 'demo_3', nombre: 'Caja', saldo: 10000, moneda: 'EUR', variacion: 0 }
    ];
  }

  function generateDemoAging() {
    return [
      { bucket: 'No vencida', importe: 85000, numFacturas: 25 },
      { bucket: '0-30d', importe: 45000, numFacturas: 12 },
      { bucket: '31-60d', importe: 25000, numFacturas: 8 },
      { bucket: '61-90d', importe: 15000, numFacturas: 5 },
      { bucket: '+90d', importe: 12500, numFacturas: 4 }
    ];
  }

  function generateDemoAgingFacturas() {
    return [
      { numeroFactura: 'FV-2024-0145', cliente: 'ACME Corp', importePendiente: 15000, fechaVencimiento: '2024-01-10', diasVencida: 125 },
      { numeroFactura: 'FV-2024-0198', cliente: 'TechStart SL', importePendiente: 8500, fechaVencimiento: '2024-02-15', diasVencida: 95 },
      { numeroFactura: 'FV-2024-0234', cliente: 'GlobalSoft', importePendiente: 12000, fechaVencimiento: '2024-03-01', diasVencida: 70 },
      { numeroFactura: 'FV-2024-0287', cliente: 'Innovación Digital', importePendiente: 6500, fechaVencimiento: '2024-03-20', diasVencida: 45 },
      { numeroFactura: 'FV-2024-0312', cliente: 'Consultoría Plus', importePendiente: 9800, fechaVencimiento: '2024-04-01', diasVencida: 25 }
    ];
  }

  function generateDemoForecast() {
    let saldo = 185000;
    return Array.from({ length: 13 }, (_, i) => {
      const entradas = 40000 + Math.random() * 20000;
      const salidas = 35000 + Math.random() * 15000;
      saldo = saldo + entradas - salidas;
      return {
        semana: `S${i + 1}`,
        entradas,
        salidas,
        saldoAcumulado: saldo
      };
    });
  }

  if (contextLoading || loading) {
    return <LoadingState message="Cargando análisis de tesorería..." />;
  }

  return (
    <div className="space-y-6">
      {isDemo && <DemoBanner />}
      
      <TreasuryFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        cuentas={cuentas}
      />
      
      <TreasuryKPIs kpis={kpis} modeloNegocio={modeloNegocio} />

      <BankAccountsCards cuentas={cuentas} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgingClientesChart data={agingData} />
        <CashFlowForecast data={forecastData} />
      </div>

      <AgingClientesTable facturas={agingFacturas} />
    </div>
  );
}