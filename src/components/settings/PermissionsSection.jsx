import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from 'lucide-react';

const MODULES = [
  { id: 'home', label: 'Dashboard Principal' },
  { id: 'sales', label: 'Ventas' },
  { id: 'purchases', label: 'Compras' },
  { id: 'treasury', label: 'Tesorería' },
  { id: 'taxes', label: 'Fiscalidad' },
  { id: 'hr', label: 'RRHH' },
  { id: 'products', label: 'Productos/ABC' },
  { id: 'alerts', label: 'Alertas' },
  { id: 'chat', label: 'Chat Inteligente' },
];

const ROLES = ['admin', 'advanced', 'user'];

export default function PermissionsSection() {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  async function loadPermissions() {
    setLoading(true);
    try {
      const configs = await base44.entities.SystemConfig.filter({ key: 'role_permissions' });
      if (configs.length > 0) {
        setPermissions(configs[0].value || {});
      } else {
        // Default permissions
        const defaults = {};
        MODULES.forEach(mod => {
          defaults[mod.id] = { admin: true, advanced: true, user: true };
        });
        setPermissions(defaults);
      }
    } catch (error) {
      console.error('Load permissions error:', error);
    }
    setLoading(false);
  }

  async function savePermissions() {
    setSaving(true);
    try {
      const configs = await base44.entities.SystemConfig.filter({ key: 'role_permissions' });
      if (configs.length > 0) {
        await base44.entities.SystemConfig.update(configs[0].id, { value: permissions });
      } else {
        await base44.entities.SystemConfig.create({
          key: 'role_permissions',
          value: permissions,
          category: 'permissions',
          description: 'Module access permissions by role',
        });
      }
    } catch (error) {
      console.error('Save permissions error:', error);
    }
    setSaving(false);
  }

  function togglePermission(moduleId, role) {
    setPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [role]: !prev[moduleId]?.[role],
      },
    }));
  }

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8EEEE] p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1B2731]">Permisos por Rol y Módulo</h3>
          <p className="text-xs text-[#3E4C59] mt-1">Controla qué módulos puede ver cada rol</p>
        </div>
        <Button onClick={savePermissions} disabled={saving} className="bg-[#33A19A] hover:bg-[#2B8A84]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#E8EEEE]">
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#1B2731]">Módulo</th>
              {ROLES.map(role => (
                <th key={role} className="text-center py-3 px-4 text-sm font-semibold text-[#1B2731]">
                  {role === 'admin' ? 'Admin' : role === 'advanced' ? 'Avanzado' : 'Normal'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map(module => (
              <tr key={module.id} className="border-b border-[#E8EEEE] hover:bg-[#F8F6F1]">
                <td className="py-3 px-4 text-sm text-[#3E4C59]">{module.label}</td>
                {ROLES.map(role => (
                  <td key={role} className="text-center py-3 px-4">
                    <Checkbox
                      checked={permissions[module.id]?.[role] || false}
                      onCheckedChange={() => togglePermission(module.id, role)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}