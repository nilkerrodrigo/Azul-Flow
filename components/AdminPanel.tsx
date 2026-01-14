import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ArrowLeft, Trash2, Shield, User as UserIcon, Plus, Users, UserCheck, ShieldCheck, Power, Search } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
  onBack: () => void;
  currentUserId?: string;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className={`bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-lg relative overflow-hidden group`}>
        <div className={`absolute right-0 top-0 w-24 h-24 ${color} opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity`}></div>
        <div>
            <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg bg-slate-800 ${color.replace('bg-', 'text-').replace('/10', '')} bg-opacity-10`}>
            {icon}
        </div>
    </div>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ users, onAddUser, onDeleteUser, onToggleUserStatus, onBack, currentUserId }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New user form state
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' as 'admin' | 'user', active: true });
  const [error, setError] = useState('');

  // Metrics Logic
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.active).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;

  // Filtered Users
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      setError("Preencha todos os campos");
      return;
    }
    
    if (users.some(u => u.username === newUser.username)) {
      setError("Usuário já existe");
      return;
    }

    onAddUser({
      id: crypto.randomUUID(),
      username: newUser.username,
      password: newUser.password,
      role: newUser.role,
      active: newUser.active,
      isAuthenticated: false
    });
    
    setShowAddModal(false);
    setNewUser({ username: '', password: '', role: 'user', active: true });
    setError('');
  };

  return (
    <div className="flex-1 p-8 bg-slate-950 overflow-auto h-screen relative scrollbar-thin">
      <div className="max-w-6xl mx-auto pb-10">
        <Button variant="ghost" onClick={onBack} className="mb-6 pl-0 hover:pl-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Dashboard
        </Button>

        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <Shield className="text-purple-500" /> Painel Administrativo
                </h2>
                <p className="text-slate-400">Gerencie usuários, permissões e monitore o acesso.</p>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-500 border-purple-500/30">
                <Plus className="w-4 h-4" /> Novo Usuário
            </Button>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard 
                title="Total de Usuários" 
                value={totalUsers} 
                icon={<Users className="w-6 h-6" />} 
                color="bg-blue-500"
            />
            <StatCard 
                title="Usuários Ativos" 
                value={activeUsers} 
                icon={<UserCheck className="w-6 h-6" />} 
                color="bg-green-500"
            />
            <StatCard 
                title="Administradores" 
                value={adminUsers} 
                icon={<ShieldCheck className="w-6 h-6" />} 
                color="bg-purple-500"
            />
        </div>

        {/* User Management Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {/* Table Header / Filters */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-semibold text-slate-200">Lista de Usuários</h3>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Buscar usuário..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
            </div>

            <table className="w-full text-left">
                <thead className="bg-slate-800 border-b border-slate-700">
                    <tr>
                        <th className="p-4 text-slate-400 font-medium text-sm">Usuário</th>
                        <th className="p-4 text-slate-400 font-medium text-sm">Função</th>
                        <th className="p-4 text-slate-400 font-medium text-sm">Status</th>
                        <th className="p-4 text-slate-400 font-medium text-sm text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-800/50 transition-colors group">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-700/50 text-slate-400'}`}>
                                        {user.role === 'admin' ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <span className="text-slate-200 font-medium block">{user.username}</span>
                                        <span className="text-xs text-slate-500 font-mono">{user.id.slice(0, 8)}</span>
                                    </div>
                                    {user.id === currentUserId && <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">Você</span>}
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`text-xs px-2 py-1 rounded-full border ${
                                    user.role === 'admin' 
                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                                    : 'bg-slate-700/50 text-slate-400 border-slate-600'
                                }`}>
                                    {user.role === 'admin' ? 'ADMINISTRADOR' : 'USUÁRIO'}
                                </span>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${user.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                                    <span className={`text-sm ${user.active ? 'text-green-400' : 'text-red-400'}`}>
                                        {user.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                        onClick={() => onToggleUserStatus(user.id)}
                                        disabled={user.id === currentUserId}
                                        className={`p-2 rounded-lg transition-colors border ${
                                            user.active 
                                            ? 'text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/10' 
                                            : 'text-green-400 border-green-500/20 hover:bg-green-500/10'
                                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                                        title={user.active ? "Desativar Acesso" : "Ativar Acesso"}
                                    >
                                        <Power className="w-4 h-4" />
                                    </button>

                                    <button 
                                        onClick={() => onDeleteUser(user.id)}
                                        disabled={user.id === currentUserId}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg disabled:opacity-30 disabled:hover:text-slate-500 transition-all"
                                        title="Excluir Usuário"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-500">
                                Nenhum usuário encontrado para "{searchTerm}"
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Plus className="w-5 h-5 text-purple-400" />
                    </div>
                    Adicionar Novo Usuário
                </h3>
                
                <form onSubmit={handleAddSubmit} className="space-y-5">
                    <Input 
                        label="Nome de Usuário"
                        value={newUser.username}
                        onChange={e => setNewUser({...newUser, username: e.target.value})}
                        autoFocus
                    />
                    <Input 
                        label="Senha Provisória"
                        type="password"
                        value={newUser.password}
                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-3">Nível de Permissão</label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className={`cursor-pointer border p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${newUser.role === 'user' ? 'bg-slate-800 border-cyan-500 shadow-[0_0_10px_rgba(8,145,178,0.1)]' : 'border-slate-700 hover:bg-slate-800/50'}`}>
                                <input 
                                    type="radio" 
                                    name="role" 
                                    checked={newUser.role === 'user'} 
                                    onChange={() => setNewUser({...newUser, role: 'user'})}
                                    className="hidden"
                                />
                                <UserIcon className={`w-6 h-6 ${newUser.role === 'user' ? 'text-cyan-400' : 'text-slate-500'}`} />
                                <span className={`text-sm font-medium ${newUser.role === 'user' ? 'text-white' : 'text-slate-400'}`}>Usuário Padrão</span>
                            </label>

                            <label className={`cursor-pointer border p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${newUser.role === 'admin' ? 'bg-slate-800 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'border-slate-700 hover:bg-slate-800/50'}`}>
                                <input 
                                    type="radio" 
                                    name="role" 
                                    checked={newUser.role === 'admin'} 
                                    onChange={() => setNewUser({...newUser, role: 'admin'})}
                                    className="hidden"
                                />
                                <ShieldCheck className={`w-6 h-6 ${newUser.role === 'admin' ? 'text-purple-400' : 'text-slate-500'}`} />
                                <span className={`text-sm font-medium ${newUser.role === 'admin' ? 'text-white' : 'text-slate-400'}`}>Administrador</span>
                            </label>
                        </div>
                    </div>
                    
                    <div>
                         <label className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${newUser.active ? 'bg-green-500' : 'bg-slate-600'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${newUser.active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={newUser.active}
                                onChange={(e) => setNewUser({...newUser, active: e.target.checked})}
                                className="hidden"
                            />
                            <span className="text-sm text-slate-300">Conta Ativa imediatamente</span>
                         </label>
                    </div>

                    {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded border border-red-500/20 text-center">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1">Cancelar</Button>
                        <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 border-purple-500/30">Criar Usuário</Button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;