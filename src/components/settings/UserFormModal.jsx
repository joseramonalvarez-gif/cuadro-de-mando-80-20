import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

export default function UserFormModal({ user, onClose }) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    role: user?.role || 'user',
    assigned_companies: (user?.assigned_companies || []).join(', '),
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        role: formData.role,
        assigned_companies: formData.assigned_companies.split(',').map(c => c.trim()).filter(Boolean),
      };

      if (user) {
        await base44.entities.User.update(user.id, data);
      } else {
        await base44.users.inviteUser(formData.email, formData.role);
      }

      onClose();
    } catch (error) {
      console.error('Save error:', error);
    }

    setSaving(false);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={!!user}
            />
          </div>

          <div>
            <Label>Rol</Label>
            <Select value={formData.role} onValueChange={role => setFormData({ ...formData, role })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="advanced">Avanzado</SelectItem>
                <SelectItem value="user">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Empresas Autorizadas (IDs separados por comas)</Label>
            <Input
              value={formData.assigned_companies}
              onChange={e => setFormData({ ...formData, assigned_companies: e.target.value })}
              placeholder="company-id-1, company-id-2"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#33A19A] hover:bg-[#2B8A84]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (user ? 'Actualizar' : 'Invitar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}