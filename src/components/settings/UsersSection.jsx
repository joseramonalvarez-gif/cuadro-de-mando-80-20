import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import UserFormModal from './UserFormModal';

export default function UsersSection({ users, onUpdate, onDelete, onInvite }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const adminCount = users.filter(u => u.role === 'admin').length;

  function handleDelete(user) {
    if (user.role === 'admin' && adminCount === 1) {
      alert('❌ No puedes eliminar el último administrador del sistema');
      return;
    }

    if (confirm(`¿Seguro que quieres eliminar a ${user.email}?`)) {
      onDelete(user.id);
    }
  }

  function getRoleBadge(role) {
    const colors = {
      admin: 'bg-[#E05252] text-white',
      avanzado: 'bg-[#33A19A] text-white',
      user: 'bg-[#E8EEEE] text-[#3E4C59]'
    };

    const labels = {
      admin: 'Admin',
      avanzado: 'Avanzado',
      user: 'Normal'
    };

    return (
      <Badge className={colors[role] || colors.user}>
        {labels[role] || role}
      </Badge>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
          Gestión de Usuarios
        </h3>
        <Button onClick={() => { setEditingUser(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Invitar Usuario
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E8EEEE]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Último Acceso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell className="text-[#3E4C59]">{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell className="text-sm text-[#B7CAC9]">
                  {user.updated_date ? new Date(user.updated_date).toLocaleDateString('es-ES') : '-'}
                </TableCell>
                <TableCell>
                  <Badge className="bg-[#E6F7F6] text-[#33A19A]">Activo</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingUser(user); setModalOpen(true); }}
                    >
                      <Pencil className="w-4 h-4 text-[#3E4C59]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(user)}
                      disabled={user.role === 'admin' && adminCount === 1}
                    >
                      <Trash2 className="w-4 h-4 text-[#E05252]" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingUser(null); }}
        onSave={(data) => {
          if (editingUser) {
            onUpdate(editingUser.id, data);
          } else {
            onInvite(data);
          }
          setModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
      />
    </div>
  );
}