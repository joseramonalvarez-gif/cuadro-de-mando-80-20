import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, UserX, Loader2 } from 'lucide-react';
import UserFormModal from './UserFormModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const data = await base44.entities.User.list();
    setUsers(data);
    setLoading(false);
  }

  function handleEdit(user) {
    setEditingUser(user);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingUser(null);
    loadUsers();
  }

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8EEEE] p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#1B2731]">Usuarios del Sistema</h3>
        <Button onClick={() => setShowModal(true)} className="bg-[#33A19A] hover:bg-[#2B8A84]">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Empresas</TableHead>
            <TableHead>Último Acceso</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge className={
                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                  user.role === 'advanced' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }>
                  {user.role === 'admin' ? 'Admin' : user.role === 'advanced' ? 'Avanzado' : 'Normal'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{(user.assigned_companies || []).length}</Badge>
              </TableCell>
              <TableCell>
                <span className="text-xs text-[#3E4C59]">
                  {user.created_date ? format(new Date(user.created_date), "dd MMM yyyy", { locale: es }) : '—'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(user)}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  {!(user.role === 'admin' && adminCount === 1) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showModal && (
        <UserFormModal
          user={editingUser}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}