import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import { AppState, User, Project } from './types';
import { 
  initFirebase, 
  fetchUsers, 
  createUser, 
  updateUserStatus, 
  deleteUserDb, 
  fetchProjects, 
  saveProjectDb, 
  deleteProjectDb,
  isFirebaseConfigured
} from './services/firebaseService';

// UUIDs estáticos para usuários padrão garantirem compatibilidade com banco
const DEFAULT_ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000002';

const App: React.FC = () => {
  // Inicialização de Estado
  const [appState, setAppState] = useState<AppState>(() => {
    const envGemini = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    const storedKey = localStorage.getItem('gemini_api_key');
    // Removemos a chave padrão insegura. Se não houver chave, o usuário deve inserir nas configurações.
    const apiKey = storedKey || envGemini || '';
    
    // Inicializa Firebase com a config hardcoded no serviço
    initFirebase();

    return {
      apiKey,
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
        const stored = localStorage.getItem('azulflow_users');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {}
    return getDefaultUsers();
  };

  const getLocalProjects = (): Project[] => {
      try {
        const stored = localStorage.getItem('azulflow_projects');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return [];
  };

  // --- Efeitos de Carregamento de Dados ---

  // 1. Carregar Usuários (Firebase ou LocalStorage)
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingData(true);
      
      if (isFirebaseConfigured()) {
        try {
          const dbUsers = await fetchUsers();
          // Verifica se retornou array válido e com itens
          if (Array.isArray(dbUsers) && dbUsers.length > 0) {
            setUsers(dbUsers);
          } else {
             // AUTO-SEED: Se DB vazio (primeira conexão), insere os defaults no Firebase
             console.log("Banco de dados vazio ou coleção inexistente. Tentando Seed inicial...");
             const defaults = getDefaultUsers();
             setUsers(defaults);
             
             // Insere silenciosamente no banco
             for (const u of defaults) {
                 const { error } = await createUser(u);
                 // Se der erro no seed (permissão ou outro), apenas loga warning se não for permissão
                 if (error && (error as any).code !== 'permission-denied') {
                     console.warn("Falha no Seed Automático:", error);
                 }
             }
          }
        } catch (e: any) {
          // Se for erro de permissão, o serviço já tratou e desativou o DB.
          // Apenas logamos informativo e carregamos local.
          if (e?.code === 'permission-denied' || e?.message?.includes('Missing or insufficient permissions')) {
             console.log("Modo Offline ativado (Permissões do Firestore).");
          } else {
             console.error("Erro crítico ao carregar do Firebase", e);
          }
          setUsers(getLocalUsers());
        }
      } else {
        setUsers(getLocalUsers());
      }
      setLoadingData(false);
    };

    loadUsers();
  }, []); // Executa apenas na montagem, pois a config do Firebase agora é estática

  // 2. Carregar Projetos (Firebase ou LocalStorage)
  useEffect(() => {
    if (!appState.user) return; // Só carrega se estiver logado

    const loadProjects = async () => {
        if (isFirebaseConfigured()) {
            // Se for admin, carrega tudo (passando undefined). Se for user, passa ID.
            const targetId = appState.user?.role === 'admin' ? undefined : appState.user?.id;
            const dbProjects = await fetchProjects(targetId);
            setAppState(prev => ({ ...prev, projects: dbProjects }));
        } else {
            setAppState(prev => ({ ...prev, projects: getLocalProjects() }));
        }
    };
    loadProjects();
  }, [appState.user]);

  // 3. Verificar Sessão Persistida (Lembrar de mim)
  useEffect(() => {
    // Só tenta restaurar sessão depois que users foram carregados
    if (users.length === 0 && !loadingData) return; // Aguarda usuários carregarem

    try {
        const sessionStr = localStorage.getItem('azulflow_session');
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
                localStorage.removeItem('azulflow_session');
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
    if (isFirebaseConfigured()) {
        try {
            const dbUsers = await fetchUsers();
            if (dbUsers.length > 0) {
                setUsers(dbUsers);
                currentUsers = dbUsers;
            }
        } catch (e) {
            // Ignora erro de fetch no login, usa cache local
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
            localStorage.setItem('azulflow_session', JSON.stringify(authenticatedUser));
        }

        return { success: true };
    }
    return { success: false };
  };

  const handleRegister = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
     // Re-busca para garantir que não estamos duplicando
     let currentUsers = users;
     if (isFirebaseConfigured()) {
         try {
             const dbUsers = await fetchUsers();
             if (dbUsers.length > 0) {
                 setUsers(dbUsers);
                 currentUsers = dbUsers;
             }
         } catch(e) { /* ignore */ }
     }

     if (currentUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
         return { success: false, error: 'Este nome de usuário já está em uso.' };
     }

     const newUser: User = {
         id: crypto.randomUUID(),
         username: username,
         password: pass,
         role: 'user',
         active: true,
         isAuthenticated: true
     };

     // Salva no banco/localstorage via helper existente
     await handleAddUser(newUser);

     // Loga automaticamente
     setAppState(prev => ({ 
        ...prev, 
        user: newUser, 
        view: 'dashboard' 
    }));

     return { success: true };
  };

  const handleLogout = () => {
    localStorage.removeItem('azulflow_session');
    setAppState(prev => ({ 
        ...prev, 
        user: null, 
        view: 'login', 
        generatedCode: null, 
        currentProjectId: null,
        messages: [] 
    }));
  };

  const handleSaveSettings = (apiKey: string) => {
    localStorage.setItem('gemini_api_key', apiKey);
    setAppState(prev => ({ ...prev, apiKey }));
  };

  // --- Data Management (Hybrid: State + DB + LocalStorage) ---

  const handleAddUser = async (newUser: User) => {
    // Atualiza estado local (Otimista)
    setUsers(prev => [...prev, newUser]);
    
    // Salva
    if (isFirebaseConfigured()) {
        const { error } = await createUser(newUser);
        
        if (error) {
            // Se não for permissão negada, loga
            if ((error as any).code !== 'permission-denied') {
                console.error("Erro ao salvar no banco:", error);
            }
            
            // Reverte em caso de erro no banco para evitar desincronia
            setUsers(prev => prev.filter(u => u.id !== newUser.id));
            
            // Não alertamos aqui se for chamado pelo handleRegister para tratarmos o erro lá
            // Apenas para admin manual
            if (newUser.role === 'admin' && (error as any).code !== 'permission-denied') {
                 alert(`Erro ao salvar no banco: ${error.message}`);
            }
        }
    } else {
        localStorage.setItem('azulflow_users', JSON.stringify([...users, newUser]));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    
    if (isFirebaseConfigured()) {
        await deleteUserDb(userId);
    } else {
        const updated = users.filter(u => u.id !== userId);
        localStorage.setItem('azulflow_users', JSON.stringify(updated));
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, active: !u.active } : u
      );
      setUsers(updatedUsers);

      const targetUser = updatedUsers.find(u => u.id === userId);
      
      if (isFirebaseConfigured() && targetUser) {
          await updateUserStatus(userId, targetUser.active);
      } else {
          localStorage.setItem('azulflow_users', JSON.stringify(updatedUsers));
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
    if (isFirebaseConfigured()) {
        await deleteProjectDb(projectId);
    } else {
        const updated = appState.projects.filter(p => p.id !== projectId);
        localStorage.setItem('azulflow_projects', JSON.stringify(updated));
    }
  };

  // Observa mudanças em projects no AppState para salvar (autosave)
  useEffect(() => {
    if (appState.projects.length === 0 && !isFirebaseConfigured()) return;

    // Se mudou algo no projeto atual (ex: gerou novo codigo), salva
    const currentProject = appState.projects.find(p => p.id === appState.currentProjectId);
    
    if (isFirebaseConfigured() && currentProject) {
        // Salva apenas o projeto modificado para economizar requisições
        saveProjectDb({ ...currentProject, userId: appState.user?.id });
    } else {
        // Backup local
        if (appState.projects.length > 0) {
            localStorage.setItem('azulflow_projects', JSON.stringify(appState.projects));
        }
    }
  }, [appState.projects, appState.currentProjectId]);


  return (
    <div className="font-sans text-slate-200">
      {appState.view === 'login' && (
        <Login 
            onAuthenticate={handleAuthenticate} 
            onRegister={handleRegister} 
        />
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