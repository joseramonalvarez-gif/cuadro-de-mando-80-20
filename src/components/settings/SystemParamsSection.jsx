import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from 'lucide-react';

export default function SystemParamsSection() {
  const [params, setParams] = useState({
    anthropic_api_key: '',
    ai_token_limit_admin: 50000,
    ai_token_limit_advanced: 20000,
    ai_token_limit_user: 5000,
    ai_enabled_admin: true,
    ai_enabled_advanced: true,
    ai_enabled_user: true,
    smtp_email: '',
    notifications_enabled_admin: true,
    notifications_enabled_advanced: true,
    notifications_enabled_user: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadParams();
  }, []);

  async function loadParams() {
    setLoading(true);
    try {
      const configs = await base44.entities.SystemConfig.filter({ category: 'ai' });
      const notifConfigs = await base44.entities.SystemConfig.filter({ category: 'notifications' });
      
      const aiConfig = configs.find(c => c.key === 'ai_settings');
      const notifConfig = notifConfigs.find(c => c.key === 'notification_settings');

      if (aiConfig) setParams(prev => ({ ...prev, ...aiConfig.value }));
      if (notifConfig) setParams(prev => ({ ...prev, ...notifConfig.value }));
    } catch (error) {
      console.error('Load params error:', error);
    }
    setLoading(false);
  }

  async function saveParams() {
    setSaving(true);
    try {
      // Save AI settings
      const aiConfigs = await base44.entities.SystemConfig.filter({ key: 'ai_settings' });
      const aiData = {
        anthropic_api_key: params.anthropic_api_key,
        ai_token_limit_admin: params.ai_token_limit_admin,
        ai_token_limit_advanced: params.ai_token_limit_advanced,
        ai_token_limit_user: params.ai_token_limit_user,
        ai_enabled_admin: params.ai_enabled_admin,
        ai_enabled_advanced: params.ai_enabled_advanced,
        ai_enabled_user: params.ai_enabled_user,
      };

      if (aiConfigs.length > 0) {
        await base44.entities.SystemConfig.update(aiConfigs[0].id, { value: aiData });
      } else {
        await base44.entities.SystemConfig.create({
          key: 'ai_settings',
          value: aiData,
          category: 'ai',
          description: 'AI chat configuration',
        });
      }

      // Save notification settings
      const notifConfigs = await base44.entities.SystemConfig.filter({ key: 'notification_settings' });
      const notifData = {
        smtp_email: params.smtp_email,
        notifications_enabled_admin: params.notifications_enabled_admin,
        notifications_enabled_advanced: params.notifications_enabled_advanced,
        notifications_enabled_user: params.notifications_enabled_user,
      };

      if (notifConfigs.length > 0) {
        await base44.entities.SystemConfig.update(notifConfigs[0].id, { value: notifData });
      } else {
        await base44.entities.SystemConfig.create({
          key: 'notification_settings',
          value: notifData,
          category: 'notifications',
          description: 'Notification configuration',
        });
      }
    } catch (error) {
      console.error('Save params error:', error);
    }
    setSaving(false);
  }

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      {/* AI Configuration */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8EEEE] p-6">
        <h3 className="text-lg font-semibold text-[#1B2731] mb-4">Configuración de IA</h3>
        
        <div className="space-y-4">
          <div>
            <Label>API Key de Anthropic (Claude)</Label>
            <Input
              type="password"
              value={params.anthropic_api_key}
              onChange={e => setParams({ ...params, anthropic_api_key: e.target.value })}
              placeholder="sk-ant-api03-..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Límite Admin (tokens/mes)</Label>
              <Input
                type="number"
                value={params.ai_token_limit_admin}
                onChange={e => setParams({ ...params, ai_token_limit_admin: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Límite Avanzado (tokens/mes)</Label>
              <Input
                type="number"
                value={params.ai_token_limit_advanced}
                onChange={e => setParams({ ...params, ai_token_limit_advanced: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Límite Normal (tokens/mes)</Label>
              <Input
                type="number"
                value={params.ai_token_limit_user}
                onChange={e => setParams({ ...params, ai_token_limit_user: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Chat IA habilitado para Admin</Label>
              <Switch
                checked={params.ai_enabled_admin}
                onCheckedChange={checked => setParams({ ...params, ai_enabled_admin: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Chat IA habilitado para Avanzado</Label>
              <Switch
                checked={params.ai_enabled_advanced}
                onCheckedChange={checked => setParams({ ...params, ai_enabled_advanced: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Chat IA habilitado para Normal</Label>
              <Switch
                checked={params.ai_enabled_user}
                onCheckedChange={checked => setParams({ ...params, ai_enabled_user: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Configuration */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8EEEE] p-6">
        <h3 className="text-lg font-semibold text-[#1B2731] mb-4">Configuración de Notificaciones</h3>
        
        <div className="space-y-4">
          <div>
            <Label>Email de Notificaciones (SMTP)</Label>
            <Input
              type="email"
              value={params.smtp_email}
              onChange={e => setParams({ ...params, smtp_email: e.target.value })}
              placeholder="notificaciones@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Notificaciones habilitadas para Admin</Label>
              <Switch
                checked={params.notifications_enabled_admin}
                onCheckedChange={checked => setParams({ ...params, notifications_enabled_admin: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Notificaciones habilitadas para Avanzado</Label>
              <Switch
                checked={params.notifications_enabled_advanced}
                onCheckedChange={checked => setParams({ ...params, notifications_enabled_advanced: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Notificaciones habilitadas para Normal</Label>
              <Switch
                checked={params.notifications_enabled_user}
                onCheckedChange={checked => setParams({ ...params, notifications_enabled_user: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      <Button onClick={saveParams} disabled={saving} className="bg-[#33A19A] hover:bg-[#2B8A84]">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Guardar Configuración
      </Button>
    </div>
  );
}