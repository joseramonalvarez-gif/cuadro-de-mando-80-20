import React from 'react';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';

export default function BankAccountsCards({ cuentas }) {
  const formatCurrency = (val) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

  if (!cuentas || cuentas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E8EEEE] p-6">
        <p className="text-[#B7CAC9] text-center">No hay cuentas bancarias configuradas</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cuentas.map((cuenta) => (
        <div 
          key={cuenta.cuentaId}
          className="bg-white rounded-xl border border-[#E8EEEE] p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E6F7F6] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#33A19A]" />
              </div>
              <div>
                <h4 className="font-semibold text-[#1B2731]">{cuenta.nombre}</h4>
                <p className="text-xs text-[#B7CAC9]">{cuenta.moneda || 'EUR'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#1B2731] font-['Space_Grotesk']">
                {formatCurrency(cuenta.saldo)}
              </span>
            </div>

            {cuenta.variacion !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${
                cuenta.variacion >= 0 ? 'text-[#33A19A]' : 'text-[#E05252]'
              }`}>
                {cuenta.variacion >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {cuenta.variacion >= 0 ? '+' : ''}{cuenta.variacion.toFixed(1)}%
                </span>
                <span className="text-[#B7CAC9]">vs mes anterior</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}