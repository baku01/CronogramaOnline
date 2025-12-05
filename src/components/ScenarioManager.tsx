import React, { useState } from 'react';
import { useMultiProject } from '../store/multiProjectStore';
import { GitBranch, Plus, Trash2, Play, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/Button';

interface ScenarioManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const ScenarioManager: React.FC<ScenarioManagerProps> = ({ isOpen, onClose }) => {
    const {
        activeProject: project,
        createScenario,
        activateScenario,
        deactivateScenario,
        deleteScenario,
        getScenarios
    } = useMultiProject();

    const [isCreating, setIsCreating] = useState(false);
    const [newScenarioName, setNewScenarioName] = useState('');
    const [newScenarioDesc, setNewScenarioDesc] = useState('');

    const scenarios = getScenarios();
    const activeScenarioId = project?.activeScenarioId;

    const handleCreate = () => {
        if (newScenarioName.trim()) {
            createScenario(newScenarioName, newScenarioDesc);
            setNewScenarioName('');
            setNewScenarioDesc('');
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <GitBranch className="text-indigo-600" size={24} />
                            Cenários (What-If)
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Crie simulações do projeto para testar mudanças sem afetar o cronograma oficial.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all p-2 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800">Seus Cenários</h3>
                        <Button onClick={() => setIsCreating(true)} size="sm">
                            <Plus size={16} className="mr-2" />
                            Novo Cenário
                        </Button>
                    </div>

                    {/* Active Scenario Banner */}
                    {activeScenarioId && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-800">Modo de Simulação Ativo</h4>
                                    <p className="text-sm text-amber-700">
                                        Você está visualizando o cenário: <span className="font-semibold">{scenarios.find(s => s.id === activeScenarioId)?.name}</span>
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={deactivateScenario}
                                className="bg-white border-amber-200 text-amber-800 hover:bg-amber-100"
                            >
                                Voltar ao Projeto Oficial
                            </Button>
                        </div>
                    )}

                    {/* Create Modal/Form */}
                    {isCreating && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 animate-in fade-in zoom-in-95">
                            <h4 className="font-medium text-slate-800">Criar Novo Cenário</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Cenário</label>
                                    <input
                                        type="text"
                                        value={newScenarioName}
                                        onChange={(e) => setNewScenarioName(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Ex: Otimização de Recursos"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Descrição (Opcional)</label>
                                    <input
                                        type="text"
                                        value={newScenarioDesc}
                                        onChange={(e) => setNewScenarioDesc(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Descrição do que será testado..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsCreating(false)} size="sm">Cancelar</Button>
                                <Button onClick={handleCreate} disabled={!newScenarioName.trim()} size="sm">Criar Cenário</Button>
                            </div>
                        </div>
                    )}

                    {/* Scenarios List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scenarios.map(scenario => (
                            <div
                                key={scenario.id}
                                className={`group relative bg-white border rounded-xl p-4 transition-all hover:shadow-md ${activeScenarioId === scenario.id
                                    ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                                    : 'border-slate-200 hover:border-indigo-200'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                            {scenario.name}
                                            {activeScenarioId === scenario.id && (
                                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    Ativo
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1">{scenario.description || 'Sem descrição'}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => deleteScenario(scenario.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir Cenário"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                                    <div className="text-xs text-slate-400">
                                        Criado em {new Date(scenario.createdAt).toLocaleDateString()}
                                    </div>

                                    {activeScenarioId === scenario.id ? (
                                        <span className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
                                            <CheckCircle size={14} />
                                            Em Uso
                                        </span>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => activateScenario(scenario.id)}
                                            className="text-xs h-8"
                                        >
                                            <Play size={14} className="mr-1.5" />
                                            Simular
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {scenarios.length === 0 && !isCreating && (
                            <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <GitBranch className="mx-auto text-slate-300 mb-2" size={32} />
                                <p className="text-slate-500 font-medium">Nenhum cenário criado</p>
                                <p className="text-xs text-slate-400">Crie um cenário para testar hipóteses.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all font-medium shadow-sm hover:shadow"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScenarioManager;
