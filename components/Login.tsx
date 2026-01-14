import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Sparkles } from 'lucide-react';

interface LoginProps {
  onAuthenticate: (u: string, p: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
}

const Login: React.FC<LoginProps> = ({ onAuthenticate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await onAuthenticate(username, password, rememberMe);
      if (!result.success) {
        setError(result.error || 'Usuário ou senha incorretos.');
      }
    } catch (err) {
      setError('Erro ao tentar fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl shadow-lg shadow-cyan-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Lumina<span className="text-cyan-400">Flow</span></h1>
          <p className="text-slate-400 mt-2">Acesse seu painel de criação</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Usuário" 
            placeholder="Digite seu usuário" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          
          <div className="space-y-4">
            <Input 
                label="Senha" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
            />
            
            <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-cyan-600 border-cyan-600' : 'border-slate-600 bg-slate-800 group-hover:border-slate-500'}`}>
                         {rememberMe && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="hidden"
                    />
                    <span className="text-sm text-slate-400 group-hover:text-slate-300 select-none">Lembrar de mim</span>
                </label>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-lg" isLoading={loading}>
            Entrar no Dashboard
          </Button>

          <div className="text-center mt-4 text-xs text-slate-500 space-y-1">
             <p>Admin: <strong>admin</strong> / <strong>admin</strong></p>
             <p>User: <strong>user</strong> / <strong>user</strong></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;