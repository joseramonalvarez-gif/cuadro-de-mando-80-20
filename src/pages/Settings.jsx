import React, { useState, useEffect } from 'react';
import { useApp } from '../components/shared/DemoContext';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Building2, Users, Shield, Sliders, FileText, HelpCircle, BarChart3, Calendar } from 'lucide-react';
import LoadingState from '../components/shared/LoadingState';
import CompaniesSection from '../components/settings/CompaniesSection';
import CostProfilesSection from '../components/settings/CostProfilesSection';
import UsersSection from '../components/settings/UsersSection';
import PermissionsSection from '../components/settings/PermissionsSection';
import DataQualitySection from '../components/settings/DataQualitySection';
import SystemParamsSection from '../components/settings/SystemParamsSection';
import AuditSection from '../components/settings/AuditSection';
import TaxCalendarSection from '../components/settings/TaxCalendarSection';
import HelpSection from '../components/settings/HelpSection';

export default function SettingsPage() {
  const { user, companies, activeCompany, loading: appLoading, isAdmin, refreshCompanies } = useApp();
  const [activeTab, setActiveTab] = useState('companies');
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (user && !isAdmin) {
      window.location.href = '/';
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  async function loadData() {
    try {
      const [usersData, logsData] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.AuditLog.filter({})
      ]);
      setUsers(usersData);
      setAuditLogs(logsData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error('Error loading settings data:', error);
    }
  }

  async function handleUpdateCompany(companyId, updates) {
    try {
      await base44.entities.Company.update(companyId, updates);
      await refreshCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
    }
  }

  async function handleUpdateUser(userId, updates) {
    try {
      await base44.entities.User.update(userId, updates);
      await loadData();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  async function handleDeleteUser(userId) {
    try {
      await base44.entities.User.delete(userId);
      await loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  async function handleInviteUser(data) {
    try {
      await base44.users.inviteUser(data.email, data.role);
      await loadData();
    } catch (error) {
      console.error('Error inviting user:', error);
    }
  }

  function handleSavePermissions(permissions) {
    console.log('Saving permissions:', permissions);
  }

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
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full mb-6">
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Empresas</span>
          </TabsTrigger>
          <TabsTrigger value="cost" className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Costes</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Permisos</span>
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Calidad</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">IA</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Auditoría</span>
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Fiscal</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
          <CompaniesSection 
            companies={companies} 
            onUpdate={handleUpdateCompany}
          />
        </TabsContent>

        <TabsContent value="cost">
          <CostProfilesSection 
            company={activeCompany}
            onUpdate={handleUpdateCompany}
          />
        </TabsContent>

        <TabsContent value="users">
          <UsersSection 
            users={users}
            onUpdate={handleUpdateUser}
            onDelete={handleDeleteUser}
            onInvite={handleInviteUser}
          />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsSection 
            modeloNegocio={activeCompany?.modelo_negocio || 'mixto'}
            onSave={handleSavePermissions}
          />
        </TabsContent>

        <TabsContent value="quality">
          <DataQualitySection 
            modeloNegocio={activeCompany?.modelo_negocio || 'mixto'}
            quality={{}}
          />
        </TabsContent>

        <TabsContent value="system">
          <SystemParamsSection />
        </TabsContent>

        <TabsContent value="audit">
          <AuditSection logs={auditLogs} />
        </TabsContent>

        <TabsContent value="fiscal">
          <TaxCalendarSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}