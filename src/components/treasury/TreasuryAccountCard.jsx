import React from 'react';
import { formatCurrency } from '../shared/DemoData';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';

export default function TreasuryAccountCard({ account }) {
  const isPositive = account.balance >= 0;
  const trend = account.trend || 0;
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-[#F8F6F1] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#33A19A]" />
          </div>
          <div>
            <p className="text-xs text-[#B7CAC9] uppercase tracking-wide">{account.type || 'Cuenta'}</p>
            <p className="text-sm font-semibold text-[#1B2731] font-['Space_Grotesk']">{account.name}</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold text-[#1B2731] font-['Space_Grotesk']">
          {formatCurrency(account.balance)}
        </div>
        {trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="font-semibold">{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}