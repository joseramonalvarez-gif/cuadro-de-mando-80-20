import React from 'react';
import ModulePage from '../components/shared/ModulePage';
import DataTable from '../components/shared/DataTable';
import { formatCurrency } from '../components/shared/DemoData';
import { Users, Clock, DollarSign, UserCheck } from 'lucide-react';
import KpiCard from '../components/shared/KpiCard';
import { Badge } from "@/components/ui/badge";

const EMPLOYEES = [
  { name: 'Ana García López', dept: 'Comercial', position: 'Directora Comercial', salary: 3800, status: 'Activo', hours: '168h' },
  { name: 'Carlos Martínez Ruiz', dept: 'Tecnología', position: 'Desarrollador Senior', salary: 3200, status: 'Activo', hours: '172h' },
  { name: 'María Fernández Gil', dept: 'Administración', position: 'Contable', salary: 2600, status: 'Activo', hours: '165h' },
  { name: 'Pedro Sánchez Díaz', dept: 'Comercial', position: 'Comercial', salary: 2400, status: 'Baja', hours: '0h' },
  { name: 'Laura Torres Vega', dept: 'Marketing', position: 'Responsable MKT', salary: 2800, status: 'Activo', hours: '170h' },
  { name: 'David Jiménez Mora', dept: 'Tecnología', position: 'Diseñador UX', salary: 2500, status: 'Activo', hours: '168h' },
];

const STATUS_COLORS = {
  Activo: 'bg-emerald-100 text-emerald-700',
  Baja: 'bg-red-100 text-red-700',
};

const COLUMNS = [
  { header: 'Nombre', key: 'name' },
  { header: 'Departamento', key: 'dept' },
  { header: 'Puesto', key: 'position' },
  { header: 'Salario Bruto', align: 'right', render: (r) => formatCurrency(r.salary) },
  { header: 'Horas Mes', align: 'right', key: 'hours' },
  { header: 'Estado', render: (r) => (
    <Badge className={`${STATUS_COLORS[r.status]} text-xs font-medium`}>{r.status}</Badge>
  )},
];

export default function HumanResources() {
  return (
    <ModulePage title="RRHH" subtitle="Gestión de personal, nóminas y control horario">
      {() => (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard title="Empleados Activos" value="5" trend={0} status="green" icon={UserCheck} />
            <KpiCard title="Coste Nómina Mes" value={formatCurrency(17300)} trend={2.1} status="yellow" icon={DollarSign} />
            <KpiCard title="Horas Medias" value="168,6h" trend={-0.5} status="green" icon={Clock} />
            <KpiCard title="Tasa Rotación" value="4,2 %" trend={-12.5} status="green" icon={Users} />
          </div>

          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-3">Plantilla</h3>
          <DataTable columns={COLUMNS} data={EMPLOYEES} />
        </>
      )}
    </ModulePage>
  );
}