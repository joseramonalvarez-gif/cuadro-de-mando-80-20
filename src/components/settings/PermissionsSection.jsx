import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

const MODULES = [
  { id: 'home', name: 'Dirección General', always: true },
  { id: 'sales', name: 'Ventas / Clientes', always: true },
  { id: 'purchases', name: 'Compras / Proveedores', always: true },
  { id: 'treasury', name: 'Tesorería', always: true },
  { id: 'taxes', name: 'Fiscalidad', always: true },
  { id: 'hr', name: 'RRHH', condition: ['servicios', 'mixto'] },
  { id: 'products', name: 'Producto / ABC', condition: ['productos', 'mixto'] },
  { id: 'stock', name: 'Stock / Inventario', condition: ['productos', 'mixto'] },
  { id: 'capacity', name: 'Capacidad y Ocupación', condition: ['servicios', 'mixto'] },
  { id: 'mrr', name: 'Recurrencia / MRR', condition: ['servicios', 'mixto'] },
  { id: 'projects', name: 'Proyectos', condition: ['servicios', 'mixto'] },
  { id: 'alerts', name: 'Alertas', always: true },
  { id: 'chat', name: 'Chat Inteligente', always: true },
  { id: 'settings', name: 'Configuración', adminOnly: true }
];

export default function PermissionsSection({ modeloNegocio, onSave }) {
  const [permissions, setPermissions] = useState({
    admin: MODULES.map(m => m.id),
    avanzado: MODULES.filter(m => !m.adminOnly).map(m => m.id),
    user: ['home', 'sales', 'treasury', 'alerts']
  });

  const visibleModules = MODULES.filter(module => {
    if (module.always) return true;
    if (module.adminOnly) return true;
    if (module.condition) {
      return module.condition.includes(modeloNegocio);
    }
    return true;
  });

  function togglePermission(role, moduleId) {
    const current = permissions[role] || [];
    const newPermissions = current.includes(moduleId)
      ? current.filter(id => id !== moduleId)
      : [...current, moduleId];

    setPermissions({
      ...permissions,
      [role]: newPermissions
    });
  }

  function handleSave() {
    onSave(permissions);
    alert('✅ Permisos actualizados');
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#E8EEEE]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Módulo</TableHead>
              <TableHead className="text-center">Admin</TableHead>
              <TableHead className="text-center">Avanzado</TableHead>
              <TableHead className="text-center">Normal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleModules.map(module => (
              <TableRow key={module.id}>
                <TableCell className="font-medium">{module.name}</TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={permissions.admin?.includes(module.id)}
                    onCheckedChange={() => togglePermission('admin', module.id)}
                    disabled={module.adminOnly}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={permissions.avanzado?.includes(module.id)}
                    onCheckedChange={() => togglePermission('avanzado', module.id)}
                    disabled={module.adminOnly}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={permissions.user?.includes(module.id)}
                    onCheckedChange={() => togglePermission('user', module.id)}
                    disabled={module.adminOnly}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button onClick={handleSave}>
        Aplicar Cambios
      </Button>
    </div>
  );
}