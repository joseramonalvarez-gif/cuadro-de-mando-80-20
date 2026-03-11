import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_KPIS = {
  ventas: [
    { value: 'ventas_netas', label: 'Ventas Netas' },
    { value: 'margen_bruto', label: 'Margen Bruto %' },
    { value: 'ticket_medio', label: 'Ticket Medio' },
    { value: 'dso', label: 'DSO (Días)' },
  ],
  compras: [
    { value: 'compras_totales', label: 'Compras Totales' },
    { value: 'margen_compras', label: 'Margen sobre Compras' },
    { value: 'dpo', label: 'DPO (Días)' },
  ],
  tesoreria: [
    { value: 'saldo_caja', label: 'Saldo Total Caja' },
    { value: 'cash_in', label: 'Cash-in Mes' },
    { value: 'cash_out', label: 'Cash-out Mes' },
    { value: 'runway', label: 'Runway (Meses)' },
    { value: 'morosidad_90', label: 'Morosidad +90d' },
  ],
  fiscalidad: [
    { value: 'saldo_iva', label: 'Saldo IVA' },
    { value: 'vencimiento_fiscal', label: 'Vencimiento Fiscal Próximo' },
  ],
  rrhh: [
    { value: 'coste_rrhh', label: 'Coste Total RRHH' },
    { value: 'peso_rrhh', label: '% RRHH sobre Ventas' },
    { value: 'absentismo', label: 'Absentismo %' },
  ],
  producto: [
    { value: 'ruptura_stock', label: 'Rupturas de Stock' },
    { value: 'rotacion', label: 'Rotación Media' },
    { value: 'tasa_devolucion', label: '% Devoluciones' },
  ],
};

export default function AlertFormModal({ open, onClose, onSave, alert = null }) {
  const [formData, setFormData] = useState(alert || {
    module: 'ventas',
    kpi_name: '',
    kpi_label: '',
    condition: 'greater_than',
    threshold: '',
    period: 'daily',
    severity: 'yellow',
    channels: ['push'],
  });

  const availableKPIs = ALL_KPIS[formData.module] || [];

  function handleKPIChange(value) {
    const kpi = availableKPIs.find(k => k.value === value);
    setFormData({ ...formData, kpi_name: value, kpi_label: kpi?.label || value });
  }

  function handleChannelToggle(channel) {
    const channels = formData.channels.includes(channel)
      ? formData.channels.filter(c => c !== channel)
      : [...formData.channels, channel];
    setFormData({ ...formData, channels });
  }

  function handleSubmit() {
    if (!formData.kpi_name || !formData.threshold) return;
    onSave(formData);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{alert ? 'Editar Alerta' : 'Nueva Alerta'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label>Módulo</Label>
            <Select value={formData.module} onValueChange={(v) => setFormData({ ...formData, module: v, kpi_name: '' })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ventas">Ventas</SelectItem>
                <SelectItem value="compras">Compras</SelectItem>
                <SelectItem value="tesoreria">Tesorería</SelectItem>
                <SelectItem value="fiscalidad">Fiscalidad</SelectItem>
                <SelectItem value="rrhh">RRHH</SelectItem>
                <SelectItem value="producto">Producto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>KPI a Monitorizar</Label>
            <Select value={formData.kpi_name} onValueChange={handleKPIChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un KPI" />
              </SelectTrigger>
              <SelectContent>
                {availableKPIs.map(kpi => (
                  <SelectItem key={kpi.value} value={kpi.value}>{kpi.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Condición</Label>
              <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greater_than">Mayor que</SelectItem>
                  <SelectItem value="less_than">Menor que</SelectItem>
                  <SelectItem value="equals">Igual a</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Umbral</Label>
              <Input
                type="number"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) })}
                placeholder="Valor"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Período</Label>
              <Select value={formData.period} onValueChange={(v) => setFormData({ ...formData, period: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severidad</Label>
              <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yellow">Amarillo</SelectItem>
                  <SelectItem value="red">Rojo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Canales de Notificación</Label>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.channels.includes('email')}
                  onCheckedChange={() => handleChannelToggle('email')}
                />
                <span className="text-sm">Email</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.channels.includes('push')}
                  onCheckedChange={() => handleChannelToggle('push')}
                />
                <span className="text-sm">Push (In-app)</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} className="bg-[#33A19A] hover:bg-[#2A8A84]">
            {alert ? 'Actualizar' : 'Crear Alerta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}