import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function EmployeeProductivityTable({ empleados, modeloNegocio }) {
  const formatCurrency = (val) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  const isServicios = modeloNegocio === 'servicios' || modeloNegocio === 'mixto';

  return (
    <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
      <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] mb-4">
        Productividad por Empleado
      </h3>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Perfil</TableHead>
              {isServicios && (
                <>
                  <TableHead>Hrs Disponibles</TableHead>
                  <TableHead>Hrs Registradas</TableHead>
                  <TableHead>Hrs Facturables</TableHead>
                  <TableHead>Ocupación %</TableHead>
                </>
              )}
              <TableHead>Coste €</TableHead>
              {isServicios && (
                <>
                  <TableHead>Ingreso Gen. €</TableHead>
                  <TableHead>Margen €</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {empleados.map((emp, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium text-[#1B2731]">
                  {emp.nombre}
                </TableCell>
                <TableCell className="text-[#3E4C59]">
                  {emp.perfil || 'N/A'}
                </TableCell>
                {isServicios && (
                  <>
                    <TableCell className="text-[#3E4C59]">
                      {Math.round(emp.horasDisponibles || 0)}h
                    </TableCell>
                    <TableCell className="text-[#3E4C59]">
                      {Math.round(emp.horasRegistradas || 0)}h
                    </TableCell>
                    <TableCell className="font-semibold text-[#33A19A]">
                      {Math.round(emp.horasFacturables || 0)}h
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        emp.ocupacion > 75 
                          ? 'bg-[#E6F7F6] text-[#33A19A]' 
                          : emp.ocupacion >= 60 
                          ? 'bg-[#FFF4E6] text-[#E6A817]'
                          : 'bg-[#FFE6E6] text-[#E05252]'
                      }>
                        {emp.ocupacion.toFixed(0)}%
                      </Badge>
                    </TableCell>
                  </>
                )}
                <TableCell className="font-semibold text-[#1B2731]">
                  {formatCurrency(emp.coste || 0)}
                </TableCell>
                {isServicios && (
                  <>
                    <TableCell className="font-semibold text-[#33A19A]">
                      {formatCurrency(emp.ingresoGenerado || 0)}
                    </TableCell>
                    <TableCell className={emp.margen >= 0 ? 'text-[#33A19A] font-semibold' : 'text-[#E05252] font-semibold'}>
                      {formatCurrency(emp.margen || 0)}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {empleados.length === 0 && (
        <div className="text-center py-8 text-[#B7CAC9]">
          No hay datos de empleados disponibles
        </div>
      )}
    </div>
  );
}