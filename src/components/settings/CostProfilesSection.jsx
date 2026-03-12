import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

export default function CostProfilesSection({ company, onUpdate }) {
  const [profiles, setProfiles] = useState([
    { id: '1', name: 'Junior', costeHora: 25, horasJornada: 8 },
    { id: '2', name: 'Senior', costeHora: 45, horasJornada: 8 },
    { id: '3', name: 'Socio', costeHora: 60, horasJornada: 6 }
  ]);

  const [employees, setEmployees] = useState([]);
  const [diasLaborables, setDiasLaborables] = useState(21);

  const modeloNegocio = company?.modelo_negocio;
  const showSection = modeloNegocio === 'servicios' || modeloNegocio === 'mixto';

  if (!showSection) {
    return null;
  }

  function addProfile() {
    const newProfile = {
      id: Date.now().toString(),
      name: 'Nuevo Perfil',
      costeHora: 0,
      horasJornada: 8
    };
    setProfiles([...profiles, newProfile]);
  }

  function removeProfile(id) {
    setProfiles(profiles.filter(p => p.id !== id));
  }

  function updateProfile(id, field, value) {
    setProfiles(profiles.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  }

  function saveConfiguration() {
    const config = {
      perfiles: profiles,
      horas_jornada: diasLaborables
    };
    
    onUpdate(company.id, { config_empleados: config });
    alert('✅ Configuración de costes guardada');
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFAF3] border border-[#E6A817]/20 rounded-lg p-4">
        <p className="text-sm text-[#3E4C59]">
          ⚠️ <strong>Importante:</strong> Esta configuración es crítica para calcular márgenes reales, 
          ocupación del equipo y rentabilidad por proyecto. Sin ella, los KPIs de RRHH serán aproximados.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
            Perfiles de Coste
          </h3>
          <Button onClick={addProfile} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Añadir Perfil
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Perfil</TableHead>
              <TableHead>Coste Hora (€)</TableHead>
              <TableHead>Horas Jornada</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map(profile => (
              <TableRow key={profile.id}>
                <TableCell>
                  <Input
                    value={profile.name}
                    onChange={(e) => updateProfile(profile.id, 'name', e.target.value)}
                    className="max-w-[200px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={profile.costeHora}
                    onChange={(e) => updateProfile(profile.id, 'costeHora', parseFloat(e.target.value))}
                    className="max-w-[120px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={profile.horasJornada}
                    onChange={(e) => updateProfile(profile.id, 'horasJornada', parseFloat(e.target.value))}
                    className="max-w-[120px]"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProfile(profile.id)}
                  >
                    <Trash2 className="w-4 h-4 text-[#E05252]" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Días laborables/mes (promedio)</Label>
          <Input
            type="number"
            value={diasLaborables}
            onChange={(e) => setDiasLaborables(parseInt(e.target.value))}
          />
        </div>
      </div>

      <Button onClick={saveConfiguration}>
        Guardar Configuración
      </Button>
    </div>
  );
}