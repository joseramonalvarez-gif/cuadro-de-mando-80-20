import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import LoadingState from '../components/shared/LoadingState';
import DemoBanner from '../components/shared/DemoBanner';
import AlertFilters from '../components/alerts/AlertFilters';
import AlertFormModal from '../components/alerts/AlertFormModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../components/shared/DemoData';

const SYSTEM_ALERTS = [
  { kpi_name: 'dso', kpi_label: 'DSO', module: 'ventas', condition: 'greater_than', threshold: 60, severity: 'yellow', period: 'daily' },
  { kpi_name: 'dso', kpi_label: 'DSO', module: 'ventas', condition: 'greater_than', threshold: 90, severity: 'red', period: 'daily' },
  { kpi_name: 'morosidad_90', kpi_label: 'Morosidad +90d', module: 'tesoreria', condition: 'greater_than', threshold: 5, severity: 'red', period: 'daily' },
  { kpi_name: 'saldo_caja', kpi_label: 'Saldo Caja', module: 'tesoreria', condition: 'less_than', threshold: 30000, severity: 'yellow', period: 'daily' },
  { kpi_name: 'saldo_caja', kpi_label: 'Saldo Caja', module: 'tesoreria', condition: 'less_than', threshold: 10000, severity: 'red', period: 'daily' },
  { kpi_name: 'concentracion_proveedor', kpi_label: 'Proveedor > 30%', module: 'compras', condition: 'greater_than', threshold: 30, severity: 'yellow', period: 'monthly' },
  { kpi_name: 'margen_bruto', kpi_label: 'Margen Bruto', module: 'ventas', condition: 'less_than', threshold: 25, severity: 'yellow', period: 'monthly' },
  { kpi_name: 'ruptura_stock', kpi_label: 'Ruptura Stock Clase A', module: 'producto', condition: 'greater_than', threshold: 0, severity: 'red', period: 'daily' },
  { kpi_name: 'vencimiento_fiscal', kpi_label: 'Vencimiento Fiscal 15d', module: 'fiscalidad', condition: 'less_than', threshold: 15, severity: 'yellow', period: 'daily' },
  { kpi_name: 'vencimiento_fiscal', kpi_label: 'Vencimiento Fiscal 5d', module: 'fiscalidad', condition: 'less_than', threshold: 5, severity: 'red', period: 'daily' },
];

export default function Alerts() {
  const { activeCompany, user, loading, isAdmin, isAdvanced } = useApp();
  const [filters, setFilters] = useState({
    module: 'todos',
    status: 'todas',
    creator: 'all',
  });
  
  const [alerts, setAlerts] = useState([]);
  const [alertLogs, setAlertLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;

  useEffect(() => {
    if (activeCompany && !initialized) {
      initializeSystemAlerts();
      setInitialized(true);
    }
    if (activeCompany) {
      loadAlerts();
      loadAlertLogs();
    }
  }, [activeCompany]);

  async function initializeSystemAlerts() {
    const existing = await base44.entities.Alert.filter({ company_id: activeCompany.id, is_system: true });
    if (existing.length > 0) return;

    for (const sysAlert of SYSTEM_ALERTS) {
      await base44.entities.Alert.create({
        ...sysAlert,
        company_id: activeCompany.id,
        is_system: true,
        status: 'active',
        channels: ['push', 'email'],
        assigned_users: [user.email],
        created_by: 'system',
      });
    }
    toast.success('Alertas del sistema inicializadas');
  }

  async function loadAlerts() {
    let query = { company_id: activeCompany.id };
    
    if (!isAdmin) {
      query = {
        ...query,
        assigned_users: { $in: [user.email] },
      };
    }

    const allAlerts = await base44.entities.Alert.list('-created_date');
    setAlerts(allAlerts.filter(a => a.company_id === activeCompany.id));
  }

  async function loadAlertLogs() {
    const logs = await base44.entities.AlertLog.filter({
      company_id: activeCompany.id,
    }, '-created_date', 50);
    setAlertLogs(logs);
  }

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (filters.module !== 'todos' && alert.module !== filters.module) return false;
      if (filters.status !== 'todas') {
        const statusMap = { activas: 'active', pausadas: 'paused', disparadas: 'triggered' };
        if (alert.status !== statusMap[filters.status]) return false;
      }
      if (isAdmin && filters.creator !== 'all') {
        if (filters.creator === 'system' && !alert.is_system) return false;
        if (filters.creator === 'users' && alert.is_system) return false;
      }
      return true;
    });
  }, [alerts, filters, isAdmin]);

  async function handleSaveAlert(formData) {
    if (editingAlert) {
      await base44.entities.Alert.update(editingAlert.id, {
        ...formData,
        company_id: activeCompany.id,
        created_by: user.email,
      });
      toast.success('Alerta actualizada');
    } else {
      await base44.entities.Alert.create({
        ...formData,
        company_id: activeCompany.id,
        status: 'active',
        created_by: user.email,
        assigned_users: [user.email],
      });
      toast.success('Alerta creada');
    }
    setShowModal(false);
    setEditingAlert(null);
    loadAlerts();
  }

  async function handleToggleStatus(alert) {
    const newStatus = alert.status === 'active' ? 'paused' : 'active';
    await base44.entities.Alert.update(alert.id, { status: newStatus });
    toast.success(`Alerta ${newStatus === 'active' ? 'activada' : 'pausada'}`);
    loadAlerts();
  }

  async function handleDeleteAlert(alertId) {
    await base44.entities.Alert.delete(alertId);
    toast.success('Alerta eliminada');
    loadAlerts();
  }

  function handleEditAlert(alert) {
    setEditingAlert(alert);
    setShowModal(true);
  }

  function getConditionLabel(condition) {
    const labels = {
      greater_than: 'Mayor que',
      less_than: 'Menor que',
      equals: 'Igual a',
    };
    return labels[condition] || condition;
  }

  function getPeriodLabel(period) {
    const labels = {
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual',
      quarterly: 'Trimestral',
    };
    return labels[period] || period;
  }

  function formatThreshold(value, kpi) {
    if (kpi.includes('saldo') || kpi.includes('cash') || kpi.includes('coste')) {
      return formatCurrency(value);
    }
    if (kpi.includes('margen') || kpi.includes('peso') || kpi.includes('concentracion')) {
      return `${value}%`;
    }
    return value.toString();
  }

  if (loading) return <LoadingState />;

  return (
    <div className="max-w-[1600px] mx-auto">
      {isDemo && <DemoBanner />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">Alertas</h2>
          <p className="text-xs text-[#3E4C59] mt-0.5">Gestión y configuración de notificaciones automáticas</p>
        </div>
      </div>

      <AlertFilters
        filters={filters}
        onFilterChange={setFilters}
        onCreateAlert={() => { setEditingAlert(null); setShowModal(true); }}
        isAdmin={isAdmin}
        isAdvanced={isAdvanced}
      />

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden mb-6">
        <div className="p-5 border-b border-[#E8EEEE]">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Alertas Configuradas</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">KPI</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Módulo</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Condición</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Umbral</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Período</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Estado</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Última Disparada</TableHead>
                {(isAdmin || isAdvanced) && (
                  <TableHead className="text-xs font-semibold text-[#3E4C59]">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-[#B7CAC9] py-8">
                    No hay alertas configuradas
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlerts.map((alert, i) => (
                  <TableRow key={i} className="hover:bg-[#FDFBF7]">
                    <TableCell className="text-sm text-[#1B2731] font-medium">
                      {alert.kpi_label}
                      {alert.is_system && (
                        <Badge className="ml-2 bg-[#F8F6F1] text-[#3E4C59] text-xs">Sistema</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[#3E4C59] capitalize">{alert.module}</TableCell>
                    <TableCell className="text-sm text-[#3E4C59]">{getConditionLabel(alert.condition)}</TableCell>
                    <TableCell className="text-sm text-[#1B2731] font-semibold">
                      {formatThreshold(alert.threshold, alert.kpi_name)}
                    </TableCell>
                    <TableCell className="text-sm text-[#3E4C59]">{getPeriodLabel(alert.period)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={`${
                          alert.status === 'triggered' ? 'bg-red-500 text-white' :
                          alert.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-[#B7CAC9] text-white'
                        } text-xs`}>
                          {alert.status === 'triggered' ? 'Disparada' : alert.status === 'active' ? 'Activa' : 'Pausada'}
                        </Badge>
                        {alert.severity === 'red' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#3E4C59]">
                      {alert.last_triggered ? new Date(alert.last_triggered).toLocaleDateString('es-ES') : '—'}
                    </TableCell>
                    {(isAdmin || isAdvanced) && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={alert.status === 'active'}
                            onCheckedChange={() => handleToggleStatus(alert)}
                            disabled={alert.is_system && !isAdmin}
                          />
                          {(!alert.is_system || isAdmin) && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleEditAlert(alert)}>
                                <Pencil className="w-4 h-4 text-[#3E4C59]" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteAlert(alert.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden">
        <div className="p-5 border-b border-[#E8EEEE]">
          <h3 className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">Historial de Alertas Disparadas</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F6F1]">
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Fecha</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">KPI</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Valor Disparado</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Umbral</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Severidad</TableHead>
                <TableHead className="text-xs font-semibold text-[#3E4C59]">Usuarios Notificados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[#B7CAC9] py-8">
                    No hay historial de alertas
                  </TableCell>
                </TableRow>
              ) : (
                alertLogs.slice(0, 20).map((log, i) => (
                  <TableRow key={i} className="hover:bg-[#FDFBF7]">
                    <TableCell className="text-sm text-[#1B2731]">
                      {new Date(log.created_date).toLocaleString('es-ES')}
                    </TableCell>
                    <TableCell className="text-sm text-[#1B2731] font-medium">{log.kpi_label}</TableCell>
                    <TableCell className="text-sm text-[#1B2731] font-semibold">
                      {formatThreshold(log.triggered_value, log.kpi_name)}
                    </TableCell>
                    <TableCell className="text-sm text-[#3E4C59]">
                      {formatThreshold(log.threshold, log.kpi_name)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${log.severity === 'red' ? 'bg-red-500' : 'bg-amber-500'} text-white text-xs`}>
                        {log.severity === 'red' ? 'Crítico' : 'Aviso'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#3E4C59]">
                      {(log.notified_users || []).length} usuario{(log.notified_users || []).length !== 1 ? 's' : ''}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {showModal && (
        <AlertFormModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditingAlert(null); }}
          onSave={handleSaveAlert}
          alert={editingAlert}
        />
      )}
    </div>
  );
}