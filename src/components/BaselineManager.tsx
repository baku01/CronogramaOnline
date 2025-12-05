import React, { useState } from "react";
import { X, Calendar, Save, Trash2, Layers, AlertTriangle } from "lucide-react";
import type { TaskBaseline } from "../types/types";
import { useMultiProject } from "../store/multiProjectStore";

interface BaselineManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const BaselineManager: React.FC<BaselineManagerProps> = ({ isOpen, onClose }) => {
    const { getBaselines, saveBaseline, deleteBaseline, applyBaseline } = useMultiProject();
    const [newBaselineName, setNewBaselineName] = useState("");
    const [newBaselineDescription, setNewBaselineDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState<{ action: string; baseline?: TaskBaseline } | null>(null);

    const baselines = getBaselines();

    const handleCreateBaseline = () => {
        if (!newBaselineName.trim()) return;

        setIsCreating(true);
        saveBaseline(newBaselineName.trim(), newBaselineDescription.trim());
        setNewBaselineName("");
        setNewBaselineDescription("");
        setIsCreating(false);
    };

    const handleDeleteBaseline = (baselineId: string) => {
        deleteBaseline(baselineId);
        setShowConfirmation(null);
    };

    const handleApplyBaseline = (baselineId: string) => {
        applyBaseline(baselineId);
        setShowConfirmation(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Layers className="text-blue-600" size={24} />
                            Gerenciamento de Linha de Base
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Salve, compare e gerencie diferentes versões do seu projeto
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all p-2 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6">
                        {/* Create New Baseline */}
                        <div className="mb-8">
                            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Save className="text-green-600" size={18} />
                                Criar Nova Linha de Base
                            </h3>

                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Nome da Linha de Base *
                                    </label>
                                    <input
                                        type="text"
                                        value={newBaselineName}
                                        onChange={(e) => setNewBaselineName(e.target.value)}
                                        placeholder="Ex: Linha de Base Inicial"
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Descrição (Opcional)
                                    </label>
                                    <textarea
                                        value={newBaselineDescription}
                                        onChange={(e) => setNewBaselineDescription(e.target.value)}
                                        placeholder="Descrição da linha de base..."
                                        rows={2}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <p className="text-sm text-slate-500 flex items-center gap-1">
                                        <AlertTriangle size={16} className="text-amber-500" />
                                        <span>Esta ação criará uma cópia dos valores atuais de todas as tarefas</span>
                                    </p>
                                    <button
                                        onClick={handleCreateBaseline}
                                        disabled={isCreating || !newBaselineName.trim()}
                                        className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Salvando...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Salvar Linha de Base
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Existing Baselines */}
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Calendar className="text-blue-600" size={18} />
                                Linhas de Base Existentes
                                <span className="ml-2 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                    {baselines.length}
                                </span>
                            </h3>

                            {baselines.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-xl border border-slate-200">
                                    <Calendar size={40} className="text-slate-300 mb-4" />
                                    <h4 className="font-medium text-slate-700 mb-2">Nenhuma linha de base criada</h4>
                                    <p className="text-slate-500 max-w-md">
                                        Crie uma linha de base para salvar o estado atual do seu projeto e comparar com versões futuras.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {baselines.map((baseline) => (
                                        <div
                                            key={baseline.id}
                                            className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-bold text-slate-800 text-lg">{baseline.name}</h4>
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                            {baseline.id}
                                                        </span>
                                                    </div>

                                                    {baseline.description && (
                                                        <p className="text-slate-600 mb-3">{baseline.description}</p>
                                                    )}

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-slate-500">Salvo em:</span>
                                                            <p className="font-medium text-slate-700">
                                                                {baseline.savedDate.toLocaleDateString('pt-BR')}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Tarefas:</span>
                                                            <p className="font-medium text-slate-700">
                                                                {baseline.tasks.length}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Início:</span>
                                                            <p className="font-medium text-slate-700">
                                                                {baseline.projectStartDate.toLocaleDateString('pt-BR')}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Término:</span>
                                                            <p className="font-medium text-slate-700">
                                                                {baseline.projectEndDate.toLocaleDateString('pt-BR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 ml-4">
                                                    <button
                                                        onClick={() => setShowConfirmation({ action: 'apply', baseline })}
                                                        className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                                        title="Aplicar esta linha de base"
                                                    >
                                                        <Layers size={16} />
                                                        Aplicar
                                                    </button>
                                                    <button
                                                        onClick={() => setShowConfirmation({ action: 'delete', baseline })}
                                                        className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                                        title="Excluir esta linha de base"
                                                    >
                                                        <Trash2 size={16} />
                                                        Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Confirmation Modal */}
                {showConfirmation && showConfirmation.baseline && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    {showConfirmation.action === 'delete' ? (
                                        <div className="p-2 bg-red-100 rounded-full">
                                            <Trash2 size={24} className="text-red-600" />
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <Layers size={24} className="text-blue-600" />
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold text-slate-800">
                                        {showConfirmation.action === 'delete'
                                            ? 'Excluir Linha de Base'
                                            : 'Aplicar Linha de Base'}
                                    </h3>
                                </div>

                                <p className="text-slate-600 mb-2">
                                    {showConfirmation.action === 'delete'
                                        ? `Tem certeza que deseja excluir a linha de base "${showConfirmation.baseline.name}"?`
                                        : `Tem certeza que deseja aplicar a linha de base "${showConfirmation.baseline.name}"?`}
                                </p>

                                {showConfirmation.action === 'apply' && (
                                    <p className="text-amber-700 bg-amber-50 p-3 rounded-lg text-sm mb-4 flex items-start gap-2">
                                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>Isso substituirá os valores atuais das tarefas pelos valores salvos na linha de base.</span>
                                    </p>
                                )}

                                {showConfirmation.action === 'delete' && (
                                    <p className="text-slate-500 text-sm">
                                        Esta ação não pode ser desfeita. Todos os dados da linha de base serão permanentemente removidos.
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                                <button
                                    onClick={() => setShowConfirmation(null)}
                                    className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        if (showConfirmation.action === 'delete' && showConfirmation.baseline) {
                                            handleDeleteBaseline(showConfirmation.baseline.id);
                                        } else if (showConfirmation.action === 'apply' && showConfirmation.baseline) {
                                            handleApplyBaseline(showConfirmation.baseline.id);
                                        }
                                    }}
                                    className={`px-4 py-2 text-white rounded-lg transition-all font-medium ${showConfirmation.action === 'delete'
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {showConfirmation.action === 'delete' ? 'Excluir' : 'Aplicar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

export default BaselineManager;