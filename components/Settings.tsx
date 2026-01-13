import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Save, ArrowLeft, Key } from 'lucide-react';

interface SettingsProps {
  apiKey: string;
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
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-6 pl-0 hover:pl-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Dashboard
        </Button>

        <h2 className="text-3xl font-bold text-white mb-2">Configurações</h2>
        <p className="text-slate-400 mb-8">Gerencie suas chaves de API e preferências do sistema.</p>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-800 rounded-lg text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">Configuração da API Gemini</h3>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Para usar o LuminaFlow, você precisa de uma chave de API válida do Google Gemini. 
              Você pode obter uma gratuitamente no <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">Google AI Studio</a>.
            </p>

            <Input
              label="Chave da API (Gemini)"
              type="password"
              placeholder="Ex: AIzaSy..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
              {saved && <span className="text-green-400 text-sm animate-pulse">Configurações salvas com sucesso!</span>}
              <Button onClick={handleSave} disabled={!key}>
                <Save className="w-4 h-4" /> Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;