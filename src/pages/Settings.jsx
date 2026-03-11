import React, { useState, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Building2, Users, Shield, Sliders, FileText, HelpCircle } from 'lucide-react';
import LoadingState from '../components/shared/LoadingState';
import CompaniesSection from '../components/settings/CompaniesSection';
import UsersSection from '../components/settings/UsersSection';
import PermissionsSection from '../components/settings/PermissionsSection';
import SystemParamsSection from '../components/settings/SystemParamsSection';
import AuditSection from '../components/settings/AuditSection';
import HelpSection from '../components/settings/HelpSection';

export default function SettingsPage() {
  const { user, loading: appLoading, isAdmin } = useApp();
  const [activeTab, setActiveTab] = useState('companies');

  useEffect(() => {
    if (user && !isAdmin) {
      window.location.href = '/';
    }
  }, [user, isAdmin]);

  if (appLoading) return <LoadingState />;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="w-16 h-16 text-[#E05252] mb-4" />
        <h2 className="text-xl font-bold text-[#1B2731] mb-2">Acceso Denegado</h2>
        <p className="text-sm text-[#3E4C59]">Solo los administradores pueden acceder a la configuración</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-[#33A19A]/10">
          <Settings className="w-5 h-5 text-[#33A19A]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1B2731] font-['Space_Grotesk']">Configuración del Sistema</h2>
          <p className="text-xs text-[#3E4C59]">Gestión de empresas, usuarios, permisos y parámetros</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full mb-6">
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            Permisos
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            Auditoría
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5" />
            Ayuda
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
          <CompaniesSection />
        </TabsContent>

        <TabsContent value="users">
          <UsersSection />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsSection />
        </TabsContent>

        <TabsContent value="system">
          <SystemParamsSection />
        </TabsContent>

        <TabsContent value="audit">
          <AuditSection />
        </TabsContent>

        <TabsContent value="help">
          <HelpSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}