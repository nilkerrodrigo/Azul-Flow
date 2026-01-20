import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Save, ArrowLeft, Key } from 'lucide-react';

interface SettingsProps {
  apiKey: string;
  userRole?: string;
  onSave: (key: string) => void;
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ apiKey, onSave, onBack }) => {
  const [key, setKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKey(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    onSave(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 p-8 bg-slate-950 overflow-auto h-screen">
      <div className="max-w-2xl mx-auto pb-20">
        <Button variant="ghost" onClick={onBack} className="mb-6 pl-0 hover:pl-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Dashboard
        </Button>

        <h2 className="text-3xl font-bold text-white mb-2">Configurações</h2>
        <p className="text-slate-400 mb-8">Gerencie suas preferências de conexão e inteligência artificial.</p>

        {/* Gemini Config */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-800 rounded-lg text-blue-400">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">Inteligência Artificial (Gemini)</h3>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Define qual chave de API será usada para gerar as páginas.
            </p>
            <Input
              label="Chave da API (Gemini)"
              type="password"
              placeholder="Ex: AIzaSy..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800 flex justify-center z-50">
           <div className="w-full max-w-2xl flex items-center justify-end gap-3">
              {saved && <span className="text-green-400 text-sm animate-pulse font-medium">Configurações salvas!</span>}
              <Button onClick={handleSave} className="w-40">
                <Save className="w-4 h-4" /> Salvar Tudo
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;