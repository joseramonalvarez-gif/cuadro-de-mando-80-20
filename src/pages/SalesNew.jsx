import React, { useState, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import LoadingState from '../components/shared/LoadingState';
import DemoBanner from '../components/shared/DemoBanner';
import SalesKPIs from '../components/sales/SalesKPIs';
import ParetoABCChart from '../components/sales/ParetoABCChart';
import RFMSegmentMatrix from '../components/sales/RFMSegmentMatrix';
import StrategicClassification from '../components/sales/StrategicClassification';
import ClientesTable from '../components/sales/ClientesTable';
import SalesFiltersNew from '../components/sales/SalesFiltersNew';
import { AlertCircle } from 'lucide-react';

export default function SalesNew() {
  const { activeCompany, loading: contextLoading } = useApp();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    periodo: 'mes',
    comparativa: 'anterior',
    topN: 20
  });
  
  const [kpis, setKpis] = useState({});
  const [clientesABC, setClientesABC] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;
  const modeloNegocio = activeCompany?.modelo_negocio || 'mixto';

  useEffect(() => {
    if (!contextLoading && activeCompany) {
      loadSalesData();
    }
  }, [activeCompany, contextLoading, filters.periodo]);

  async function loadSalesData() {
    setLoading(true);
    
    if (isDemo) {
      // Cargar datos demo
      setKpis(generateDemoKPIs(modeloNegocio));
      setClientesABC(generateDemoClientes(modeloNegocio));
      setLoading(false);
      return;
    }

    try {
      // Cargar datos reales desde LineasVenta y Contactos
      const [lineasVenta, contactos] = await Promise.all([
        base44.entities.LineasVenta.filter({ company_id: activeCompany.id }),
        base44.entities.Contactos.filter({ company_id: activeCompany.id })
      ]);

      // Calcular KPIs
      const calculatedKPIs = calculateKPIs(lineasVenta, modeloNegocio);
      setKpis(calculatedKPIs);

      // Calcular ABC y RFM
      const clientesAnalysis = calculateClientAnalysis(lineasVenta, contactos);
      setClientesABC(clientesAnalysis);

      // Verificar calidad de datos
      checkDataQuality(lineasVenta);

    } catch (error) {
      console.error('Error loading sales data:', error);
    }
    
    setLoading(false);
  }

  function calculateKPIs(lineas, modelo) {
    const ventasBrutas = lineas
      .filter(l => !l.esDevolucion)
      .reduce((sum, l) => sum + (l.importeBruto || 0), 0);

    const ventasNetas = lineas
      .filter(l => !l.esDevolucion)
      .reduce((sum, l) => sum + (l.importeNeto || 0), 0) -
      lineas
      .filter(l => l.esDevolucion)
      .reduce((sum, l) => sum + (l.importeNeto || 0), 0);

    const facturasUnicas = new Set(lineas.map(l => l.facturaId)).size;
    const ticketMedio = facturasUnicas > 0 ? ventasNetas / facturasUnicas : 0;

    const clientesActivos = new Set(lineas.map(l => l.clienteId)).size;

    let specificKPIs = {};
    
    if (modelo === 'productos' || modelo === 'mixto') {
      const unidadesVendidas = lineas
        .filter(l => !l.esServicio && !l.esDevolucion)
        .reduce((sum, l) => sum + (l.unidades || 0), 0);
      
      specificKPIs.unidadesVendidas = unidadesVendidas;
      specificKPIs.desviacionPrecio = 0; // TODO: calcular con pvpCatalogo
    }

    if (modelo === 'servicios' || modelo === 'mixto') {
      const horasFacturadas = lineas
        .filter(l => l.esServicio && !l.esDevolucion)
        .reduce((sum, l) => sum + (l.horasEstimadas || 0), 0);
      
      const tarifaMedia = horasFacturadas > 0 ? ventasNetas / horasFacturadas : 0;
      
      const mrr = lineas
        .filter(l => l.esRecurrente)
        .reduce((sum, l) => sum + (l.importeNeto || 0), 0) / 12;

      specificKPIs.horasFacturadas = horasFacturadas;
      specificKPIs.tarifaMedia = tarifaMedia;
      specificKPIs.mrr = mrr;
    }

    return {
      ventasBrutas,
      ventasNetas,
      ticketMedio,
      clientesActivos,
      clientesNuevos: 0, // TODO: calcular
      clientesPerdidos: 0, // TODO: calcular
      crecimientoYoY: 0, // TODO: calcular vs año anterior
      ...specificKPIs
    };
  }

  function calculateClientAnalysis(lineas, contactos) {
    // Agrupar ventas por cliente
    const ventasPorCliente = {};
    lineas.forEach(linea => {
      if (!ventasPorCliente[linea.clienteId]) {
        ventasPorCliente[linea.clienteId] = {
          ventas: 0,
          margen: 0,
          facturas: new Set(),
          ultimaCompra: null
        };
      }
      ventasPorCliente[linea.clienteId].ventas += linea.importeNeto || 0;
      ventasPorCliente[linea.clienteId].margen += linea.margenBruto || 0;
      ventasPorCliente[linea.clienteId].facturas.add(linea.facturaId);
      
      if (!ventasPorCliente[linea.clienteId].ultimaCompra || 
          new Date(linea.fecha) > new Date(ventasPorCliente[linea.clienteId].ultimaCompra)) {
        ventasPorCliente[linea.clienteId].ultimaCompra = linea.fecha;
      }
    });

    const totalVentas = Object.values(ventasPorCliente).reduce((sum, c) => sum + c.ventas, 0);

    // Ordenar y calcular ABC
    const clientesOrdenados = Object.entries(ventasPorCliente)
      .map(([clienteId, data]) => {
        const contacto = contactos.find(c => c.contactId === clienteId);
        return {
          clienteId,
          nombre: contacto?.nombre || 'Sin nombre',
          ventas: data.ventas,
          margenBruto: data.margen,
          margenPct: data.ventas > 0 ? (data.margen / data.ventas) * 100 : 0,
          numFacturas: data.facturas.size,
          ultimaCompra: data.ultimaCompra,
          pctTotal: (data.ventas / totalVentas) * 100
        };
      })
      .sort((a, b) => b.ventas - a.ventas);

    // Calcular % acumulado y clase ABC
    let acumulado = 0;
    clientesOrdenados.forEach((cliente, idx) => {
      cliente.rank = idx + 1;
      acumulado += cliente.pctTotal;
      cliente.pctAcumulado = acumulado;
      
      if (acumulado <= 80) {
        cliente.clase = 'A';
      } else if (acumulado <= 95) {
        cliente.clase = 'B';
      } else {
        cliente.clase = 'C';
      }

      // Calcular RFM (simplificado)
      const diasUltimaCompra = cliente.ultimaCompra ? 
        Math.floor((Date.now() - new Date(cliente.ultimaCompra)) / (1000 * 60 * 60 * 24)) : 999;
      
      cliente.recency = diasUltimaCompra < 30 ? 5 : diasUltimaCompra < 90 ? 4 : diasUltimaCompra < 180 ? 3 : diasUltimaCompra < 365 ? 2 : 1;
      cliente.frequency = cliente.numFacturas >= 10 ? 5 : cliente.numFacturas >= 5 ? 4 : cliente.numFacturas >= 3 ? 3 : cliente.numFacturas >= 2 ? 2 : 1;
      cliente.monetary = cliente.ventas >= 50000 ? 5 : cliente.ventas >= 20000 ? 4 : cliente.ventas >= 10000 ? 3 : cliente.ventas >= 5000 ? 2 : 1;
      cliente.scoreRFM = `${cliente.recency}${cliente.frequency}${cliente.monetary}`;

      // Segmento RFM
      if (cliente.recency >= 4 && cliente.frequency >= 4 && cliente.monetary >= 4) {
        cliente.segmentoRFM = 'Campeón';
      } else if (cliente.frequency >= 3 && cliente.monetary >= 3 && cliente.recency >= 2) {
        cliente.segmentoRFM = 'Cliente fiel';
      } else if (cliente.recency >= 4 && cliente.frequency <= 2) {
        cliente.segmentoRFM = 'Nuevo prometedor';
      } else if (cliente.recency <= 2 && (cliente.frequency >= 3 || cliente.monetary >= 3)) {
        cliente.segmentoRFM = 'En riesgo';
      } else if (cliente.recency === 1 && cliente.frequency <= 2 && cliente.monetary <= 2) {
        cliente.segmentoRFM = 'Perdido';
      } else {
        cliente.segmentoRFM = 'Otros';
      }

      // Clasificación estratégica
      if (cliente.clase === 'A' && ['Campeón', 'Cliente fiel'].includes(cliente.segmentoRFM)) {
        cliente.clasificacion = 'Proteger';
      } else if (['B', 'C'].includes(cliente.clase) && ['Nuevo prometedor', 'Cliente fiel'].includes(cliente.segmentoRFM)) {
        cliente.clasificacion = 'Desarrollar';
      } else if (cliente.clase === 'A' && cliente.segmentoRFM === 'En riesgo') {
        cliente.clasificacion = 'Corregir';
      } else if (cliente.segmentoRFM === 'Perdido') {
        cliente.clasificacion = 'Vigilar';
      } else if (cliente.clase === 'C' && cliente.margenPct < 0 && cliente.segmentoRFM === 'Perdido') {
        cliente.clasificacion = 'Abandonar';
      } else {
        cliente.clasificacion = 'Desarrollar';
      }
    });

    return clientesOrdenados;
  }

  function checkDataQuality(lineas) {
    const sinCliente = lineas.filter(l => !l.clienteId).length;
    const sinProducto = lineas.filter(l => !l.itemId).length;
    const total = lineas.length;

    const newAlerts = [];
    if (sinCliente / total > 0.2) {
      newAlerts.push(`⚠️ El ${((sinCliente/total)*100).toFixed(1)}% de facturas no tienen cliente asignado`);
    }
    if (sinProducto / total > 0.3) {
      newAlerts.push(`⚠️ El ${((sinProducto/total)*100).toFixed(1)}% de líneas no tienen producto/servicio asignado`);
    }
    setAlerts(newAlerts);
  }

  function generateDemoKPIs(modelo) {
    const base = {
      ventasBrutas: 450000,
      ventasNetas: 425000,
      ticketMedio: 8500,
      clientesActivos: 50,
      clientesNuevos: 8,
      clientesPerdidos: 3,
      crecimientoYoY: 15.3
    };

    if (modelo === 'productos') {
      return { ...base, unidadesVendidas: 12500, desviacionPrecio: -5.2 };
    } else if (modelo === 'servicios') {
      return { ...base, horasFacturadas: 3200, tarifaMedia: 85, mrr: 25000 };
    } else {
      return { ...base, unidadesVendidas: 8500, horasFacturadas: 1800, mrr: 15000 };
    }
  }

  function generateDemoClientes(modelo) {
    const nombres = [
      'ACME Corp', 'TechStart SL', 'GlobalSoft', 'Innovación Digital', 'Consultoría Plus',
      'Servicios Integrales', 'Soluciones Tech', 'DataFlow', 'CloudMasters', 'ProActive',
      'NextGen Solutions', 'SmartBiz', 'EcoTech', 'FastDelivery', 'RetailPro'
    ];

    return nombres.map((nombre, idx) => {
      const ventas = 100000 * Math.pow(0.75, idx);
      const clase = idx < 3 ? 'A' : idx < 10 ? 'B' : 'C';
      const segmentos = ['Campeón', 'Cliente fiel', 'Nuevo prometedor', 'En riesgo', 'Perdido'];
      
      return {
        clienteId: `demo_${idx}`,
        nombre,
        ventas,
        rank: idx + 1,
        pctTotal: (ventas / 450000) * 100,
        pctAcumulado: idx === 0 ? (ventas / 450000) * 100 : 0, // Simplificado
        clase,
        margenBruto: ventas * 0.35,
        margenPct: 35 + (Math.random() * 20 - 10),
        numFacturas: Math.floor(Math.random() * 20) + 5,
        recency: Math.floor(Math.random() * 5) + 1,
        frequency: Math.floor(Math.random() * 5) + 1,
        monetary: Math.floor(Math.random() * 5) + 1,
        scoreRFM: `${Math.floor(Math.random() * 5) + 1}${Math.floor(Math.random() * 5) + 1}${Math.floor(Math.random() * 5) + 1}`,
        segmentoRFM: segmentos[Math.floor(Math.random() * segmentos.length)],
        clasificacion: ['Proteger', 'Desarrollar', 'Corregir'][Math.floor(Math.random() * 3)]
      };
    });
  }

  if (contextLoading || loading) {
    return <LoadingState message="Cargando análisis de ventas..." />;
  }

  return (
    <div className="space-y-6">
      {isDemo && <DemoBanner />}
      
      {alerts.length > 0 && (
        <div className="bg-[#FFF4E6] border border-[#E6A817] rounded-lg p-4">
          {alerts.map((alert, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-[#3E4C59]">
              <AlertCircle className="w-4 h-4 text-[#E6A817]" />
              {alert}
            </div>
          ))}
        </div>
      )}

      <SalesFiltersNew filters={filters} onFiltersChange={setFilters} />
      
      <SalesKPIs kpis={kpis} modeloNegocio={modeloNegocio} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ParetoABCChart data={clientesABC} topN={filters.topN} />
        <RFMSegmentMatrix clientes={clientesABC} />
      </div>

      <StrategicClassification clientes={clientesABC.slice(0, 30)} />

      <ClientesTable clientes={clientesABC} />
    </div>
  );
}