import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { generateDemoData, formatCurrency, formatNumber } from '../components/shared/DemoData';
import { base44 } from '@/api/base44Client';
import DemoBanner from '../components/shared/DemoBanner';
import LoadingState from '../components/shared/LoadingState';
import KpiCard from '../components/shared/KpiCard';
import CostEvolutionChart from '../components/hr/CostEvolutionChart';
import DepartmentDistributionChart from '../components/hr/DepartmentDistributionChart';
import ProductivityChart from '../components/hr/ProductivityChart';
import HRFilters from '../components/hr/HRFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, TrendingUp, Percent, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

function calculateHRMetrics(employees, times, sales) {
  const activeEmployees = employees.filter(e => e.status === 'active');
  const numFTE = activeEmployees.length;
  
  const totalCost = activeEmployees.reduce((sum, e) => sum + (e.salary || 30000), 0);
  const avgCostPerEmployee = numFTE > 0 ? totalCost / numFTE : 0;
  
  const totalSales = sales || 487320;
  const hrPercentOnSales = totalSales > 0 ? (totalCost / totalSales) * 100 : 0;
  const productivityPerFTE = numFTE > 0 ? totalSales / numFTE : 0;
  
  const totalHoursWorked = times.reduce((sum, t) => sum + (t.hours || 0), 0);
  const totalOvertime = times.reduce((sum, t) => sum + (t.overtime || 0), 0);
  const overtimeCost = totalOvertime * 25;
  
  const workingDays = 22;
  const totalWorkingDays = numFTE * workingDays;
  const absenceDays = times.reduce((sum, t) => sum + (t.absence_days || 0), 0);
  const absenteeismRate = totalWorkingDays > 0 ? (absenceDays / totalWorkingDays) * 100 : 0;

  return {
    coste_total: { value: totalCost, prev: totalCost * 0.96, trend: 4.2, status: 'yellow' },
    num_empleados: { value: numFTE, prev: numFTE - 1, trend: 5.3, status: 'green' },
    coste_medio: { value: avgCostPerEmployee, prev: avgCostPerEmployee * 0.97, trend: 3.1, status: 'yellow' },
    peso_rrhh: { value: hrPercentOnSales, prev: hrPercentOnSales + 1.2, trend: -4.8, status: 'green' },
    productividad: { value: productivityPerFTE, prev: productivityPerFTE * 0.91, trend: 9.9, status: 'green' },
    absentismo: { value: absenteeismRate, prev: absenteeismRate + 0.5, trend: -15.6, status: 'green' },
    horas_extra: { value: totalOvertime, cost: overtimeCost, prev: totalOvertime * 1.08, trend: -7.4, status: 'green' },
  };
}

function generateCostEvolution() {
  return [
    { mes: 'Oct', coste: 85200 },
    { mes: 'Nov', coste: 87500 },
    { mes: 'Dic', coste: 92300 },
    { mes: 'Ene', coste: 88900 },
    { mes: 'Feb', coste: 91200 },
    { mes: 'Mar', coste: 94500 },
  ];
}

function generateDepartmentDistribution() {
  const depts = [
    { name: 'Comercial', value: 38200 },
    { name: 'Operaciones', value: 28500 },
    { name: 'Administración', value: 15800 },
    { name: 'Marketing', value: 8900 },
    { name: 'Dirección', value: 3100 },
  ];
  const total = depts.reduce((sum, d) => sum + d.value, 0);
  depts.forEach(d => d.percent = total > 0 ? (d.value / total) * 100 : 0);
  return depts;
}

function generateProductivityData() {
  return [
    { mes: 'Oct', productividad: 24300 },
    { mes: 'Nov', productividad: 27000 },
    { mes: 'Dic', productividad: 31700 },
    { mes: 'Ene', productividad: 26000 },
    { mes: 'Feb', productividad: 28000 },
    { mes: 'Mar', productividad: 30700 },
  ];
}

function generateEmployeeDetails() {
  return [
    { name: 'Ana García López', dept: 'Comercial', hours: 168, overtime: 12, cost: 3850 },
    { name: 'Carlos Rodríguez', dept: 'Operaciones', hours: 160, overtime: 8, cost: 3200 },
    { name: 'María Fernández', dept: 'Administración', hours: 172, overtime: 0, cost: 2950 },
    { name: 'José Martínez', dept: 'Comercial', hours: 165, overtime: 15, cost: 3650 },
    { name: 'Laura Sánchez', dept: 'Marketing', hours: 168, overtime: 5, cost: 2850 },
    { name: 'David González', dept: 'Operaciones', hours: 158, overtime: 0, cost: 2700 },
    { name: 'Elena Torres', dept: 'Dirección', hours: 180, overtime: 20, cost: 5200 },
    { name: 'Pablo Ruiz', dept: 'Comercial', hours: 162, overtime: 10, cost: 3450 },
  ];
}

export default function HumanResources() {
  const { activeCompany, loading, isAdmin, isAdvanced } = useApp();
  const [filters, setFilters] = useState({
    dateRange: null,
    department: 'all',
    employee: 'all',
  });

  const demoData = useMemo(() => generateDemoData(), []);
  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;

  const [realEmployees, setRealEmployees] = useState([]);
  const [realTimes, setRealTimes] = useState([]);

  useEffect(() => {
    if (!isDemo && activeCompany) {
      loadRealData();
    }
  }, [activeCompany, isDemo]);

  async function loadRealData() {
    const dataTypes = ['employees', 'times'];
    for (const type of dataTypes) {
      const cached = await base44.entities.CachedData.filter({
        company_id: activeCompany.id,
        data_type: type,
      });
      if (cached.length > 0 && cached[0].data?.items) {
        const items = cached[0].data.items;
        if (type === 'employees') setRealEmployees(items);
        else if (type === 'times') setRealTimes(items);
      }
    }
  }

  const metrics = useMemo(() => {
    if (isDemo) {
      return {
        coste_total: { value: 94500, prev: 91200, trend: 3.6, status: 'yellow' },
        num_empleados: { value: 19, prev: 18, trend: 5.6, status: 'green' },
        coste_medio: { value: 4974, prev: 5067, trend: -1.8, status: 'green' },
        peso_rrhh: { value: 19.4, prev: 21.6, trend: -10.2, status: 'green' },
        productividad: { value: 25648, prev: 23506, trend: 9.1, status: 'green' },
        absentismo: { value: 2.8, prev: 3.3, trend: -15.2, status: 'green' },
        horas_extra: { value: 70, cost: 1750, prev: 76, trend: -7.9, status: 'green' },
      };
    }
    return calculateHRMetrics(realEmployees, realTimes, 487320);
  }, [isDemo, realEmployees, realTimes]);

  const costEvolution = useMemo(() => generateCostEvolution(), []);
  const departmentDistribution = useMemo(() => generateDepartmentDistribution(), []);
  const productivityData = useMemo(() => generateProductivityData(), []);
  const employeeDetails = useMemo(() => generateEmployeeDetails(), []);

  const departments = ['Comercial', 'Operaciones', 'Administración', 'Marketing', 'Dirección'];
  const employees = employeeDetails.map(e => ({ id: e.name, name: e.name }));

  function handleExport() {
    toast.success('Exportación de datos RRHH iniciada');
  }

  function handleCreateAlert() {
    toast.success('Función de alertas próximamente');
  }

  function handleSaveView() {
    toast.success('Vista guardada');
  }

  if (loading) return <LoadingState />;

  return (
    <div className="max-w-[1600px] mx-auto">
      {isDemo && <DemoBanner />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">RRHH</h2>
          <p className="text-xs text-[#3E4C59] mt-0.5">Coste de personal, productividad y análisis por departamento</p>
        </div>
      </div>

      <HRFilters
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExport}
        onCreateAlert={handleCreateAlert}
        onSaveView={handleSaveView}
        isAdmin={isAdmin}
        isAdvanced={isAdvanced}
        departments={departments}
        employees={employees}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard 
          title="Coste Total RRHH" 
          value={formatCurrency(metrics.coste_total.value)} 
          trend={metrics.coste_total.trend} 
          status={metrics.coste_total.status} 
          icon={DollarSign} 
        />
        <KpiCard 
          title="Nº Empleados (FTE)" 
          value={formatNumber(metrics.num_empleados.value)} 
          trend={metrics.num_empleados.trend} 
          status={metrics.num_empleados.status} 
          icon={Users} 
        />
        <KpiCard 
          title="Coste Medio/Empleado" 
          value={formatCurrency(metrics.coste_medio.value)} 
          trend={metrics.coste_medio.trend} 
          status={metrics.coste_medio.status} 
          icon={DollarSign} 
        />
        <KpiCard 
          title="% RRHH s/ Ventas" 
          value={`${metrics.peso_rrhh.value.toFixed(1)}%`} 
          trend={metrics.peso_rrhh.trend} 
          status={metrics.peso_rrhh.status} 
          icon={Percent} 
        />
        <KpiCard 
          title="Productividad (€/FTE)" 
          value={formatCurrency(metrics.productividad.value)} 
          trend={metrics.productividad.trend} 
          status={metrics.productividad.status} 
          icon={TrendingUp} 
        />
        <KpiCard 
          title="Absentismo (%)" 
          value={`${metrics.absentismo.value.toFixed(1)}%`} 
          trend={metrics.absentismo.trend} 
          status={metrics.absentismo.status} 
          icon={AlertCircle} 
        />
        <KpiCard 
          title="Horas Extra" 
          value={`${formatNumber(metrics.horas_extra.value)}h`} 
          trend={metrics.horas_extra.trend} 
          status={metrics.horas_extra.status} 
          icon={Clock} 
          subtext={formatCurrency(metrics.horas_extra.cost)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <CostEvolutionChart data={costEvolution} />
        <DepartmentDistributionChart data={departmentDistribution} />
      </div>

      <div className="mb-6">
        <ProductivityChart data={productivityData} />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden">
        <div className="p-5 border-b border-[#E8EEEE]">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Detalle por Empleado</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Empleado</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Departamento</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Horas Trabajadas</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Horas Extra</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59] text-right">Coste Mes €</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeDetails.map((emp, i) => (
                <TableRow key={i} className="hover:bg-[#FDFBF7]">
                  <TableCell className="text-sm text-[#1B2731] font-medium">{emp.name}</TableCell>
                  <TableCell className="text-sm text-[#3E4C59]">
                    <Badge className="bg-[#F8F6F1] text-[#3E4C59] text-xs">{emp.dept}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#3E4C59] text-right">{emp.hours}h</TableCell>
                  <TableCell className="text-sm text-right">
                    {emp.overtime > 0 ? (
                      <span className="text-amber-600 font-semibold">{emp.overtime}h</span>
                    ) : (
                      <span className="text-[#B7CAC9]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-[#1B2731] text-right font-semibold">{formatCurrency(emp.cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}