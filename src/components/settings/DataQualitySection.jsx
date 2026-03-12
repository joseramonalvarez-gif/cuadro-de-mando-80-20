import React from 'react';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function DataQualitySection({ modeloNegocio, quality }) {
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

  // Datos de ejemplo
  const qualityMetrics = modeloNegocio === 'servicios' || modeloNegocio === 'mixto' ? [
    { name: 'Perfiles de coste configurados', score: 30, weight: 30, impact: 'Margen real, Ocupación' },
    { name: 'Horas con billable asignado', score: 85, weight: 25, impact: 'Productividad, Margen/hora' },
    { name: 'Facturas vinculadas a proyecto', score: 70, weight: 20, impact: 'Desviación proyectos' },
    { name: 'Contactos con tipo asignado', score: 92, weight: 15, impact: 'Segmentación clientes' },
    { name: 'Contratos recurrentes identificados', score: 45, weight: 10, impact: 'MRR, Churn' }
  ] : [
    { name: 'Facturas con productoId', score: 88, weight: 30, impact: 'ABC Productos, Mix' },
    { name: 'Productos con coste en Holded', score: 65, weight: 30, impact: 'Margen real' },
    { name: 'Contactos con ciudad/país', score: 78, weight: 15, impact: 'Análisis geográfico' },
    { name: 'Facturas con canal de venta', score: 55, weight: 15, impact: 'Mix canal' },
    { name: 'Referencias con stock', score: 92, weight: 10, impact: 'Rotación, Ruptura' }
  ];

  const globalScore = qualityMetrics.reduce((sum, m) => sum + (m.score * m.weight / 100), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
              Score Global de Calidad
            </h3>
            <p className="text-sm text-[#3E4C59] mt-1">
              Basado en completitud de datos en Holded
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(globalScore)} font-['Space_Grotesk']`}>
              {getScoreIcon(globalScore)} {Math.round(globalScore)}%
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {qualityMetrics.map((metric, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-[#1B2731]">{metric.name}</span>
                <span className={getScoreColor(metric.score)}>{metric.score}%</span>
              </div>
              <Progress value={metric.score} className="h-2" />
              <div className="flex justify-between text-xs text-[#B7CAC9]">
                <span>Peso: {metric.weight}%</span>
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