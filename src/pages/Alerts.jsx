import React, { useState, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import LoadingState from '../components/shared/LoadingState';
import DemoBanner from '../components/shared/DemoBanner';
import AlertsTable from '../components/alerts/AlertsTable';
import AlertFormModal from '../components/alerts/AlertFormModal';
import AlertHistoryLog from '../components/alerts/AlertHistoryLog';
import AlertFilters from '../components/alerts/AlertFilters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Alerts() {
  const { activeCompany, user, loading: contextLoading } = useApp();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    estado: 'all',
    severidad: 'all',
    modulo: 'all'
  });

  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);

  const isDemo = !activeCompany?.holded_api_key || activeCompany?.is_demo;
  const modeloNegocio = activeCompany?.modelo_negocio || 'mixto';
  const userRole = user?.role || 'user';

  useEffect(() => {
    if (!contextLoading && activeCompany) {
      loadAlertsData();
    }
  }, [activeCompany, contextLoading]);

  async function loadAlertsData() {
    setLoading(true);
    
    if (isDemo) {
      setAlerts(generateDemoAlerts(modeloNegocio));
      setLogs(generateDemoLogs());
      setLoading(false);
      return;
    }

    try {
      const [alertsData, logsData] = await Promise.all([
        base44.entities.Alert.filter({ company_id: activeCompany.id }),
        base44.entities.AlertLog.filter({ company_id: activeCompany.id })
      ]);

      setAlerts(alertsData);
      setLogs(logsData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));

    } catch (error) {
      console.error('Error loading alerts data:', error);
    }
    
    setLoading(false);
  }

  async function handleSaveAlert(formData) {
    try {
      if (editingAlert) {
        await base44.entities.Alert.update(editingAlert.id, {
          ...formData,
          company_id: activeCompany.id
        });
      } else {
        await base44.entities.Alert.create({
          ...formData,
          company_id: activeCompany.id,
          module: 'general',
          status: 'active',
          is_system: false
        });
      }

      await loadAlertsData();
      setModalOpen(false);
      setEditingAlert(null);
    } catch (error) {
      console.error('Error saving alert:', error);
    }
  }

  async function handleToggleAlert(alertId) {
    try {
      const alert = alerts.find(a => a.id === alertId);
      await base44.entities.Alert.update(alertId, {
        status: alert.status === 'active' ? 'paused' : 'active'
      });
      await loadAlertsData();
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  }

  async function handleDeleteAlert(alertId) {
    if (confirm('¿Estás seguro de eliminar esta alerta?')) {
      try {
        await base44.entities.Alert.delete(alertId);
        await loadAlertsData();
      } catch (error) {
        console.error('Error deleting alert:', error);
      }
    }
  }

  function handleEditAlert(alert) {
    setEditingAlert(alert);
    setModalOpen(true);
  }

  function generateDemoAlerts(modelo) {
    const baseAlerts = [
      {
        id: '1',
        kpi_name: 'dso_global',
        kpi_label: 'DSO Global',
        condition: 'greater_than',
        threshold: 45,
        period: 'daily',
        severity: 'yellow',
        status: 'active',
        valorActual: 52,
        last_triggered: '2026-03-10T10:30:00'
      },
      {
        id: '2',
        kpi_name: 'morosidad_90d',
        kpi_label: 'Morosidad +90d',
        condition: 'greater_than',
        threshold: 3,
        period: 'weekly',
        severity: 'red',
        status: 'active',
        valorActual: 4.2,
        last_triggered: '2026-03-11T08:15:00'
      },
      {
        id: '3',
        kpi_name: 'saldo_caja',
        kpi_label: 'Saldo Caja',
        condition: 'less_than',
        threshold: 30000,
        period: 'daily',
        severity: 'yellow',
        status: 'active',
        valorActual: 185000,
        last_triggered: null
      }
    ];

    if (modelo === 'servicios' || modelo === 'mixto') {
      baseAlerts.push({
        id: '4',
        kpi_name: 'ocupacion_equipo',
        kpi_label: 'Ocupación Equipo',
        condition: 'less_than',
        threshold: 60,
        period: 'weekly',
        severity: 'yellow',
        status: 'active',
        valorActual: 76.7,
        last_triggered: null
      });
    }

    if (modelo === 'productos' || modelo === 'mixto') {
      baseAlerts.push({
        id: '5',
        kpi_name: 'dependencia_proveedor',
        kpi_label: 'Dependencia Proveedor',
        condition: 'greater_than',
        threshold: 30,
        period: 'monthly',
        severity: 'yellow',
        status: 'active',
        valorActual: 28.5,
        last_triggered: null
      });
    }

    return baseAlerts;
  }

  function generateDemoLogs() {
    return [
      {
        id: '1',
        alert_id: '1',
        company_id: 'demo',
        kpi_name: 'dso_global',
        kpi_label: 'DSO Global',
        triggered_value: 52,
        threshold: 45,
        severity: 'yellow',
        created_date: '2026-03-10T10:30:00',
        notified_users: ['admin@company.com'],
        read_by: []
      },
      {
        id: '2',
        alert_id: '2',
        company_id: 'demo',
        kpi_name: 'morosidad_90d',
        kpi_label: 'Morosidad +90d',
        triggered_value: 4.2,
        threshold: 3,
        severity: 'red',
        created_date: '2026-03-11T08:15:00',
        notified_users: ['admin@company.com', 'finance@company.com'],
        read_by: ['admin@company.com']
      }
    ];
  }

  if (contextLoading || loading) {
    return <LoadingState message="Cargando sistema de alertas..." />;
  }

  const canCreate = userRole === 'admin' || userRole === 'avanzado';

  return (
    <div className="space-y-6">
      {isDemo && <DemoBanner />}
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B2731] font-['Space_Grotesk']">
          Sistema de Alertas
        </h1>
        {canCreate && (
          <Button onClick={() => { setEditingAlert(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Alerta
          </Button>
        )}
      </div>

      <AlertFilters filters={filters} onFiltersChange={setFilters} />

      <AlertsTable
        alerts={alerts}
        onEdit={handleEditAlert}
        onDelete={handleDeleteAlert}
        onToggle={handleToggleAlert}
        userRole={userRole}
      />

      <AlertHistoryLog logs={logs} />

      <AlertFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAlert(null); }}
        onSave={handleSaveAlert}
        alert={editingAlert}
        modeloNegocio={modeloNegocio}
      />
    </div>
  );
}