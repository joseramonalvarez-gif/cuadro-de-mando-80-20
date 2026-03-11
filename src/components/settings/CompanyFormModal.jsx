import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function CompanyFormModal({ company, onClose }) {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    holded_api_key: '',
    allowed_users: (company?.allowed_users || []).join(', '),
  });
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [saving, setSaving] = useState(false);

  async function verifyConnection() {
    if (!formData.holded_api_key) return;
    setVerifying(true);
    setVerificationResult(null);

    try {
      const response = await base44.functions.invoke('verifyHoldedConnection', {
        apiKey: formData.holded_api_key,
      });

      if (response.data?.success) {
        setVerificationResult({ success: true, message: 'Conexión verificada correctamente' });
      } else {
        setVerificationResult({ success: false, message: response.data?.message || 'Error al verificar la conexión' });
      }
    } catch (error) {
      setVerificationResult({ success: false, message: error.message || 'Error de conexión' });
    }

    setVerifying(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        name: formData.name,
        is_demo: false,
        allowed_users: formData.allowed_users.split(',').map(e => e.trim()).filter(Boolean),
      };

      if (formData.holded_api_key) {
        data.holded_api_key = formData.holded_api_key;
      }

      if (company) {
        await base44.entities.Company.update(company.id, data);
      } else {
        await base44.entities.Company.create(data);
      }

      onClose();
    } catch (error) {
      console.error('Save error:', error);
    }

    setSaving(false);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{company ? 'Editar Empresa' : 'Nueva Empresa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre de la Empresa</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>API Key de Holded</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={formData.holded_api_key}
                onChange={e => setFormData({ ...formData, holded_api_key: e.target.value })}
                placeholder={company ? '••••••••' : 'Introduce la API Key'}
              />
              <Button
                type="button"
                variant="outline"
                onClick={verifyConnection}
                disabled={!formData.holded_api_key || verifying}
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar'}
              </Button>
            </div>
            {verificationResult && (
              <div className={`flex items-center gap-2 mt-2 text-xs ${verificationResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {verificationResult.success ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {verificationResult.message}
              </div>
            )}
          </div>

          <div>
            <Label>Usuarios Autorizados (emails separados por comas)</Label>
            <Input
              value={formData.allowed_users}
              onChange={e => setFormData({ ...formData, allowed_users: e.target.value })}
              placeholder="admin@empresa.com, usuario@empresa.com"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#33A19A] hover:bg-[#2B8A84]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (company ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}