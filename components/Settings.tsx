import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Save, ArrowLeft, Key, Database, Lock } from 'lucide-react';

interface SettingsProps {
  apiKey: string;
  supabaseUrl: string;
  supabaseKey: string;
  userRole?: string;
  onSave: (key: string, sbUrl: string, sbKey: string) => void;
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ apiKey, supabaseUrl, supabaseKey, userRole, onSave, onBack }) => {
  const [key, setKey] = useState(apiKey);
  const [sbUrl, setSbUrl] = useState(supabaseUrl);
  const [sbKey, setSbKey] = useState(supabaseKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKey(apiKey);
    setSbUrl(supabaseUrl);
    setSbKey(supabaseKey);
  }, [apiKey, supabaseUrl, supabaseKey]);

  const handleSave = () => {
    onSave(key, sbUrl, sbKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isAdmin = userRole === 'admin';

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
            <div className="p-2 bg-slate-800 rounded-lg text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">Inteligência Artificial (Gemini)</h3>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Define qual chave de API será usada para gerar as páginas. O administrador definiu uma chave padrão, mas você pode usar a sua pessoal se desejar.
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

        {/* Supabase Config - ONLY FOR ADMINS */}
        {isAdmin ? (
            <div className="bg-slate-900/50 border border-purple-900/30 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Lock className="w-24 h-24 text-purple-500" />
              </div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-white">Banco de Dados (Sistema)</h3>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Apenas Admin</span>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <p className="text-sm text-slate-400">
                  Conecte para salvar usuários e projetos na nuvem. Estas configurações são globais para o sistema.
                </p>
                <Input
                  label="Project URL"
                  placeholder="Ex: https://xyz.supabase.co"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                />
                 <Input
                  label="API Key (anon/public)"
                  type="password"
                  placeholder="Ex: eyJhbGciOiJIUzI1NiIsInR5cCI..."
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                />
              </div>
            </div>
        ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-sm">
                As configurações de Banco de Dados são gerenciadas pelo administrador.
            </div>
        )}

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