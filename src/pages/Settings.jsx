import React, { useState, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Key, Building2, Users, Shield, Save, Plus, Trash2, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import LoadingState from '../components/shared/LoadingState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Settings() {
  const { user, activeCompany, isAdmin, loading: appLoading, companies, refreshCompanies } = useApp();
  const queryClient = useQueryClient();

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (activeCompany) {
      setApiKey(activeCompany.holded_api_key || '');
      setCompanyName(activeCompany.name || '');
    }
  }, [activeCompany]);

  if (appLoading) return <LoadingState />;
  if (!isAdmin) {
    return (
      <div className="max-w-[800px] mx-auto text-center py-20">
        <Shield className="w-12 h-12 text-[#B7CAC9] mx-auto mb-3" />
        <p className="text-sm text-[#3E4C59]">Solo los administradores pueden acceder a la configuración</p>
      </div>
    );
  }

  async function saveApiKey() {
    setSaving(true);
    await base44.entities.Company.update(activeCompany.id, {
      holded_api_key: apiKey,
      name: companyName,
      is_demo: !apiKey,
    });
    await refreshCompanies();
    setSaving(false);
  }

  async function createCompany() {
    if (!newCompanyName.trim()) return;
    await base44.entities.Company.create({
      name: newCompanyName,
      is_demo: true,
      allowed_users: [user.email],
    });
    setNewCompanyName('');
    setShowNewCompany(false);
    await refreshCompanies();
  }

  async function updateUserRole(userId, newRole) {
    await base44.entities.User.update(userId, { role: newRole });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }

  const maskedKey = apiKey ? apiKey.slice(0, 8) + '•'.repeat(Math.max(0, apiKey.length - 12)) + apiKey.slice(-4) : '';

  return (
    <div className="max-w-[900px] mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">Configuración</h2>
        <p className="text-xs text-[#3E4C59] mt-0.5">Gestión de la API, empresas y usuarios</p>
      </div>

      {/* API Key Config */}
      <Card className="border-[#E8EEEE]/60 shadow-[0_1px_3px_rgba(27,39,49,0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
            <Key className="w-4 h-4 text-[#33A19A]" /> API Key de Holded
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-[#3E4C59]">Empresa</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 border-[#B7CAC9]" />
          </div>
          <div>
            <Label className="text-xs text-[#3E4C59]">API Key</Label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Introduce tu API Key de Holded"
                  className="border-[#B7CAC9] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B7CAC9] hover:text-[#3E4C59]"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button onClick={saveApiKey} disabled={saving} className="bg-[#33A19A] hover:bg-[#2B8A84] text-white">
                <Save className="w-4 h-4 mr-1.5" /> Guardar
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {apiKey ? (
                <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-xs text-emerald-600">API Key configurada</span></>
              ) : (
                <><AlertTriangle className="w-3.5 h-3.5 text-[#E6A817]" /><span className="text-xs text-[#E6A817]">Sin API Key — modo demo activo</span></>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-company */}
      <Card className="border-[#E8EEEE]/60 shadow-[0_1px_3px_rgba(27,39,49,0.06)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#33A19A]" /> Empresas
            </CardTitle>
            <Dialog open={showNewCompany} onOpenChange={setShowNewCompany}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs border-[#33A19A] text-[#33A19A]">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Añadir
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle className="font-['Space_Grotesk']">Nueva Empresa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <Input placeholder="Nombre de la empresa" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} />
                  <Button onClick={createCompany} className="w-full bg-[#33A19A] hover:bg-[#2B8A84] text-white">Crear Empresa</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {companies.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-[#E8EEEE] hover:bg-[#FDFBF7]">
                <div>
                  <p className="text-sm font-medium text-[#1B2731]">{c.name}</p>
                  <p className="text-xs text-[#B7CAC9]">{c.holded_api_key ? 'API conectada' : 'Sin API Key'}</p>
                </div>
                <Badge className={`text-xs ${c.is_demo ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {c.is_demo ? 'Demo' : 'Producción'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card className="border-[#E8EEEE]/60 shadow-[0_1px_3px_rgba(27,39,49,0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#33A19A]" /> Usuarios y Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-[#E8EEEE] hover:bg-[#FDFBF7]">
                <div>
                  <p className="text-sm font-medium text-[#1B2731]">{u.full_name || u.email}</p>
                  <p className="text-xs text-[#B7CAC9]">{u.email}</p>
                </div>
                <Select value={u.role || 'user'} onValueChange={(v) => updateUserRole(u.id, v)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                    <SelectItem value="user">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            {allUsers.length === 0 && (
              <p className="text-sm text-center text-[#B7CAC9] py-6">No hay usuarios registrados</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}