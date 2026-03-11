import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Edit, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import CompanyFormModal from './CompanyFormModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CompaniesSection() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [syncing, setSyncing] = useState({});

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    setLoading(true);
    const data = await base44.entities.Company.list();
    setCompanies(data);
    setLoading(false);
  }

  async function handleSync(companyId) {
    setSyncing(prev => ({ ...prev, [companyId]: true }));
    try {
      await base44.functions.invoke('holdedApi', {
        companyId,
        action: 'sync_all',
      });
      await loadCompanies();
    } catch (error) {
      console.error('Sync error:', error);
    }
    setSyncing(prev => ({ ...prev, [companyId]: false }));
  }

  function handleEdit(company) {
    setEditingCompany(company);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingCompany(null);
    loadCompanies();
  }

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8EEEE] p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#1B2731]">Empresas Registradas</h3>
        <Button onClick={() => setShowModal(true)} className="bg-[#33A19A] hover:bg-[#2B8A84]">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Última Sincronización</TableHead>
            <TableHead>Usuarios</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map(company => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell>
                {company.is_demo ? (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Demo
                  </Badge>
                ) : (
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Activa
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {company.last_sync_date ? (
                  <span className="text-xs text-[#3E4C59]">
                    {format(new Date(company.last_sync_date), "dd MMM yyyy HH:mm", { locale: es })}
                  </span>
                ) : (
                  <span className="text-xs text-[#B7CAC9]">Nunca</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{(company.allowed_users || []).length} usuarios</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(company)}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSync(company.id)}
                    disabled={syncing[company.id]}
                  >
                    {syncing[company.id] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showModal && (
        <CompanyFormModal
          company={editingCompany}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}