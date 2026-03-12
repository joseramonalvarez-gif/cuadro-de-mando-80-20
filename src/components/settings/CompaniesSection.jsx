import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

export default function CompaniesSection({ companies, onUpdate }) {
  const [verifying, setVerifying] = useState({});
  const [syncing, setSyncing] = useState({});
  const [showKey, setShowKey] = useState({});

  async function handleVerifyConnection(companyId, apiKey) {
    setVerifying({ ...verifying, [companyId]: true });
    
    try {
      const response = await base44.functions.invoke('verifyHoldedConnection', {
        apiKey
      });

      if (response.data.valid) {
        alert('✅ Conexión verificada correctamente');
      } else {
        alert('❌ API Key inválida');
      }
    } catch (error) {
      alert('❌ Error al verificar: ' + error.message);
    }

    setVerifying({ ...verifying, [companyId]: false });
  }

  async function handleSync(companyId) {
    setSyncing({ ...syncing, [companyId]: true });
    
    try {
      await base44.functions.invoke('holdedApi', {
        companyId,
        action: 'sync_all'
      });
      
      alert('✅ Sincronización completada');
      await onUpdate();
    } catch (error) {
      alert('❌ Error en sincronización: ' + error.message);
    }

    setSyncing({ ...syncing, [companyId]: false });
  }

  return (
    <div className="space-y-4">
      {companies.map(company => (
        <div key={company.id} className="bg-white rounded-xl border border-[#E8EEEE] p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre Empresa</Label>
              <Input
                value={company.name}
                onChange={(e) => onUpdate(company.id, { name: e.target.value })}
              />
            </div>

            <div>
              <Label>Modelo de Negocio</Label>
              <Select
                value={company.modelo_negocio}
                onValueChange={(val) => onUpdate(company.id, { modelo_negocio: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="productos">Productos</SelectItem>
                  <SelectItem value="servicios">Servicios</SelectItem>
                  <SelectItem value="mixto">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>API Key Holded</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKey[company.id] ? 'text' : 'password'}
                    value={company.holded_api_key || ''}
                    onChange={(e) => onUpdate(company.id, { holded_api_key: e.target.value })}
                    placeholder="Introduce la API Key de Holded"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey({ ...showKey, [company.id]: !showKey[company.id] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B7CAC9] hover:text-[#3E4C59]"
                  >
                    {showKey[company.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleVerifyConnection(company.id, company.holded_api_key)}
                  disabled={!company.holded_api_key || verifying[company.id]}
                >
                  {verifying[company.id] ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    'Verificar'
                  )}
                </Button>
              </div>
            </div>

            <div className="md:col-span-2 flex gap-3 mt-2">
              <Button
                onClick={() => handleSync(company.id)}
                disabled={syncing[company.id] || !company.holded_api_key}
                className="bg-[#33A19A] hover:bg-[#2A8A84]"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing[company.id] ? 'animate-spin' : ''}`} />
                Actualizar datos ahora
              </Button>

              {company.last_sync_date && (
                <span className="text-sm text-[#3E4C59] self-center">
                  Última sincronización: {new Date(company.last_sync_date).toLocaleString('es-ES')}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}