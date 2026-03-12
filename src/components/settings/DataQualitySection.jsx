import React, { useState, useEffect } from 'react';
import { useApp } from '../shared/DemoContext';
import { base44 } from '@/api/base44Client';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calcularCalidadDato } from '../shared/kpiCalculations';

export default function DataQualitySection({ modeloNegocio }) {
  const { activeCompany } = useApp();
  const [quality, setQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (activeCompany) {
      loadQualityScore();
    }
  }, [activeCompany]);
  
  async function loadQualityScore() {
    setLoading(true);
    try {
      const [invoices, lineas, productos] = await Promise.all([
        base44.entities.CachedData.filter({ company_id: activeCompany.id, data_type: 'invoices_sale' }),
        base44.entities.LineasVenta.filter({ company_id: activeCompany.id }),
        base44.entities.Productos.filter({ company_id: activeCompany.id })
      ]);
      
      const facturasData = invoices[0]?.data?.items || [];
      const score = calcularCalidadDato(facturasData, lineas, productos);
      setQuality(score);
    } catch (error) {
      console.error('Error calculando calidad:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-[#33A19A]" />
      </div>
    );
  }
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-[#33A19A]';
    if (score >= 70) return 'text-[#E6A817]';
    return 'text-[#E05252]';
  };

  const getScoreIcon = (score) => {
    if (score >= 85) return '🟢';
    if (score >= 70) return '🟡';
    return '🔴';
  };

  const getProgressColor = (score) => {
    if (score >= 85) return 'bg-[#33A19A]';
    if (score >= 70) return 'bg-[#E6A817]';
    return 'bg-[#E05252]';
  };

  // Calcular métricas reales
  const qualityMetrics = quality ? [
    { 
      name: 'Facturas con contacto asignado', 
      score: quality.scoreContacto, 
      weight: 35, 
      impact: 'ABC Clientes, RFM',
      detalles: `${quality.detalles.facturasConContacto} de ${quality.detalles.totalFacturas} facturas`
    },
    { 
      name: 'Líneas con producto asignado', 
      score: quality.scoreProducto, 
      weight: 30, 
      impact: 'ABC Productos, Mix',
      detalles: `${quality.detalles.lineasConProducto} de ${quality.detalles.totalLineas} líneas`
    },
    { 
      name: 'Productos con coste definido', 
      score: quality.scoreCoste, 
      weight: 35, 
      impact: 'Margen bruto real',
      detalles: `${quality.detalles.productosConCoste} de ${quality.detalles.totalProductos} productos`
    }
  ] : [];

  const globalScore = quality?.scoreGlobal || 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
              Score Global de Calidad de Dato
            </h3>
            <p className="text-sm text-[#3E4C59] mt-1">
              Calculado desde tus datos reales de Holded
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadQualityScore}
              className="h-8 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Recalcular
            </Button>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(globalScore)} font-['Space_Grotesk']`}>
                {getScoreIcon(globalScore)} {Math.round(globalScore)}%
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {qualityMetrics.map((metric, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-[#1B2731]">{metric.name}</span>
                <span className={getScoreColor(metric.score)}>{Math.round(metric.score)}%</span>
              </div>
              <Progress value={metric.score} className="h-2" />
              <div className="flex justify-between text-xs text-[#B7CAC9]">
                <span>{metric.detalles}</span>
                <span>Afecta a: {metric.impact}</span>
              </div>
              {metric.score < 80 && (
                <div className="flex items-start gap-2 p-3 bg-[#FFFAF3] rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-[#E6A817] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#3E4C59]">
                    <strong>Acción requerida:</strong> {getActionForMetric(metric.name, modeloNegocio)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#E6F7F6] border border-[#33A19A]/20 rounded-lg p-4">
        <p className="text-sm text-[#3E4C59]">
          💡 <strong>Tip:</strong> Un score superior al 85% garantiza la precisión de todos los KPIs. 
          Completa los datos faltantes en Holded para mejorar la calidad analítica.
        </p>
      </div>
    </div>
  );
}

function getActionForMetric(name, modelo) {
  const actions = {
    'Perfiles de coste configurados': 'Configura los perfiles de coste en la sección de Configuración de Coste',
    'Horas con billable asignado': 'En Holded, marca las horas como facturables o no facturables',
    'Facturas vinculadas a proyecto': 'Asocia las facturas a proyectos en Holded para tracking preciso',
    'Contactos con tipo asignado': 'Indica si el contacto es cliente, proveedor o ambos en Holded',
    'Contratos recurrentes identificados': 'Marca los servicios como recurrentes en Holded',
    'Facturas con productoId': 'Asigna productos/servicios a las líneas de factura en Holded',
    'Productos con coste en Holded': 'Completa el campo "Coste" en la ficha de cada producto en Holded',
    'Contactos con ciudad/país': 'Completa los datos de ubicación en los contactos de Holded',
    'Facturas con canal de venta': 'Asigna canal de venta (web, tienda, distribuidor) en Holded',
    'Referencias con stock': 'Activa gestión de almacenes y registra stock en Holded'
  };

  return actions[name] || 'Revisa y completa los datos en Holded';
}