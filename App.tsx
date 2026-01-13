import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { AppState, User, Project } from './types';

const App: React.FC = () => {
  // Load initial state from local storage if available
  const [appState, setAppState] = useState<AppState>(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    // Tenta carregar projetos salvos
    let savedProjects: Project[] = [];
    try {
        const projectsStr = localStorage.getItem('lumina_projects');
        if (projectsStr) savedProjects = JSON.parse(projectsStr);
    } catch (e) {
        console.error("Failed to load projects", e);
    }

    return {
      apiKey: savedKey || '',
      view: 'login',
      user: null,
      currentProjectId: null,
      generatedCode: null,
      projects: savedProjects,
      isGenerating: false,
      messages: []
    };
  });

  // Salvar projetos sempre que a lista mudar
  useEffect(() => {
    if (appState.projects.length > 0) {
        localStorage.setItem('lumina_projects', JSON.stringify(appState.projects));
    }
  }, [appState.projects]);

  const handleLogin = (user: User) => {
    setAppState(prev => ({ ...prev, user, view: 'dashboard' }));
  };

  const handleLogout = () => {
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

  const navigateToSettings = () => {
    setAppState(prev => ({ ...prev, view: 'settings' }));
  };

  const navigateBackToDashboard = () => {
    setAppState(prev => ({ ...prev, view: 'dashboard' }));
  };

  return (
    <div className="font-sans text-slate-200">
      {appState.view === 'login' && (
        <Login onLogin={handleLogin} />
      )}

      {appState.view === 'dashboard' && appState.user && (
        <Dashboard 
          appState={appState} 
          setAppState={setAppState}
          onOpenSettings={navigateToSettings}
          onLogout={handleLogout}
        />
      )}

      {appState.view === 'settings' && (
        <Settings 
          apiKey={appState.apiKey} 
          onSave={handleSaveSettings} 
          onBack={navigateBackToDashboard} 
        />
      )}
    </div>
  );
};

export default App;