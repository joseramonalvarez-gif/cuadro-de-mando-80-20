import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-[#FFFAF3] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-[#33A19A]/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-[#33A19A] font-['Space_Grotesk']">404</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1B2731] font-['Space_Grotesk'] mb-2">Página no encontrada</h1>
        <p className="text-sm text-[#3E4C59] mb-6">La página que buscas no existe o ha sido movida.</p>
        <Link to={createPageUrl('Home')}>
          <Button className="bg-[#33A19A] hover:bg-[#2B8A84] text-white">
            <Home className="w-4 h-4 mr-2" /> Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}