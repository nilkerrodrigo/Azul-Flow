import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import PreviewFrame from './components/PreviewFrame'; // Reutiliza para o modo público
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
  isFirebaseConfigured,
  getProjectById
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
  
  // Estado para Visualização Pública
  const [publicProject, setPublicProject] = useState<Project | null>(null);
  const [isPublicView, setIsPublicView] = useState(false);
  const [loadingPublic, setLoadingPublic] = useState(true);

  // --- Efeito de Rota Pública ---
  useEffect(() => {
    const checkPublicRoute = async () => {
        const params = new URLSearchParams(window.location.search);
        const publicId = params.get('p');

        if (publicId) {
            setIsPublicView(true);
            setLoadingPublic(true);
            // Se estiver configurado, busca do Firebase
            if (isFirebaseConfigured()) {
                const project = await getProjectById(publicId);
                setPublicProject(project);
            } else {
                // Tenta buscar do LocalStorage (funciona apenas no próprio navegador do criador)
                const stored = localStorage.getItem('azulflow_projects');
                if (stored) {
                    const localProjects = JSON.parse(stored) as Project[];
                    const project = localProjects.find(p => p.id === publicId);
                    setPublicProject(project || null);
                }
            }
            setLoadingPublic(false);
        }
    };
    checkPublicRoute();
  }, []);

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

  // --- Efeitos de Carregamento de Dados (Apenas se não for view pública) ---

  // 1. Carregar Usuários
  useEffect(() => {
    if (isPublicView) return;

    const loadUsers = async () => {
      setLoadingData(true);
      
      if (isFirebaseConfigured()) {
        try {
          const dbUsers = await fetchUsers();
          if (Array.isArray(dbUsers) && dbUsers.length > 0) {
            setUsers(dbUsers);
          } else {
             console.log("Banco de dados vazio ou coleção inexistente. Tentando Seed inicial...");
             const defaults = getDefaultUsers();
             setUsers(defaults);
             for (const u of defaults) {
                 const { error } = await createUser(u);
                 if (error && (error as any).code !== 'permission-denied') {
                     console.warn("Falha no Seed Automático:", error);
                 }
             }
          }
        } catch (e: any) {
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
  }, [isPublicView]);

  // 2. Carregar Projetos
  useEffect(() => {
    if (isPublicView) return;
    if (!appState.user) return; 

    const loadProjects = async () => {
        if (isFirebaseConfigured()) {
            const targetId = appState.user?.role === 'admin' ? undefined : appState.user?.id;
            const dbProjects = await fetchProjects(targetId);
            setAppState(prev => ({ ...prev, projects: dbProjects }));
        } else {
            setAppState(prev => ({ ...prev, projects: getLocalProjects() }));
        }
    };
    loadProjects();
  }, [appState.user, isPublicView]);

  // 3. Verificar Sessão
  useEffect(() => {
    if (isPublicView) return;
    if (users.length === 0 && !loadingData) return;

    try {
        const sessionStr = localStorage.getItem('azulflow_session');
        if (sessionStr) {
            const sessionUser = JSON.parse(sessionStr);
            const validUser = users.find(u => u.id === sessionUser.id && u.active);
            
            if (validUser) {
                 setAppState(prev => {
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
  }, [users, loadingData, isPublicView]);

  // --- Handlers ---

  const handleAuthenticate = async (username: string, pass: string, remember: boolean): Promise<{ success: boolean; error?: string }> => {
    let currentUsers = users;
    if (isFirebaseConfigured()) {
        try {
            const dbUsers = await fetchUsers();
            if (dbUsers.length > 0) {
                setUsers(dbUsers);
                currentUsers = dbUsers;
            }
        } catch (e) {}
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

     await handleAddUser(newUser);

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

  const handleAddUser = async (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    if (isFirebaseConfigured()) {
        const { error } = await createUser(newUser);
        if (error) {
            if ((error as any).code !== 'permission-denied') {
                console.error("Erro ao salvar no banco:", error);
            }
            setUsers(prev => prev.filter(u => u.id !== newUser.id));
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
    setAppState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== projectId),
        currentProjectId: prev.currentProjectId === projectId ? null : prev.currentProjectId,
        generatedCode: prev.currentProjectId === projectId ? null : prev.generatedCode
    }));

    if (isFirebaseConfigured()) {
        await deleteProjectDb(projectId);
    } else {
        const updated = appState.projects.filter(p => p.id !== projectId);
        localStorage.setItem('azulflow_projects', JSON.stringify(updated));
    }
  };

  useEffect(() => {
    if (appState.projects.length === 0 && !isFirebaseConfigured()) return;
    const currentProject = appState.projects.find(p => p.id === appState.currentProjectId);
    if (isFirebaseConfigured() && currentProject) {
        saveProjectDb({ ...currentProject, userId: appState.user?.id });
    } else {
        if (appState.projects.length > 0) {
            localStorage.setItem('azulflow_projects', JSON.stringify(appState.projects));
        }
    }
  }, [appState.projects, appState.currentProjectId]);

  // --- RENDERIZAÇÃO ---

  // Se for visualização pública, renderiza APENAS o preview em tela cheia
  if (isPublicView) {
      if (loadingPublic) {
          return (
              <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-2"></div>
                  Carregando página...
              </div>
          );
      }
      if (!publicProject) {
          return (
              <div className="flex flex-col h-screen w-full items-center justify-center bg-slate-950 text-white">
                  <h1 className="text-3xl font-bold mb-2">404</h1>
                  <p className="text-slate-400">Página não encontrada ou removida.</p>
                  <a href="/" className="mt-4 text-blue-400 hover:underline">Criar minha própria página</a>
              </div>
          );
      }
      return (
          <div className="h-screen w-full bg-white overflow-hidden">
             <PreviewFrame html={publicProject.html} />
          </div>
      );
  }

  // App Normal (Privado)
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