import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';

export default function SystemParamsSection() {
  const [showKey, setShowKey] = useState(false);
  const [config, setConfig] = useState({
    claudeApiKey: '***************',
    tokensLimitAvanzado: 50000,
    tokensLimitNormal: 10000,
    chatEnabledAdmin: true,
    chatEnabledAvanzado: true,
    chatEnabledNormal: false
  });

  function handleSave() {
    alert('✅ Configuración de IA guardada');
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#E8EEEE] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[#1B2731] font-['Space_Grotesk']">
          Configuración de IA (Claude)
        </h3>

        <div>
          <Label>API Key de Anthropic</Label>
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              value={config.claudeApiKey}
              onChange={(e) => setConfig({ ...config, claudeApiKey: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B7CAC9] hover:text-[#3E4C59]"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-[#B7CAC9] mt-1">
            La API Key está configurada en ANTHROPIC_API_KEY
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Límite tokens/mes - Avanzado</Label>
            <Input
              type="number"
              value={config.tokensLimitAvanzado}
              onChange={(e) => setConfig({ ...config, tokensLimitAvanzado: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <Label>Límite tokens/mes - Normal</Label>
            <Input
              type="number"
              value={config.tokensLimitNormal}
              onChange={(e) => setConfig({ ...config, tokensLimitNormal: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Activar Chat IA por Rol</Label>
          
          <div className="flex items-center justify-between p-3 bg-[#F0F5F5] rounded-lg">
            <span className="text-sm text-[#1B2731]">Admin (ilimitado)</span>
            <Switch
              checked={config.chatEnabledAdmin}
              onCheckedChange={(val) => setConfig({ ...config, chatEnabledAdmin: val })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F0F5F5] rounded-lg">
            <span className="text-sm text-[#1B2731]">Avanzado</span>
            <Switch
              checked={config.chatEnabledAvanzado}
              onCheckedChange={(val) => setConfig({ ...config, chatEnabledAvanzado: val })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F0F5F5] rounded-lg">
            <span className="text-sm text-[#1B2731]">Normal</span>
            <Switch
              checked={config.chatEnabledNormal}
              onCheckedChange={(val) => setConfig({ ...config, chatEnabledNormal: val })}
            />
          </div>
        </div>

        <Button onClick={handleSave}>
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}