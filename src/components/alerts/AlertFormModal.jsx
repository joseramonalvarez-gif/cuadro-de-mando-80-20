import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const KPI_OPTIONS = {
  general: [
    { value: 'dso_global', label: 'DSO Global (días)' },
    { value: 'morosidad_90d', label: 'Morosidad +90d (%)' },
    { value: 'saldo_caja', label: 'Saldo Caja (€)' },
    { value: 'margen_bruto', label: 'Margen Bruto (%)' }
  ],
  productos: [
    { value: 'dependencia_proveedor', label: 'Dependencia Proveedor (%)' },
    { value: 'ruptura_stock', label: 'Ruptura Stock Clase A' },
    { value: 'concentracion_cliente', label: 'Concentración Top Cliente (%)' }
  ],
  servicios: [
    { value: 'ocupacion_equipo', label: 'Ocupación Equipo (%)' },
    { value: 'churn_mrr', label: 'Churn MRR (%)' },
    { value: 'margen_hora', label: 'Margen por Hora (€)' },
    { value: 'desviacion_proyecto', label: 'Desviación Proyecto (%)' },
    { value: 'pct_subcontratacion', label: '% Subcontratación' }
  ]
};

export default function AlertFormModal({ open, onClose, onSave, alert, modeloNegocio }) {
  const [formData, setFormData] = useState({
    kpi_name: '',
    kpi_label: '',
    condition: 'greater_than',
    threshold: 0,
    period: 'daily',
    channels: ['push'],
    severity: 'yellow'
  });

  useEffect(() => {
    if (alert) {
      setFormData({
        kpi_name: alert.kpi_name || '',
        kpi_label: alert.kpi_label || '',
        condition: alert.condition || 'greater_than',
        threshold: alert.threshold || 0,
        period: alert.period || 'daily',
        channels: alert.channels || ['push'],
        severity: alert.severity || 'yellow'
      });
    } else {
      setFormData({
        kpi_name: '',
        kpi_label: '',
        condition: 'greater_than',
        threshold: 0,
        period: 'daily',
        channels: ['push'],
        severity: 'yellow'
      });
    }
  }, [alert, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const allKPIs = [
    ...KPI_OPTIONS.general,
    ...(modeloNegocio === 'productos' || modeloNegocio === 'mixto' ? KPI_OPTIONS.productos : []),
    ...(modeloNegocio === 'servicios' || modeloNegocio === 'mixto' ? KPI_OPTIONS.servicios : [])
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{alert ? 'Editar Alerta' : 'Nueva Alerta'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>KPI a Monitorizar</Label>
            <Select
              value={formData.kpi_name}
              onValueChange={(val) => {
                const kpi = allKPIs.find(k => k.value === val);
                setFormData({
                  ...formData,
                  kpi_name: val,
                  kpi_label: kpi?.label || val
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un KPI" />
              </SelectTrigger>
              <SelectContent>
                {allKPIs.map(kpi => (
                  <SelectItem key={kpi.value} value={kpi.value}>
                    {kpi.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Condición</Label>
              <Select
                value={formData.condition}
                onValueChange={(val) => setFormData({ ...formData, condition: val })}
              >
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
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Período Evaluación</Label>
              <Select
                value={formData.period}
                onValueChange={(val) => setFormData({ ...formData, period: val })}
              >
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
              <Select
                value={formData.severity}
                onValueChange={(val) => setFormData({ ...formData, severity: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yellow">🟡 Aviso</SelectItem>
                  <SelectItem value="red">🔴 Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {alert ? 'Guardar Cambios' : 'Crear Alerta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}