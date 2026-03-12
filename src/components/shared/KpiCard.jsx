import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

export default function KpiCard({ title, value, trend, status, icon: Icon, subtitle, onClick, info }) {
  const statusColors = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-400',
    red: 'bg-[#E05252]',
  };

  const trendPositive = trend > 0;
  const trendNeutral = trend === 0;

  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(27,39,49,0.06)] hover:shadow-[0_4px_16px_rgba(27,39,49,0.1)] transition-all duration-300 text-left w-full border border-[#E8EEEE]/60"
    >
      {/* Status indicator & info */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        {info && (
          <div className="group/info relative">
            <Info className="w-3.5 h-3.5 text-[#B7CAC9] hover:text-[#33A19A] cursor-help" />
            <div className="hidden group-hover/info:block absolute right-0 top-6 z-10 w-56 p-3 bg-[#1B2731] text-white text-xs rounded-lg shadow-xl">
              {info}
            </div>
          </div>
        )}
        <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status] || statusColors.green}`} />
      </div>
      
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-2 rounded-xl bg-[#F0F7F7] group-hover:bg-[#E5F2F1] transition-colors">
            <Icon className="w-4 h-4 text-[#33A19A]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#3E4C59] uppercase tracking-wide truncate">{title}</p>
          <p className="text-2xl font-bold text-[#1B2731] mt-1 font-['Space_Grotesk']">{value}</p>
          {subtitle && <p className="text-xs text-[#3E4C59] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      
      {trend !== undefined && trend !== null && (
        <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${
          trendNeutral ? 'text-[#3E4C59]' : trendPositive ? 'text-emerald-600' : 'text-[#E05252]'
        }`}>
          {trendNeutral ? (
            <Minus className="w-3 h-3" />
          ) : trendPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{trendPositive ? '+' : ''}{typeof trend === 'number' ? trend.toFixed(1) : trend}%</span>
          <span className="text-[#B7CAC9]">vs periodo ant.</span>
        </div>
      )}
    </button>
  );
}