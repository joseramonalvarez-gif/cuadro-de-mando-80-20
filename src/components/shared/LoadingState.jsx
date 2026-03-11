import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Cargando datos...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-[#33A19A] animate-spin mb-4" />
      <p className="text-sm text-[#3E4C59]">{message}</p>
    </div>
  );
}