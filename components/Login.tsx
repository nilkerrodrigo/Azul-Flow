import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Sparkles, UserPlus, LogIn } from 'lucide-react';

interface LoginProps {
  onAuthenticate: (u: string, p: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  onRegister: (u: string, p: string) => Promise<{ success: boolean; error?: string }>;
}

const Login: React.FC<LoginProps> = ({ onAuthenticate, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (!username || !password) {
        setError('Preencha todos os campos.');
        setLoading(false);
        return;
    }

    try {
      if (isRegistering) {
        // Modo Cadastro
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }
        
        const result = await onRegister(username, password);
        if (result.success) {
            setSuccessMsg('Conta criada com sucesso! Entrando...');
            // O App.tsx fará o login automático, mas podemos dar um feedback visual curto
        } else {
            setError(result.error || 'Erro ao criar conta.');
        }

      } else {
        // Modo Login
        const result = await onAuthenticate(username, password, rememberMe);
        if (!result.success) {
            setError(result.error || 'Usuário ou senha incorretos.');
        }
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado.');
    } finally {
      if (!successMsg) setLoading(false);
    }
  };

  const toggleMode = () => {
      setIsRegistering(!isRegistering);
      setError('');
      setSuccessMsg('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl z-10 transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-blue-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Azul <span className="text-blue-400">Flow</span></h1>
          <p className="text-slate-400 mt-2">
            {isRegistering ? 'Crie sua conta gratuita' : 'Acesse seu painel de criação'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Usuário" 
            placeholder="Escolha um nome de usuário" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          
          <div className="space-y-4">
            <Input 
                label="Senha" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
                autoComplete={isRegistering ? "new-password" : "current-password"}
            />
            
            {isRegistering && (
                <Input 
                    label="Confirmar Senha" 
                    type="password" 
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={password && confirmPassword && password !== confirmPassword ? "border-red-500 focus:border-red-500" : ""}
                />
            )}
            
            {!isRegistering && (
                <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-slate-600 bg-slate-800 group-hover:border-slate-500'}`}>
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
            )}
          </div>

          {successMsg && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-3 rounded-lg text-center animate-pulse">
                  {successMsg}
              </div>
          )}

          <Button type="submit" className="w-full h-11 text-lg" isLoading={loading}>
            {isRegistering ? (
                <>Criar Conta <UserPlus className="w-5 h-5 ml-2" /></>
            ) : (
                <>Entrar <LogIn className="w-5 h-5 ml-2" /></>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-sm mb-3">
                {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta ainda?'}
            </p>
            <button 
                onClick={toggleMode}
                className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors hover:underline"
            >
                {isRegistering ? 'Fazer Login' : 'Cadastre-se Gratuitamente'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;