import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Sparkles } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulating API latency
    setTimeout(() => {
      // Hardcoded credentials for demo
      if (username === 'teste' && password === '123456') {
        onLogin({ username, isAuthenticated: true });
      } else {
        setError('Credenciais inválidas. Tente usuario: "teste" e senha: "123456"');
      }
      setLoading(false);
    }, 800);
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
          <Input 
            label="Senha" 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />

          <Button type="submit" className="w-full h-11 text-lg" isLoading={loading}>
            Entrar no Dashboard
          </Button>

          <div className="text-center mt-4 text-xs text-slate-500">
             Credenciais de teste: <strong>teste</strong> / <strong>123456</strong>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;