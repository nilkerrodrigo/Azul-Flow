import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import { AppState, User, Project } from './types';
import { 
  initSupabase, 
  fetchUsers, 
  createUser, 
  updateUserStatus, 
  deleteUserDb, 
  fetchProjects, 
  saveProjectDb, 
  deleteProjectDb,
  isSupabaseConfigured
} from './services/supabaseService';

// UUIDs estáticos para usuários padrão garantirem compatibilidade com banco
const DEFAULT_ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000002';

// Chave Padrão (Fallback)
const DEFAULT_GEMINI_KEY = 'AIzaSyBbRElD4suhZ5RCGQwOSbDXk0Mcq3gVTjo';

const App: React.FC = () => {
  // Inicialização de Estado
  const [appState, setAppState] = useState<AppState>(() => {
    // Tenta pegar do storage, se não existir, usa a chave padrão fornecida
    const storedKey = localStorage.getItem('gemini_api_key');
    const apiKey = storedKey !== null ? storedKey : DEFAULT_GEMINI_KEY;
    
    const sbUrl = localStorage.getItem('supabase_url') || '';
    const sbKey = localStorage.getItem('supabase_key') || '';

    // Inicializa Supabase se tiver credenciais
    initSupabase(sbUrl, sbKey);

    return {
      apiKey,
      supabaseUrl: sbUrl,
      supabaseKey: sbKey,
      view: 'login',
      user: null,
      currentProjectId: null,
      generatedCode: null,
      projects: [],
      isGenerating: false,
      messages: []
    };
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // --- Helpers Locais ---
  const getDefaultUsers = (): User[] => [
    { id: DEFAULT_ADMIN_ID, username: 'admin', password: 'admin', role: 'admin', active: true, isAuthenticated: false },
    { id: DEFAULT_USER_ID, username: 'user', password: 'user', role: 'user', active: true, isAuthenticated: false }
  ];

  const getLocalUsers = (): User[] => {
    try {
        const stored = localStorage.getItem('lumina_users');
        if (stored) {
            // Migração rápida para UUID se os IDs antigos forem detectados
            const parsed = JSON.parse(stored);
            if (parsed.some((u: any) => !u.id.includes('-') || u.id === 'admin-001')) {
                return getDefaultUsers();
            }
            return parsed.map((u: any) => ({ ...u, active: u.active ?? true }));
        }
    } catch (e) {}
    return getDefaultUsers();
  };

  const getLocalProjects = (): Project[] => {
      try {
        const stored = localStorage.getItem('lumina_projects');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return [];
  };

  // --- Efeitos de Carregamento de Dados ---

  // 1. Carregar Usuários (Supabase ou LocalStorage)
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingData(true);
      
      if (isSupabaseConfigured()) {
        try {
          const dbUsers = await fetchUsers();
          if (dbUsers.length > 0) {
            setUsers(dbUsers);
          } else {
             // AUTO-SEED: Se DB vazio (primeira conexão), insere os defaults no Supabase
             console.log("Banco de dados vazio. Realizando Seed inicial...");
             const defaults = getDefaultUsers();
             setUsers(defaults);
             
             // Insere silenciosamente no banco
             for (const u of defaults) {
                 await createUser(u);
             }
          }
        } catch (e) {
          console.error("Erro ao carregar do Supabase", e);
          setUsers(getLocalUsers());
        }
      } else {
        setUsers(getLocalUsers());
      }
      setLoadingData(false);
    };

    loadUsers();
  }, [appState.supabaseUrl, appState.supabaseKey]);

  // 2. Carregar Projetos (Supabase ou LocalStorage)
  // Nota: Agora depende de appState.user para filtrar corretamente
  useEffect(() => {
    if (!appState.user) return; // Só carrega se estiver logado

    const loadProjects = async () => {
        if (isSupabaseConfigured()) {
            // Se for admin, carrega tudo (passando undefined). Se for user, passa ID.
            const targetId = appState.user?.role === 'admin' ? undefined : appState.user?.id;
            const dbProjects = await fetchProjects(targetId);
            setAppState(prev => ({ ...prev, projects: dbProjects }));
        } else {
            setAppState(prev => ({ ...prev, projects: getLocalProjects() }));
        }
    };
    loadProjects();
  }, [appState.supabaseUrl, appState.supabaseKey, appState.user]);

  // 3. Verificar Sessão Persistida (Lembrar de mim)
  useEffect(() => {
    // Só tenta restaurar sessão depois que users foram carregados
    if (users.length === 0 && !loadingData) return; // Aguarda usuários carregarem

    try {
        const sessionStr = localStorage.getItem('lumina_session');
        if (sessionStr) {
            const sessionUser = JSON.parse(sessionStr);
            const validUser = users.find(u => u.id === sessionUser.id && u.active);
            
            if (validUser) {
                 setAppState(prev => {
                     // Evita loop se já estiver logado
                     if (prev.user?.id === validUser.id) return prev;
                     return { ...prev, user: { ...validUser, isAuthenticated: true }, view: 'dashboard' };
                 });
            } else {
                localStorage.removeItem('lumina_session');
            }
        }
    } catch (e) {
        console.error("Failed to restore session", e);
    }
  }, [users, loadingData]);

  // --- Handlers ---

  const handleAuthenticate = async (username: string, pass: string, remember: boolean): Promise<{ success: boolean; error?: string }> => {
    // Re-busca usuários do DB se possível para garantir login atualizado
    let currentUsers = users;
    if (isSupabaseConfigured()) {
        const dbUsers = await fetchUsers();
        if (dbUsers.length > 0) {
            setUsers(dbUsers);
            currentUsers = dbUsers;
        }
    }

    const validUser = currentUsers.find(u => u.username === username && u.password === pass);
    
    if (validUser) {
        if (!validUser.active) {
            return { success: false, error: 'Esta conta foi desativada pelo administrador.' };
        }
        
        const authenticatedUser = { ...validUser, isAuthenticated: true };
        
        setAppState(prev => ({ 
            ...prev, 
            user: authenticatedUser, 
            view: 'dashboard' 
        }));

        if (remember) {
            localStorage.setItem('lumina_session', JSON.stringify(authenticatedUser));
        }

        return { success: true };
    }
    return { success: false };
  };

  const handleLogout = () => {
    localStorage.removeItem('lumina_session');
    setAppState(prev => ({ 
        ...prev, 
        user: null, 
        view: 'login', 
        generatedCode: null, 
        currentProjectId: null,
        messages: [] 
    }));
  };

  const handleSaveSettings = (apiKey: string, sbUrl: string, sbKey: string) => {
    localStorage.setItem('gemini_api_key', apiKey);
    localStorage.setItem('supabase_url', sbUrl);
    localStorage.setItem('supabase_key', sbKey);
    
    initSupabase(sbUrl, sbKey); // Reinicia conexão imediatamente
    
    setAppState(prev => ({ ...prev, apiKey, supabaseUrl: sbUrl, supabaseKey: sbKey }));
  };

  // --- Data Management (Hybrid: State + DB + LocalStorage) ---

  const handleAddUser = async (newUser: User) => {
    // Atualiza estado local (Otimista)
    setUsers(prev => [...prev, newUser]);
    
    // Salva
    if (isSupabaseConfigured()) {
        const { error } = await createUser(newUser);
        
        if (error) {
            // Se falhar, reverte a interface e avisa o usuário
            console.error("Erro ao salvar no banco:", error);
            setUsers(prev => prev.filter(u => u.id !== newUser.id));
            
            // Mensagem amigável sobre RLS
            let msg = `Erro ao salvar no banco: ${error.message}`;
            if (error.code === '42501' || error.message?.includes('violates row-level security')) {
                msg = "ERRO DE PERMISSÃO (RLS):\n\nO Supabase bloqueou a criação do usuário.\n\nSOLUÇÃO: Vá no painel do Supabase > Table Editor > users > Clique em 'RLS Policy' e desative o RLS (ou adicione uma política 'INSERT' para 'public').";
            }
            alert(msg);
        }
    } else {
        localStorage.setItem('lumina_users', JSON.stringify([...users, newUser]));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    
    if (isSupabaseConfigured()) {
        await deleteUserDb(userId);
    } else {
        const updated = users.filter(u => u.id !== userId);
        localStorage.setItem('lumina_users', JSON.stringify(updated));
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, active: !u.active } : u
      );
      setUsers(updatedUsers);

      const targetUser = updatedUsers.find(u => u.id === userId);
      
      if (isSupabaseConfigured() && targetUser) {
          await updateUserStatus(userId, targetUser.active);
      } else {
          localStorage.setItem('lumina_users', JSON.stringify(updatedUsers));
      }
  };

  const handleDeleteProject = async (projectId: string) => {
    // 1. Atualiza UI imediatamente (Optimistic UI)
    setAppState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== projectId),
        // Se estiver vendo o projeto deletado, reseta a view
        currentProjectId: prev.currentProjectId === projectId ? null : prev.currentProjectId,
        generatedCode: prev.currentProjectId === projectId ? null : prev.generatedCode
    }));

    // 2. Persiste a exclusão
    if (isSupabaseConfigured()) {
        await deleteProjectDb(projectId);
    } else {
        const updated = appState.projects.filter(p => p.id !== projectId);
        localStorage.setItem('lumina_projects', JSON.stringify(updated));
    }
  };

  // Observa mudanças em projects no AppState para salvar (autosave)
  useEffect(() => {
    if (appState.projects.length === 0 && !isSupabaseConfigured()) return;

    // Se mudou algo no projeto atual (ex: gerou novo codigo), salva
    const currentProject = appState.projects.find(p => p.id === appState.currentProjectId);
    
    if (isSupabaseConfigured() && currentProject) {
        // Salva apenas o projeto modificado para economizar requisições
        saveProjectDb({ ...currentProject, userId: appState.user?.id });
    } else {
        // Backup local
        if (appState.projects.length > 0) {
            localStorage.setItem('lumina_projects', JSON.stringify(appState.projects));
        }
    }
  }, [appState.projects, appState.currentProjectId]);


  return (
    <div className="font-sans text-slate-200">
      {appState.view === 'login' && (
        <Login onAuthenticate={handleAuthenticate} />
      )}

      {appState.view === 'dashboard' && appState.user && (
        <Dashboard 
          appState={appState} 
          setAppState={setAppState}
          onOpenSettings={() => setAppState(prev => ({ ...prev, view: 'settings' }))}
          onLogout={handleLogout}
          onOpenAdmin={() => setAppState(prev => ({ ...prev, view: 'admin' }))}
          onDeleteProject={handleDeleteProject}
        />
      )}

      {appState.view === 'settings' && (
        <Settings 
          apiKey={appState.apiKey} 
          supabaseUrl={appState.supabaseUrl}
          supabaseKey={appState.supabaseKey}
          userRole={appState.user?.role}
          onSave={handleSaveSettings} 
          onBack={() => setAppState(prev => ({ ...prev, view: 'dashboard' }))} 
        />
      )}

      {appState.view === 'admin' && appState.user?.role === 'admin' && (
        <AdminPanel 
            users={users}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onToggleUserStatus={handleToggleUserStatus}
            onBack={() => setAppState(prev => ({ ...prev, view: 'dashboard' }))}
            currentUserId={appState.user.id}
        />
      )}
    </div>
  );
};

export default App;