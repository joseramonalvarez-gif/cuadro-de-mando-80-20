import React from 'react';
import { Button } from "@/components/ui/button";
import { ExternalLink, Book, Mail } from 'lucide-react';

export default function HelpSection() {
  return (
    <div className="space-y-6">
      {/* Quick Guide */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8EEEE] p-6">
        <h3 className="text-lg font-semibold text-[#1B2731] mb-4">Guía Rápida de Uso</h3>
        
        <div className="space-y-4 text-sm text-[#3E4C59]">
          <div>
            <h4 className="font-semibold text-[#1B2731] mb-2">Para Administradores:</h4>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Gestiona empresas y usuarios desde el módulo de Configuración</li>
              <li>Configura alertas automáticas en el módulo de Alertas</li>
              <li>Define permisos por rol para cada módulo</li>
              <li>Consulta el log de auditoría para trazabilidad completa</li>
              <li>Usa el Chat Inteligente para análisis avanzados con IA</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#1B2731] mb-2">Para Usuarios Avanzados:</h4>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Accede a todos los módulos analíticos: Ventas, Compras, Tesorería, etc.</li>
              <li>Crea alertas personalizadas sobre KPIs críticos</li>
              <li>Usa el Chat IA para consultas complejas sobre tus datos</li>
              <li>Exporta datos y gráficos para informes externos</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#1B2731] mb-2">Para Usuarios Normales:</h4>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Consulta los KPIs principales en el Dashboard</li>
              <li>Visualiza gráficos simplificados de rendimiento</li>
              <li>Usa las preguntas FAQ del Chat para consultas rápidas</li>
              <li>Recibe notificaciones de alertas configuradas por tu admin</li>
            </ul>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8EEEE] p-6">
        <h3 className="text-lg font-semibold text-[#1B2731] mb-4">Sobre la Aplicación</h3>
        
        <div className="space-y-3 text-sm text-[#3E4C59]">
          <div className="flex justify-between">
            <span className="font-medium">Versión:</span>
            <span>1.0.0 MVP</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Última actualización:</span>
            <span>Marzo 2026</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Desarrollado por:</span>
            <span className="font-semibold text-[#33A19A]">DATA GOAL</span>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8EEEE] p-6">
        <h3 className="text-lg font-semibold text-[#1B2731] mb-4">Recursos y Soporte</h3>
        
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="https://developers.holded.com/reference" target="_blank" rel="noopener">
              <Book className="w-4 h-4 mr-2" />
              Documentación API Holded
              <ExternalLink className="w-3 h-3 ml-auto" />
            </a>
          </Button>

          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="mailto:soporte@datagoal.es">
              <Mail className="w-4 h-4 mr-2" />
              Contactar Soporte DATA GOAL
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}