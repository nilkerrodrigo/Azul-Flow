import React, { useState, useRef, useEffect } from 'react';
import { AppState, Attachment, Project, AuditResult } from '../types';
import { generateLandingPage, runNeuralAudit } from '../services/geminiService';
import { Button } from './ui/Button';
import PreviewFrame, { PreviewFrameHandle } from './PreviewFrame';
import AuditModal from './AuditModal';
import { 
  Send, 
  Download, 
  Settings, 
  Loader2, 
  Code2, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Paperclip, 
  X, 
  FileText, 
  Image as ImageIcon,
  Plus,
  History,
  MessageSquare,
  Undo2,
  Redo2,
  Rocket,
  Edit3,
  Check,
  Globe,
  HelpCircle,
  Edit2,
  Palette,
  Wand2,
  BrainCircuit,
  LogOut,
  ShieldAlert,
  User as UserIcon,
  Shield,
  Trash2
} from 'lucide-react';

interface DashboardProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onOpenSettings: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onDeleteProject: (id: string) => void;
}

const THEMES = [
  { 
    id: 'original', 
    name: 'Neon Blue (Original)',
    description: 'Visual padrão tecnológico escuro com acentos em ciano.', 
    colors: 'from-cyan-500 to-blue-600',
    prompt: "Reescreva o estilo CSS/Tailwind para voltar ao tema original: Fundo escuro (slate-950), acentos em Ciano Neon e Azul Elétrico, visual tecnológico limpo." 
  },
  { 
    id: 'matrix', 
    name: 'Matrix Hacker', 
    description: 'Estilo terminal, fundo preto e textos em verde código.',
    colors: 'from-green-500 to-emerald-700',
    prompt: "Reescreva APENAS o estilo CSS/Tailwind para um tema 'Matrix/Hacker': Fundo preto profundo, tipografia monoespaçada (font-mono), textos e bordas em Verde Neon terminal. Mantenha todo o conteúdo textual igual." 
  },
  { 
    id: 'cyberpunk', 
    name: 'Cyberpunk Gold', 
    description: 'Alto contraste, amarelo vibrante e roxo profundo.',
    colors: 'from-yellow-400 to-purple-600',
    prompt: "Reescreva APENAS o estilo CSS/Tailwind para um tema 'Cyberpunk 2077': Fundo roxo escuro quase preto, acentos vibrantes em Amarelo Ouro e Rosa Choque. Use fontes sans-serif bold e bordas angulares. Mantenha o conteúdo igual." 
  },
  { 
    id: 'vaporwave', 
    name: 'Sunset Vapor', 
    description: 'Degradês retrô anos 80, rosa, roxo e laranja suave.',
    colors: 'from-pink-500 to-orange-400',
    prompt: "Reescreva APENAS o estilo CSS/Tailwind para um tema 'Vaporwave/Sunset': Degradês de Roxo para Laranja, fundo índigo escuro, sombras suaves (glow), cantos arredondados. Estética retro-futurista 80s." 
  },
  { 
    id: 'minimal', 
    name: 'Minimalist Light', 
    description: 'Fundo claro, visual limpo, corporativo e muito espaço em branco.',
    colors: 'from-slate-200 to-slate-400',
    prompt: "Reescreva APENAS o estilo CSS/Tailwind para um tema 'Minimalista Light Mode': Fundo branco ou cinza muito claro, tipografia preta forte (Inter/Sans), muito espaço em branco, acentos sutis em cinza ou azul marinho. Visual limpo e corporativo." 
  },
  { 
    id: 'dark_corp', 
    name: 'Dark Corporate', 
    description: 'Sóbrio, tons de cinza chumbo e azul discreto. Profissional.',
    colors: 'from-slate-700 to-slate-900',
    prompt: "Reescreva APENAS o estilo CSS/Tailwind para um tema 'Corporativo Dark': Fundo cinza chumbo (slate-900), cartões em slate-800, tipografia branca e cinza claro. Acentos em azul metálico discreto. Visual sério e confiável." 
  }
];

const Dashboard: React.FC<DashboardProps> = ({ appState, setAppState, onOpenSettings, onLogout, onOpenAdmin, onDeleteProject }) => {
  const [prompt, setPrompt] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'projects'>('chat');
  
  // New Features States
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isVisualEditing, setIsVisualEditing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showImageHelp, setShowImageHelp] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  
  // Audit States
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  // Renaming State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<PreviewFrameHandle>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [appState.messages]);

  // Sync history when generatedCode changes
  useEffect(() => {
    if (appState.generatedCode) {
      if (historyIndex < history.length - 1) {
         const newHistory = history.slice(0, historyIndex + 1);
         if (newHistory[newHistory.length - 1] !== appState.generatedCode) {
            newHistory.push(appState.generatedCode);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
         }
      } else {
         if (history[history.length - 1] !== appState.generatedCode) {
             setHistory(prev => [...prev, appState.generatedCode!]);
             setHistoryIndex(prev => prev + 1);
         }
      }
    }
  }, [appState.generatedCode]);

  // --- Audit Logic ---
  const handleAudit = async () => {
    if (!appState.generatedCode || !appState.apiKey) return;
    
    setShowAuditModal(true);
    setIsAuditing(true);
    setAuditResult(null);

    try {
        const result = await runNeuralAudit(appState.apiKey, appState.generatedCode);
        setAuditResult(result);
    } catch (error) {
        console.error(error);
        // Error handling visualizado no modal
    } finally {
        setIsAuditing(false);
    }
  };

  // --- Project Renaming ---
  const startEditingProject = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditingName(project.name);
  };

  const saveProjectName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingProjectId || !editingName.trim()) {
        setEditingProjectId(null);
        return;
    }

    setAppState(prev => ({
        ...prev,
        projects: prev.projects.map(p => 
            p.id === editingProjectId ? { ...p, name: editingName.trim() } : p
        )
    }));
    setEditingProjectId(null);
  };

  const cancelEditingProject = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingProjectId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm("Tem certeza que deseja excluir este projeto?")) {
          onDeleteProject(id);
      }
  };

  // --- Undo / Redo ---
  const handleUndo = () => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setAppState(prev => ({ ...prev, generatedCode: history[newIndex] }));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setAppState(prev => ({ ...prev, generatedCode: history[newIndex] }));
    }
  };

  // --- Visual Editor ---
  const toggleVisualEdit = () => {
    if (isVisualEditing) {
        const updatedHtml = previewRef.current?.getHtml();
        if (updatedHtml) {
            setAppState(prev => ({ ...prev, generatedCode: updatedHtml }));
            setAppState(prev => ({
                ...prev,
                messages: [...prev.messages, { role: 'model', text: 'Alterações manuais salvas com sucesso.', timestamp: Date.now() }]
            }));
        }
        previewRef.current?.enableEditMode(false);
        setIsVisualEditing(false);
    } else {
        previewRef.current?.enableEditMode(true);
        setIsVisualEditing(true);
    }
  };

  // --- File Upload ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1];
        setAttachment({
          mimeType: file.type,
          data: base64Data,
          fileName: file.name
        });
      };
      
      reader.readAsDataURL(file);
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Core Logic ---
  const handleNewProject = () => {
    setAppState(prev => ({
      ...prev,
      currentProjectId: null,
      generatedCode: null,
      messages: [],
    }));
    setHistory([]);
    setHistoryIndex(-1);
    setSidebarTab('chat');
  };

  const handleLoadProject = (project: Project) => {
    setAppState(prev => ({
      ...prev,
      currentProjectId: project.id,
      generatedCode: project.html,
      messages: [{ role: 'model', text: `Projeto "${project.name}" carregado. O que deseja alterar?`, timestamp: Date.now() }]
    }));
    setHistory([project.html]);
    setHistoryIndex(0);
    setSidebarTab('chat');
  };

  const handleGenerate = async (overridePrompt?: string) => {
    const textToUse = overridePrompt || prompt;
    
    if ((!textToUse.trim() && !attachment) || !appState.apiKey) return;

    if (isVisualEditing) toggleVisualEdit();

    const displayMsg = overridePrompt 
        ? `🔄 Aplicar tema: ${THEMES.find(t => overridePrompt.includes(t.prompt.substring(0, 20)))?.name || "Personalizado"}`
        : attachment 
            ? `[Arquivo: ${attachment.fileName}] ${textToUse}` 
            : textToUse;

    const newMessage = { role: 'user' as const, text: displayMsg, timestamp: Date.now() };
    
    setAppState(prev => ({
      ...prev,
      isGenerating: true,
      messages: [...prev.messages, newMessage]
    }));
    
    if (!overridePrompt) setPrompt('');
    const currentAttachment = attachment;
    if (!overridePrompt) clearAttachment();

    setShowThemeMenu(false);

    try {
      const finalPrompt = overridePrompt 
         ? `${overridePrompt} IMPORTANTE: Mantenha TODO o conteúdo de texto e imagens exatamente igual. Mude apenas as classes CSS/Tailwind.` 
         : textToUse;

      const generatedHtml = await generateLandingPage(
        appState.apiKey,
        finalPrompt,
        appState.generatedCode,
        currentAttachment
      );

      setAppState(prev => {
        const now = Date.now();
        let newProject = null;
        let updatedProjects = [...prev.projects];

        if (!prev.currentProjectId) {
            const newId = crypto.randomUUID();
            newProject = {
                id: newId,
                name: textToUse.slice(0, 30) || "Nova Landing Page",
                html: generatedHtml,
                lastModified: now,
                userId: prev.user?.id
            };
            updatedProjects = [newProject, ...updatedProjects];
        } else {
            updatedProjects = updatedProjects.map(p => 
                p.id === prev.currentProjectId 
                ? { ...p, html: generatedHtml, lastModified: now } 
                : p
            );
        }

        return {
            ...prev,
            projects: updatedProjects,
            currentProjectId: prev.currentProjectId || newProject?.id || null,
            generatedCode: generatedHtml,
            isGenerating: false,
            messages: [...prev.messages, { role: 'model' as const, text: 'Página atualizada com sucesso!', timestamp: now }]
        };
      });

    } catch (error) {
      console.error(error);
      setAppState(prev => ({
        ...prev,
        isGenerating: false,
        messages: [...prev.messages, { role: 'model' as const, text: 'Erro ao processar. Verifique a API Key ou o arquivo enviado.', timestamp: Date.now() }]
      }));
    }
  };

  const handleDownload = () => {
    if (!appState.generatedCode) return;
    const projectTitle = appState.projects.find(p => p.id === appState.currentProjectId)?.name || "landing_page";
    const safeTitle = projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const blob = new Blob([appState.generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      
      {/* Audit Modal */}
      {showAuditModal && (
        <AuditModal 
            results={auditResult} 
            isLoading={isAuditing} 
            onClose={() => setShowAuditModal(false)} 
        />
      )}

      {/* Image Help Modal */}
      {showImageHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-md shadow-2xl relative">
                <button onClick={() => setShowImageHelp(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-cyan-900/30 rounded-lg">
                        <ImageIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Como usar suas fotos?</h3>
                </div>

                <div className="space-y-4 text-slate-300 text-sm">
                    <p>O LuminaFlow gera código <strong>HTML estático</strong>. Por segurança, ele não pode acessar os arquivos do seu computador diretamente após a página ser baixada.</p>
                    
                    <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                        <strong className="text-white block mb-1">Opção 1: Usar Links (Recomendado)</strong>
                        <p className="text-slate-400">Hospede sua imagem (Imgur, Google Photos, seu site) e peça:</p>
                        <code className="block mt-2 bg-black/30 p-2 rounded text-cyan-300 text-xs">
                            "Coloque a imagem do link https://meusite.com/foto.jpg no banner principal"
                        </code>
                    </div>

                    <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                        <strong className="text-white block mb-1">Opção 2: Referência Visual</strong>
                        <p className="text-slate-400">Se você subir um arquivo aqui no chat, a IA usará o design e as cores dele como <strong>inspiração</strong>, mas colocará uma imagem de placeholder no código final.</p>
                    </div>

                    <p className="text-xs text-slate-500 mt-2">
                        Dica: Você pode editar o HTML baixado ou usar o "Editor Visual" para colar links de imagens depois.
                    </p>

                    <Button className="w-full mt-2" onClick={() => setShowImageHelp(false)}>Entendi</Button>
                </div>
            </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-[400px] shadow-2xl relative">
                <button onClick={() => setShowPublishModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                        <Rocket className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Página Publicada!</h3>
                    <p className="text-slate-400 mb-6 text-sm">Sua landing page está online em uma URL temporária simulada.</p>
                    
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 w-full flex items-center justify-between mb-4">
                        <span className="text-cyan-400 text-sm truncate">lumina.flow/p/{appState.currentProjectId?.slice(0,8) || 'demo'}</span>
                        <Button variant="ghost" className="h-6 text-xs" onClick={() => navigator.clipboard.writeText(`lumina.flow/p/${appState.currentProjectId}`)}>Copiar</Button>
                    </div>

                    <Button className="w-full" onClick={() => setShowPublishModal(false)}>Concluir</Button>
                </div>
            </div>
        </div>
      )}

      {/* Sidebar */}
      {!isFullScreen && (
        <div className="w-[400px] flex flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur-md transition-all duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <Code2 className="text-white w-5 h-5" />
                        </div>
                        <span className="font-bold text-lg text-white">Lumina<span className="text-cyan-400">Flow</span></span>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-slate-800 rounded-full pl-2 pr-1 py-1 border border-slate-700">
                        <div className="flex items-center gap-2 mr-2">
                            {appState.user?.role === 'admin' ? <Shield className="w-3 h-3 text-purple-400" /> : <UserIcon className="w-3 h-3 text-slate-400" />}
                            <span className="text-xs text-slate-300 max-w-[80px] truncate">{appState.user?.username}</span>
                        </div>
                        <button onClick={onLogout} title="Sair" className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-full transition-colors">
                            <LogOut className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 w-full">
                     {appState.user?.role === 'admin' && (
                        <button onClick={onOpenAdmin} className="flex-1 flex items-center justify-center gap-2 p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-medium rounded-lg transition-colors border border-purple-500/20">
                            <ShieldAlert className="w-4 h-4" /> Painel Admin
                        </button>
                    )}
                    <button onClick={handleNewProject} className="flex-1 flex items-center justify-center gap-2 p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-lg transition-colors border border-cyan-500/20">
                        <Plus className="w-4 h-4" /> Novo Projeto
                    </button>
                    <button onClick={onOpenSettings} title="Configurações" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors border border-slate-700">
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
                <button 
                    onClick={() => setSidebarTab('chat')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${sidebarTab === 'chat' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    <MessageSquare className="w-4 h-4" /> Editor
                </button>
                <button 
                    onClick={() => setSidebarTab('projects')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${sidebarTab === 'projects' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    <History className="w-4 h-4" /> Projetos ({appState.projects.length})
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto relative bg-slate-900/50">
                {sidebarTab === 'projects' ? (
                    <div className="p-4 space-y-3">
                        {appState.projects.length === 0 && (
                            <div className="text-center text-slate-500 mt-10">
                                <History className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                <p>Nenhum projeto salvo ainda.</p>
                            </div>
                        )}
                        {appState.projects.map((project) => (
                            <div 
                                key={project.id}
                                onClick={() => handleLoadProject(project)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg group ${
                                    appState.currentProjectId === project.id 
                                    ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_15px_rgba(8,145,178,0.1)]' 
                                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-2 h-7">
                                    {editingProjectId === project.id ? (
                                        <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                                            <input 
                                                autoFocus
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-sm text-white w-full focus:outline-none"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveProjectName(e as any);
                                                    if (e.key === 'Escape') cancelEditingProject(e as any);
                                                }}
                                            />
                                            <button onClick={saveProjectName} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                                            <button onClick={cancelEditingProject} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className={`font-medium truncate flex-1 ${appState.currentProjectId === project.id ? 'text-cyan-400' : 'text-slate-200'}`}>
                                                {project.name}
                                            </h3>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <button 
                                                    onClick={(e) => startEditingProject(e, project)}
                                                    className="p-1 text-slate-500 hover:text-white transition-all mr-1"
                                                    title="Renomear"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDeleteClick(e, project.id)}
                                                    className="p-1 text-slate-500 hover:text-red-400 transition-all"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">
                                    {new Date(project.lastModified).toLocaleDateString()} às {new Date(project.lastModified).toLocaleTimeString()}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 space-y-4 min-h-full">
                         {appState.messages.length === 0 && (
                            <div className="text-center mt-6 text-slate-500">
                                <p className="text-sm">Fale ou escreva para criar...</p>
                            </div>
                        )}
                        
                        {appState.messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] p-3 rounded-xl text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                    ? 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-100 rounded-br-none' 
                                    : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-bl-none shadow-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {appState.isGenerating && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg rounded-bl-none flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                                    <span className="text-xs text-slate-400">Gemini 3 Pro trabalhando...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 z-10">
                {attachment && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-slate-800 rounded-lg border border-slate-700 w-fit animate-in fade-in slide-in-from-bottom-2">
                        {attachment.mimeType.includes('image') ? <ImageIcon className="w-4 h-4 text-purple-400" /> : <FileText className="w-4 h-4 text-orange-400" />}
                        <span className="text-xs text-slate-300 max-w-[200px] truncate">{attachment.fileName}</span>
                        <button onClick={clearAttachment} className="p-1 hover:bg-slate-700 rounded-full">
                            <X className="w-3 h-3 text-slate-400" />
                        </button>
                    </div>
                )}

                <div className="relative">
                    <textarea
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none h-24 text-sm scrollbar-thin transition-all"
                        placeholder="Descreva a página ou alteração..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={appState.isGenerating}
                    />
                    
                    <div className="absolute right-2 bottom-2 flex gap-1">
                        {/* Image Help Button */}
                        <button
                            onClick={() => setShowImageHelp(true)}
                            className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-slate-800 rounded-lg transition-all"
                            title="Ajuda com Imagens"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>

                        <div className="w-px h-6 bg-slate-700 mx-1 my-auto"></div>

                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*,application/pdf"
                            onChange={handleFileSelect}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={appState.isGenerating}
                            className={`p-2 rounded-lg transition-all ${attachment ? 'text-cyan-400 bg-cyan-900/30' : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'}`}
                            title="Anexar referência"
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleGenerate()}
                            disabled={(!prompt.trim() && !attachment) || appState.isGenerating}
                            className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-900/20"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-slate-950 relative transition-all duration-300">
        {/* Top Bar with new controls */}
        <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/90 backdrop-blur z-20">
            <div className="flex items-center gap-4">
                {isFullScreen && (
                    <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <Code2 className="text-white w-3 h-3" />
                        </div>
                        <span className="font-bold text-white text-sm">LuminaFlow</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <h2 className="text-slate-300 text-sm font-medium">
                        {appState.projects.find(p => p.id === appState.currentProjectId)?.name || "Nova Página"}
                    </h2>
                    {isVisualEditing && <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30">Editando Texto</span>}
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {/* Audit Button */}
                <Button 
                    variant="ghost" 
                    className="h-8 text-xs px-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10" 
                    onClick={handleAudit}
                    disabled={!appState.generatedCode || appState.isGenerating}
                    title="Auditoria Neural (SEO & Performance)"
                >
                    <BrainCircuit className="w-4 h-4 mr-1" />
                    <span className="hidden xl:inline">Auditoria</span>
                </Button>
                
                <div className="w-px h-4 bg-slate-700 mx-1"></div>

                {/* Theme Selector */}
                <div className="relative">
                    <Button 
                        variant="ghost" 
                        className={`h-8 text-xs px-2 ${showThemeMenu ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-cyan-400'}`}
                        onClick={() => setShowThemeMenu(!showThemeMenu)}
                        title="Magic Restyler (Temas)"
                        disabled={!appState.generatedCode || appState.isGenerating}
                    >
                        <Palette className="w-4 h-4 mr-1" />
                        <span className="hidden xl:inline">Temas</span>
                    </Button>

                    {showThemeMenu && (
                        <div className="absolute top-10 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-50 p-2 grid gap-1">
                            <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Wand2 className="w-3 h-3" /> Mudar Estilo
                            </div>
                            {THEMES.map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => handleGenerate(theme.prompt)}
                                    title={theme.description}
                                    className="flex items-start gap-3 w-full p-3 rounded-lg hover:bg-slate-800 transition-colors text-left group"
                                >
                                    <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${theme.colors} shadow-sm group-hover:scale-110 transition-transform mt-0.5`}></div>
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-slate-300 group-hover:text-white block leading-tight">{theme.name}</span>
                                        <span className="text-[10px] text-slate-500 group-hover:text-slate-400 block mt-1 leading-snug">{theme.description}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-px h-4 bg-slate-700 mx-1"></div>

                {/* Undo / Redo Group */}
                <div className="flex bg-slate-800 rounded-lg p-0.5 mr-2">
                    <button 
                        onClick={handleUndo} 
                        disabled={historyIndex <= 0}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                        title="Desfazer (Undo)"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <div className="w-px bg-slate-700 my-1"></div>
                    <button 
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                        title="Refazer (Redo)"
                    >
                        <Redo2 className="w-4 h-4" />
                    </button>
                </div>

                <Button 
                    variant={isVisualEditing ? "primary" : "ghost"} 
                    className={`h-8 text-xs px-2 ${!isVisualEditing && 'text-slate-400 hover:text-white'}`}
                    onClick={toggleVisualEdit}
                    title="Editor Visual de Texto"
                    disabled={!appState.generatedCode}
                >
                    {isVisualEditing ? <Check className="w-3 h-3 mr-1" /> : <Edit3 className="w-3 h-3 mr-1" />}
                    {isVisualEditing ? "Salvar" : "Editar"}
                </Button>

                <div className="w-px h-4 bg-slate-700 mx-1"></div>

                 <Button 
                    variant="ghost" 
                    className="h-8 text-xs px-2 text-slate-400 hover:text-white" 
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    title={isFullScreen ? "Sair da Tela Cheia" : "Tela Cheia"}
                >
                    {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>

                <Button 
                    variant="primary" 
                    className="h-8 text-xs px-3 bg-gradient-to-r from-green-600 to-emerald-600 border-none hover:brightness-110" 
                    onClick={() => setShowPublishModal(true)}
                    disabled={!appState.generatedCode}
                >
                    <Globe className="w-3 h-3 mr-1" /> Publicar
                </Button>

                <Button 
                    variant="secondary" 
                    className="h-8 text-xs px-2" 
                    onClick={handleDownload}
                    disabled={!appState.generatedCode}
                    title="Baixar HTML"
                >
                    <Download className="w-4 h-4" />
                </Button>

                {isFullScreen && (
                    <Button variant="ghost" className="h-8 text-xs ml-2 text-red-400 hover:bg-red-500/10" onClick={onLogout}>
                        Sair
                    </Button>
                )}
            </div>
        </div>

        <div className="flex-1 p-0 bg-slate-950 relative overflow-hidden">
             <div className={`w-full h-full transition-all duration-300 ${isFullScreen ? '' : 'p-4'}`}>
                <div className={`w-full h-full overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 ${isFullScreen ? 'rounded-none border-0' : 'rounded-xl'}`}>
                    <PreviewFrame 
                        ref={previewRef}
                        html={appState.generatedCode} 
                        isEditing={isVisualEditing}
                    />
                </div>
             </div>
             
             {!appState.generatedCode && !appState.isGenerating && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700 animate-pulse">
                        <Code2 className="w-10 h-10 text-slate-600" />
                     </div>
                     <p className="text-slate-500 text-sm">O preview da sua página aparecerá aqui</p>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;