export interface User {
  username: string;
  isAuthenticated: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Attachment {
  mimeType: string;
  data: string; // base64 encoded string (raw, no header)
  fileName: string;
}

export interface Project {
  id: string;
  name: string;
  html: string;
  lastModified: number;
}

export type ViewState = 'dashboard' | 'settings' | 'login';

export interface AuditSuggestion {
  category: 'SEO' | 'Performance' | 'Acessibilidade' | 'Design';
  title: string;
  description: string;
  impact: 'Alto' | 'Médio' | 'Baixo';
}

export interface AuditResult {
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
  suggestions: AuditSuggestion[];
  summary: string;
}

export interface AppState {
  apiKey: string;
  view: ViewState;
  user: User | null;
  
  // State do projeto atual
  currentProjectId: string | null;
  generatedCode: string | null;
  
  // Lista de projetos
  projects: Project[];
  
  isGenerating: boolean;
  messages: ChatMessage[];
}