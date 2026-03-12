import React, { useState, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import LoadingState from '../components/shared/LoadingState';
import DemoBanner from '../components/shared/DemoBanner';
import HRKPIs from '../components/hr/HRKPIs';
import EmployeeProductivityTable from '../components/hr/EmployeeProductivityTable';
import ProjectDeviationChart from '../components/hr/ProjectDeviationChart';
import HRFilters from '../components/hr/HRFilters';

export default function HumanResources() {
  const { activeCompany, loading: contextLoading } = useApp();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    periodo: 'mes',
    perfil: 'all'
  });
  
  const [kpis, setKpis] = useState({});
  const [empleados, setEmpleados] = useState([]);
  const [proyectos, setProyectos] = useState([]);

  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;
  const modeloNegocio = activeCompany?.modelo_negocio || 'mixto';

  useEffect(() => {
    if (!contextLoading && activeCompany) {
      loadHRData();
    }
  }, [activeCompany, contextLoading, filters.periodo]);

  async function loadHRData() {
    setLoading(true);
    
    if (isDemo) {
      setKpis(generateDemoKPIs(modeloNegocio));
      setEmpleados(generateDemoEmpleados(modeloNegocio));
      setProyectos(generateDemoProyectos());
      setLoading(false);
      return;
    }

    try {
      const [empleadosData, horasData, lineasVenta] = await Promise.all([
        base44.entities.Empleados.filter({ company_id: activeCompany.id }),
        base44.entities.HorasRegistradas.filter({ company_id: activeCompany.id }),
        base44.entities.LineasVenta.filter({ company_id: activeCompany.id })
      ]);

      const ventasTotales = lineasVenta
        .filter(l => !l.esDevolucion)
        .reduce((sum, l) => sum + (l.importeNeto || 0), 0);

      const calculatedKPIs = calculateHRKPIs(empleadosData, horasData, ventasTotales, modeloNegocio);
      setKpis(calculatedKPIs);

      const empleadosConMetricas = calculateEmpleadosMetricas(empleadosData, horasData, lineasVenta, modeloNegocio);
      setEmpleados(empleadosConMetricas);

      if (modeloNegocio === 'servicios' || modeloNegocio === 'mixto') {
        const proyectosData = await base44.entities.Proyectos.filter({ company_id: activeCompany.id });
        const proyectosConDesviacion = calculateProyectosDesviacion(proyectosData, horasData);
        setProyectos(proyectosConDesviacion);
      }

    } catch (error) {
      console.error('Error loading HR data:', error);
    }
    
    setLoading(false);
  }

  function calculateHRKPIs(empleados, horas, ventasTotales, modelo) {
    const empleadosActivos = empleados.filter(e => e.perfil !== 'inactivo').length;
    
    const costeRRHH = empleados.reduce((sum, e) => {
      const costeHora = e.costeHora || 30;
      const horasJornada = e.horasJornada || 8;
      return sum + (costeHora * horasJornada * 22); // 22 días laborables/mes estimado
    }, 0);

    const pctRRHHSobreVentas = ventasTotales > 0 ? (costeRRHH / ventasTotales) * 100 : 0;
    const productividad = empleadosActivos > 0 ? ventasTotales / empleadosActivos : 0;

    let specificKPIs = {};

    if (modelo === 'servicios' || modelo === 'mixto') {
      const horasDisponibles = empleadosActivos * 22 * 8; // días × horas
      const horasRegistradas = horas.reduce((sum, h) => sum + (h.horas || 0), 0);
      const horasFacturables = horas.filter(h => h.facturable).reduce((sum, h) => sum + (h.horas || 0), 0);
      const ocupacionPct = horasDisponibles > 0 ? (horasFacturables / horasDisponibles) * 100 : 0;

      const costeReal = horas.reduce((sum, h) => {
        const emp = empleados.find(e => e.empleadoId === h.empleadoId);
        const costeHora = emp?.costeHora || 30;
        return sum + (h.horas * costeHora);
      }, 0);

      const tarifaMedia = 80; // TODO: calcular desde lineasVenta
      const ingresoGenerado = horasFacturables * tarifaMedia;
      const margenEquipo = ingresoGenerado - costeReal;

      specificKPIs = {
        horasDisponibles,
        horasRegistradas,
        horasFacturables,
        ocupacionPct,
        margenEquipo
      };
    }

    return {
      empleadosActivos,
      costeRRHH,
      pctRRHHSobreVentas,
      productividad,
      ...specificKPIs
    };
  }

  function calculateEmpleadosMetricas(empleados, horas, lineasVenta, modelo) {
    return empleados.map(emp => {
      const horasEmp = horas.filter(h => h.empleadoId === emp.empleadoId);
      const horasRegistradas = horasEmp.reduce((sum, h) => sum + (h.horas || 0), 0);
      const horasFacturables = horasEmp.filter(h => h.facturable).reduce((sum, h) => sum + (h.horas || 0), 0);
      const horasDisponibles = 22 * (emp.horasJornada || 8);
      const ocupacion = horasDisponibles > 0 ? (horasFacturables / horasDisponibles) * 100 : 0;

      const costeHora = emp.costeHora || 30;
      const coste = horasRegistradas * costeHora;

      let ingresoGenerado = 0;
      let margen = 0;

      if (modelo === 'servicios' || modelo === 'mixto') {
        const tarifaMedia = 80;
        ingresoGenerado = horasFacturables * tarifaMedia;
        margen = ingresoGenerado - coste;
      }

      return {
        nombre: emp.nombre,
        perfil: emp.perfil,
        horasDisponibles,
        horasRegistradas,
        horasFacturables,
        ocupacion,
        coste,
        ingresoGenerado,
        margen
      };
    });
  }

  function calculateProyectosDesviacion(proyectos, horas) {
    return proyectos.map(p => {
      const horasProyecto = horas.filter(h => h.proyectoId === p.proyectoId);
      const horasConsumidas = horasProyecto.reduce((sum, h) => sum + (h.horas || 0), 0);
      const horasPresupuestadas = p.presupuesto ? p.presupuesto / 80 : 100; // Estimado si no hay dato
      const desviacion = horasPresupuestadas > 0 
        ? ((horasConsumidas - horasPresupuestadas) / horasPresupuestadas) * 100 
        : 0;

      return {
        proyecto: p.nombre,
        horasPresupuestadas,
        horasConsumidas,
        desviacion
      };
    }).filter(p => p.horasConsumidas > 0);
  }

  function generateDemoKPIs(modelo) {
    const base = {
      empleadosActivos: 12,
      costeRRHH: 48000,
      pctRRHHSobreVentas: 28.5,
      productividad: 42000
    };

    if (modelo === 'servicios' || modelo === 'mixto') {
      return {
        ...base,
        horasDisponibles: 2112,
        horasRegistradas: 1850,
        horasFacturables: 1620,
        ocupacionPct: 76.7,
        margenEquipo: 81600
      };
    }

    return base;
  }

  function generateDemoEmpleados(modelo) {
    const base = [
      { nombre: 'Ana García', perfil: 'Senior', coste: 5400 },
      { nombre: 'Carlos López', perfil: 'Junior', coste: 3200 },
      { nombre: 'Elena Martín', perfil: 'Manager', coste: 6500 }
    ];

    if (modelo === 'servicios' || modelo === 'mixto') {
      return base.map(e => ({
        ...e,
        horasDisponibles: 176,
        horasRegistradas: 165,
        horasFacturables: 145,
        ocupacion: 82.4,
        ingresoGenerado: 11600,
        margen: 11600 - e.coste
      }));
    }

    return base;
  }

  function generateDemoProyectos() {
    return [
      { proyecto: 'Web Corporativa', horasPresupuestadas: 120, horasConsumidas: 145, desviacion: 20.8 },
      { proyecto: 'App Mobile', horasPresupuestadas: 200, horasConsumidas: 185, desviacion: -7.5 },
      { proyecto: 'Consultoría Digital', horasPresupuestadas: 80, horasConsumidas: 105, desviacion: 31.3 }
    ];
  }

  if (contextLoading || loading) {
    return <LoadingState message="Cargando análisis de RRHH..." />;
  }

  const isServicios = modeloNegocio === 'servicios' || modeloNegocio === 'mixto';

  return (
    <div className="space-y-6">
      {isDemo && <DemoBanner />}
      
      <HRFilters filters={filters} onFiltersChange={setFilters} />
      
      <HRKPIs kpis={kpis} modeloNegocio={modeloNegocio} />

      <EmployeeProductivityTable empleados={empleados} modeloNegocio={modeloNegocio} />

      {isServicios && proyectos.length > 0 && (
        <ProjectDeviationChart proyectos={proyectos} />
      )}
    </div>
  );
}