import React, { useState } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import LoadingState from '../components/shared/LoadingState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const KPI_OPTIONS = [
  { value: 'ventas_netas', label: 'Ventas Netas' },
  { value: 'margen_bruto', label: 'Margen Bruto (%)' },
  { value: 'ebitda', label: 'EBITDA (%)' },
  { value: 'caja_actual', label: 'Caja Actual' },
  { value: 'dso', label: 'DSO (Días Cobro)' },
  { value: 'morosidad_90', label: 'Morosidad +90d' },
  { value: 'dpo', label: 'DPO (Días Pago)' },
  { value: 'opex_ventas', label: 'OPEX % sobre Ventas' },
];

const SEVERITY_COLORS = {
  green: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
};

export default function Alerts() {
  const { activeCompany, isAdmin, isAdvanced, loading: appLoading } = useApp();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ kpi_name: '', condition: 'above', threshold: '', severity: 'yellow', message: '' });

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', activeCompany?.id],
    queryFn: () => activeCompany ? base44.entities.Alert.filter({ company_id: activeCompany.id }) : [],
    enabled: !!activeCompany,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Alert.create({ ...data, company_id: activeCompany.id, is_active: true }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alerts'] }); setShowForm(false); setForm({ kpi_name: '', condition: 'above', threshold: '', severity: 'yellow', message: '' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  if (appLoading) return <LoadingState />;

  const canCreate = isAdmin || isAdvanced;

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">Alertas</h2>
          <p className="text-xs text-[#3E4C59] mt-0.5">Configura alertas automáticas sobre tus KPIs</p>
        </div>
        {canCreate && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="bg-[#33A19A] hover:bg-[#2B8A84] text-white">
                <Plus className="w-4 h-4 mr-1.5" /> Nueva Alerta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="font-['Space_Grotesk']">Crear Alerta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <Select value={form.kpi_name} onValueChange={(v) => setForm({ ...form, kpi_name: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona KPI" /></SelectTrigger>
                  <SelectContent>
                    {KPI_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Superior a</SelectItem>
                      <SelectItem value="below">Inferior a</SelectItem>
                      <SelectItem value="equals">Igual a</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Umbral" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} />
                </div>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green">Normal</SelectItem>
                    <SelectItem value="yellow">Atención</SelectItem>
                    <SelectItem value="red">Crítico</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Mensaje personalizado (opcional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                <Button
                  className="w-full bg-[#33A19A] hover:bg-[#2B8A84] text-white"
                  onClick={() => createMutation.mutate({ ...form, threshold: Number(form.threshold) })}
                  disabled={!form.kpi_name || !form.threshold}
                >
                  Crear Alerta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? <LoadingState /> : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60">
          <Bell className="w-12 h-12 text-[#B7CAC9] mx-auto mb-3" />
          <p className="text-sm text-[#3E4C59]">No hay alertas configuradas</p>
          {canCreate && <p className="text-xs text-[#B7CAC9] mt-1">Crea tu primera alerta para monitorizar tus KPIs</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const kpiLabel = KPI_OPTIONS.find(o => o.value === alert.kpi_name)?.label || alert.kpi_name;
            const condLabel = alert.condition === 'above' ? 'superior a' : alert.condition === 'below' ? 'inferior a' : 'igual a';
            return (
              <div key={alert.id} className="bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${alert.severity === 'red' ? 'bg-[#E05252]' : alert.severity === 'yellow' ? 'bg-[#E6A817]' : 'bg-emerald-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1B2731]">{kpiLabel} {condLabel} {alert.threshold}</p>
                  {alert.message && <p className="text-xs text-[#3E4C59] mt-0.5">{alert.message}</p>}
                </div>
                <Badge className={`${SEVERITY_COLORS[alert.severity]} text-xs`}>
                  {alert.severity === 'red' ? 'Crítico' : alert.severity === 'yellow' ? 'Atención' : 'Normal'}
                </Badge>
                {canCreate && (
                  <Button variant="ghost" size="icon" className="text-[#B7CAC9] hover:text-[#E05252]" onClick={() => deleteMutation.mutate(alert.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}