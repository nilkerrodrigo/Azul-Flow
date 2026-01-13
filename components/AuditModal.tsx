import React from 'react';
import { AuditResult } from '../types';
import { X, CheckCircle, AlertTriangle, Zap, Search, Eye, Palette } from 'lucide-react';
import { Button } from './ui/Button';

interface AuditModalProps {
  results: AuditResult | null;
  onClose: () => void;
  isLoading: boolean;
}

const ScoreCircle: React.FC<{ score: number; label: string; icon: React.ReactNode; color: string }> = ({ score, label, icon, color }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    
    // Determina cor baseada na nota
    let strokeColor = color;
    if (score < 50) strokeColor = "#ef4444"; // Red
    else if (score < 80) strokeColor = "#eab308"; // Yellow
    else strokeColor = "#22c55e"; // Green

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="relative w-24 h-24 mb-2">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="#1e293b"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke={strokeColor}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{score}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                {icon} {label}
            </div>
        </div>
    );
};

const AuditModal: React.FC<AuditModalProps> = ({ results, onClose, isLoading }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Auditoria Neural</h2>
                    <p className="text-sm text-slate-400">Análise técnica avançada via Gemini 3 Pro</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-slate-800 border-t-purple-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-purple-500 animate-pulse" />
                        </div>
                    </div>
                    <h3 className="text-lg font-medium text-white">Analisando código...</h3>
                    <p className="text-slate-400 text-sm max-w-xs">A IA está verificando SEO, acessibilidade, performance e estrutura do seu projeto.</p>
                </div>
            ) : results ? (
                <div className="space-y-8">
                    {/* Summary */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Resumo da IA</h4>
                        <p className="text-slate-200 leading-relaxed">{results.summary}</p>
                    </div>

                    {/* Scores */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ScoreCircle score={results.seoScore} label="SEO" color="#3b82f6" icon={<Search className="w-4 h-4 text-blue-400" />} />
                        <ScoreCircle score={results.accessibilityScore} label="Acessibilidade" color="#a855f7" icon={<Eye className="w-4 h-4 text-purple-400" />} />
                        <ScoreCircle score={results.performanceScore} label="Performance" color="#22c55e" icon={<Zap className="w-4 h-4 text-green-400" />} />
                    </div>

                    {/* Suggestions */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            Sugestões de Melhoria
                        </h3>
                        <div className="space-y-3">
                            {results.suggestions.map((suggestion, idx) => (
                                <div key={idx} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex gap-4 hover:border-slate-600 transition-colors">
                                    <div className="mt-1">
                                        {suggestion.category === 'SEO' && <Search className="w-5 h-5 text-blue-400" />}
                                        {suggestion.category === 'Acessibilidade' && <Eye className="w-5 h-5 text-purple-400" />}
                                        {suggestion.category === 'Performance' && <Zap className="w-5 h-5 text-green-400" />}
                                        {suggestion.category === 'Design' && <Palette className="w-5 h-5 text-pink-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-semibold text-white">{suggestion.title}</h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                                suggestion.impact === 'Alto' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                                suggestion.impact === 'Médio' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                                Impacto {suggestion.impact}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400">{suggestion.description}</p>
                                    </div>
                                </div>
                            ))}
                            {results.suggestions.length === 0 && (
                                <div className="text-center py-8 text-slate-500 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-50" />
                                    <p>Nenhuma sugestão crítica encontrada. Bom trabalho!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-red-400">Erro ao carregar resultados.</div>
            )}
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
            <Button variant="secondary" onClick={onClose}>Fechar Relatório</Button>
        </div>
      </div>
    </div>
  );
};

export default AuditModal;