import React, { useState } from 'react';
import { useApp } from '../shared/DemoContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

export default function DiagnosticoSection() {
  const { activeCompany } = useApp();
  const [diagnostico, setDiagnostico] = useState(null);
  const [loading, setLoading] = useState(false);

  async function ejecutarDiagnostico() {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('diagnosticoTecnico', {
        companyId: activeCompany.id
      });
      setDiagnostico(response.data);
    } catch (error) {
      console.error('Error diagnóstico:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-[#E8EEEE]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk'] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#33A19A]" />
              Diagnóstico Técnico Completo
            </h3>
            <p className="text-sm text-[#3E4C59] mt-1">
              Auditoría automática de conexión API, integridad de datos y cálculos
            </p>
          </div>
          <Button
            onClick={ejecutarDiagnostico}
            disabled={loading}
            className="bg-[#33A19A] hover:bg-[#2d8a84]"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
          </Button>
        </div>

        {diagnostico && (
          <div className="space-y-6">
            {/* Resumen global */}
            <div className="bg-[#F8F6F1] rounded-lg p-4 border border-[#E8EEEE]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[#1B2731]">Estado Global</h4>
                <span className="text-2xl">{diagnostico.estadoGlobal}</span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-[#1B2731]">{diagnostico.resumen.totalTests}</div>
                  <div className="text-xs text-[#B7CAC9]">Tests</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#33A19A]">{diagnostico.resumen.totalPass}</div>
                  <div className="text-xs text-[#B7CAC9]">Pass</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#E05252]">{diagnostico.resumen.totalFail}</div>
                  <div className="text-xs text-[#B7CAC9]">Fail</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#E6A817]">{diagnostico.resumen.totalWarn}</div>
                  <div className="text-xs text-[#B7CAC9]">Warn</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-3xl font-bold text-[#33A19A] font-['Space_Grotesk']">
                  Score: {diagnostico.resumen.score}%
                </div>
              </div>
            </div>

            {/* Detalles por bloque */}
            {Object.entries(diagnostico.bloques).map(([key, bloque]) => (
              <div key={key} className="bg-white rounded-lg border border-[#E8EEEE] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-[#1B2731]">{bloque.nombre}</h4>
                  <div className="flex gap-2 text-xs">
                    <Badge className="bg-[#33A19A] text-white">{bloque.pass} Pass</Badge>
                    <Badge className="bg-[#E05252] text-white">{bloque.fail} Fail</Badge>
                    <Badge className="bg-[#E6A817] text-white">{bloque.warn} Warn</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  {bloque.detalles.map((detalle, idx) => {
                    const isPass = detalle.startsWith('✅');
                    const isFail = detalle.startsWith('❌');
                    const isWarn = detalle.startsWith('⚠️');
                    
                    return (
                      <div 
                        key={idx} 
                        className={`text-xs p-2 rounded ${
                          isPass ? 'bg-emerald-50 text-emerald-900' : 
                          isFail ? 'bg-red-50 text-red-900' : 
                          'bg-amber-50 text-amber-900'
                        }`}
                      >
                        {detalle}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="bg-[#E6F7F6] border border-[#33A19A]/20 rounded-lg p-4">
              <p className="text-xs text-[#3E4C59]">
                <strong>Última ejecución:</strong> {new Date(diagnostico.timestamp).toLocaleString('es-ES')}
              </p>
            </div>
          </div>
        )}

        {!diagnostico && !loading && (
          <div className="text-center py-12 text-[#B7CAC9]">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Haz clic en "Ejecutar Diagnóstico" para iniciar la auditoría</p>
          </div>
        )}
      </Card>
    </div>
  );
}