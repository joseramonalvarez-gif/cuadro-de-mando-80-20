import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
      <AlertTriangle className="w-5 h-5 text-[#E6A817] flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-[#1B2731]">Modo demo</p>
        <p className="text-xs text-[#3E4C59]">Los datos mostrados son de ejemplo. Configura tu API Key de Holded para ver datos reales.</p>
      </div>
      <Link
        to={createPageUrl('Settings')}
        className="text-xs font-medium text-[#33A19A] hover:underline whitespace-nowrap"
      >
        Ir a Ajustes →
      </Link>
    </div>
  );
}