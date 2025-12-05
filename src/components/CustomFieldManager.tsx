import React, { useState } from "react";
import { X, Plus, Trash2, Save, Type, Hash, Calendar, Flag, DollarSign, ListChecks, Clock } from "lucide-react";
import type { CustomField } from "../types/types";
import { useMultiProject } from "../store/multiProjectStore";

interface CustomFieldManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const CustomFieldManager: React.FC<CustomFieldManagerProps> = ({ isOpen, onClose }) => {
    const { getCustomFields, addCustomField, updateCustomField, deleteCustomField } = useMultiProject();
    const [editingField, setEditingField] = useState<CustomField | null>(null);
    const [newField, setNewField] = useState<Omit<CustomField, 'id'>>({
        name: "",
        type: "text",
        description: "",
        category: "task",
        isVisible: true,
        isRequired: false
    });
    const [newLookupValue, setNewLookupValue] = useState({ value: "", label: "" });
    const [showFormulaEditor, setShowFormulaEditor] = useState(false);

    const customFields = getCustomFields();

    const handleCreateField = () => {
        if (!newField.name.trim()) return;

        const field: CustomField = {
            ...newField,
            id: `CF-${Date.now()}`,
        };

        addCustomField(field);
        setNewField({
            name: "",
            type: "text",
            description: "",
            category: "task",
            isVisible: true,
            isRequired: false
        });
    };

    const handleUpdateField = () => {
        if (!editingField) return;
        updateCustomField(editingField.id, editingField);
        setEditingField(null);
    };

    const handleAddLookupValue = () => {
        if (!editingField || !newLookupValue.value.trim() || !newLookupValue.label.trim()) return;

        const lookupTable = editingField.lookupTable ? [...editingField.lookupTable] : [];
        lookupTable.push({ value: newLookupValue.value, label: newLookupValue.label });

        setEditingField({
            ...editingField,
            lookupTable
        });

        setNewLookupValue({ value: "", label: "" });
    };

    const handleRemoveLookupValue = (index: number) => {
        if (!editingField || !editingField.lookupTable) return;

        const lookupTable = [...editingField.lookupTable];
        lookupTable.splice(index, 1);

        setEditingField({
            ...editingField,
            lookupTable
        });
    };

    const fieldTypeOptions = [
        { value: "text", label: "Texto", icon: Type },
        { value: "number", label: "Número", icon: Hash },
        { value: "date", label: "Data", icon: Calendar },
        { value: "dropdown", label: "Lista Suspensa", icon: ListChecks },
        { value: "flag", label: "Sim/Não", icon: Flag },
        { value: "duration", label: "Duração", icon: Clock },
        { value: "cost", label: "Custo", icon: DollarSign },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <ListChecks className="text-blue-600" size={24} />
                            Gerenciamento de Campos Personalizados
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Crie e gerencie campos personalizados para tarefas e recursos
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all p-2 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex flex-1 overflow-hidden">
                        {/* Left Panel - Field List */}
                        <div className="w-1/3 border-r border-slate-200 overflow-y-auto custom-scrollbar">
                            <div className="p-4 border-b border-slate-200">
                                <h3 className="font-semibold text-slate-800 mb-3">Campos Personalizados</h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    {customFields.length} campo{customFields.length !== 1 ? 's' : ''} criado{customFields.length !== 1 ? 's' : ''}
                                </p>

                                <div className="space-y-2">
                                    {customFields.map(field => (
                                        <div
                                            key={field.id}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${editingField?.id === field.id
                                                    ? "bg-blue-50 border-blue-300"
                                                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            onClick={() => setEditingField(field)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-slate-800 truncate">{field.name}</h4>
                                                    <p className="text-xs text-slate-500 capitalize">{field.type}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteCustomField(field.id);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-semibold text-slate-800 mb-3">Criar Novo Campo</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                                        <input
                                            type="text"
                                            value={newField.name}
                                            onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                                            placeholder="Ex: Orçamento"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                        <select
                                            value={newField.type}
                                            onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        >
                                            {fieldTypeOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                        <select
                                            value={newField.category}
                                            onChange={(e) => setNewField({ ...newField, category: e.target.value as any })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        >
                                            <option value="task">Tarefa</option>
                                            <option value="resource">Recurso</option>
                                            <option value="assignment">Atribuição</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleCreateField}
                                        disabled={!newField.name.trim()}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                                    >
                                        <Plus size={18} />
                                        Adicionar Campo
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel - Field Editor */}
                        <div className="w-2/3 overflow-y-auto custom-scrollbar">
                            {editingField ? (
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-slate-800">Editar Campo</h3>
                                        <button
                                            onClick={() => setEditingField(null)}
                                            className="text-slate-500 hover:text-slate-700"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Nome do Campo</label>
                                            <input
                                                type="text"
                                                value={editingField.name}
                                                onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo</label>
                                                <select
                                                    value={editingField.type}
                                                    onChange={(e) => setEditingField({ ...editingField, type: e.target.value as any })}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                >
                                                    {fieldTypeOptions.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Categoria</label>
                                                <select
                                                    value={editingField.category}
                                                    onChange={(e) => setEditingField({ ...editingField, category: e.target.value as any })}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                >
                                                    <option value="task">Tarefa</option>
                                                    <option value="resource">Recurso</option>
                                                    <option value="assignment">Atribuição</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição</label>
                                            <textarea
                                                value={editingField.description || ""}
                                                onChange={(e) => setEditingField({ ...editingField, description: e.target.value })}
                                                rows={3}
                                                placeholder="Descrição do campo..."
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="isRequired"
                                                    checked={editingField.isRequired || false}
                                                    onChange={(e) => setEditingField({ ...editingField, isRequired: e.target.checked })}
                                                    className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                />
                                                <label htmlFor="isRequired" className="ml-2 text-sm font-semibold text-slate-700">
                                                    Campo obrigatório
                                                </label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="isVisible"
                                                    checked={editingField.isVisible !== false}
                                                    onChange={(e) => setEditingField({ ...editingField, isVisible: e.target.checked })}
                                                    className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                />
                                                <label htmlFor="isVisible" className="ml-2 text-sm font-semibold text-slate-700">
                                                    Visível
                                                </label>
                                            </div>
                                        </div>

                                        {editingField.type === 'dropdown' && (
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <label className="block text-sm font-semibold text-slate-700">
                                                        Valores da Lista
                                                    </label>
                                                    <button
                                                        onClick={() => {
                                                            if (newLookupValue.value.trim() && newLookupValue.label.trim()) {
                                                                handleAddLookupValue();
                                                            }
                                                        }}
                                                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        <Plus size={16} />
                                                        Adicionar
                                                    </button>
                                                </div>

                                                <div className="space-y-2 mb-3">
                                                    {editingField.lookupTable?.map((option, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                            <div>
                                                                <div className="font-medium text-slate-700">{option.label}</div>
                                                                <div className="text-sm text-slate-500">{option.value}</div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveLookupValue(index)}
                                                                className="p-1 text-slate-400 hover:text-red-500"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-600 mb-1">Valor</label>
                                                        <input
                                                            type="text"
                                                            value={newLookupValue.value}
                                                            onChange={(e) => setNewLookupValue({ ...newLookupValue, value: e.target.value })}
                                                            placeholder="Ex: baixo"
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-600 mb-1">Rótulo</label>
                                                        <input
                                                            type="text"
                                                            value={newLookupValue.label}
                                                            onChange={(e) => setNewLookupValue({ ...newLookupValue, label: e.target.value })}
                                                            placeholder="Ex: Baixo"
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {editingField.type === 'text' && (
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <label className="block text-sm font-semibold text-slate-700">
                                                        Fórmula (Opcional)
                                                    </label>
                                                    <button
                                                        onClick={() => setShowFormulaEditor(!showFormulaEditor)}
                                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        {showFormulaEditor ? 'Ocultar' : 'Adicionar'}
                                                    </button>
                                                </div>

                                                {showFormulaEditor && (
                                                    <div>
                                                        <textarea
                                                            value={editingField.formula || ""}
                                                            onChange={(e) => setEditingField({ ...editingField, formula: e.target.value })}
                                                            rows={4}
                                                            placeholder="Ex: [Cost] * [Duration]"
                                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-mono"
                                                        />
                                                        <p className="text-xs text-slate-500 mt-2">
                                                            Use colchetes para referenciar outros campos. Ex: [Custo] * [Duração]
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end mt-8">
                                        <button
                                            onClick={handleUpdateField}
                                            className="flex items-center gap-2 px-5 py-2.5 text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg shadow-blue-500/20"
                                        >
                                            <Save size={18} />
                                            Salvar Alterações
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full p-12 text-center">
                                    <div>
                                        <ListChecks size={48} className="text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-slate-500 mb-2">
                                            Nenhum Campo Selecionado
                                        </h3>
                                        <p className="text-slate-400 max-w-md">
                                            Selecione um campo personalizado da lista ao lado para editar suas configurações.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
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

export default CustomFieldManager;