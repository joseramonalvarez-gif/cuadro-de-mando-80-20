import React from 'react';
import { Button } from '@/components/ui/button';
import { Book, Mail, Video } from 'lucide-react';

export default function HelpSection() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-[#E8EEEE] p-6 text-center">
        <div className="w-12 h-12 bg-[#E6F7F6] rounded-lg flex items-center justify-center mx-auto mb-4">
          <Book className="w-6 h-6 text-[#33A19A]" />
        </div>
        <h4 className="font-semibold text-[#1B2731] mb-2">Documentación</h4>
        <p className="text-sm text-[#3E4C59] mb-4">
          Guías completas de uso del sistema
        </p>
        <Button variant="outline" size="sm">
          Ver Docs
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E8EEEE] p-6 text-center">
        <div className="w-12 h-12 bg-[#E6F7F6] rounded-lg flex items-center justify-center mx-auto mb-4">
          <Video className="w-6 h-6 text-[#33A19A]" />
        </div>
        <h4 className="font-semibold text-[#1B2731] mb-2">Tutoriales</h4>
        <p className="text-sm text-[#3E4C59] mb-4">
          Videos paso a paso
        </p>
        <Button variant="outline" size="sm">
          Ver Videos
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E8EEEE] p-6 text-center">
        <div className="w-12 h-12 bg-[#E6F7F6] rounded-lg flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-[#33A19A]" />
        </div>
        <h4 className="font-semibold text-[#1B2731] mb-2">Soporte</h4>
        <p className="text-sm text-[#3E4C59] mb-4">
          Contacta con el equipo
        </p>
        <Button variant="outline" size="sm">
          Contactar
        </Button>
      </div>
    </div>
  );
}