import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, User, DollarSign, Briefcase, Mail, FileText, Percent } from "lucide-react";
import { ResourceType } from "../types/types";
import type { Resource } from "../types/types";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface ResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (resource: Partial<Resource>) => void;
    resource?: Resource;
}

const ResourceModal: React.FC<ResourceModalProps> = ({ isOpen, onClose, onSave, resource }) => {
    const [formData, setFormData] = useState<Partial<Resource>>({
        name: "",
        type: ResourceType.PERSON,
        costPerHour: 0,
        availability: 100,
        email: "",
        notes: "",
    });

    useEffect(() => {
        if (isOpen) {
            if (resource) {
                setFormData({ ...resource });
            } else {
                setFormData({
                    name: "",
                    type: ResourceType.PERSON,
                    costPerHour: 0,
                    availability: 100,
                    email: "",
                    notes: "",
                });
            }
        }
    }, [isOpen, resource]);

    const handleChange = (field: keyof Resource, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{resource ? "Editar Recurso" : "Novo Recurso"}</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {resource
                                ? "Atualize os detalhes do recurso abaixo"
                                : "Preencha as informações para criar um novo recurso"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-5">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do Recurso</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    className="pl-10"
                                    placeholder="Ex: João Silva, Projetor, Cimento"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        value={formData.type}
                                        onChange={(e) => handleChange("type", e.target.value)}
                                        className="w-full h-10 pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value={ResourceType.PERSON}>Pessoa</option>
                                        <option value={ResourceType.EQUIPMENT}>Equipamento</option>
                                        <option value={ResourceType.MATERIAL}>Material</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Disponibilidade (%)</label>
                                <div className="relative">
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.availability}
                                        onChange={(e) => handleChange("availability", parseFloat(e.target.value) || 0)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Custo por Hora (R$)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.costPerHour}
                                    onChange={(e) => handleChange("costPerHour", parseFloat(e.target.value) || 0)}
                                    className="pl-10"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email (Opcional)</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input
                                    type="email"
                                    value={formData.email || ""}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    className="pl-10"
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                                <textarea
                                    value={formData.notes || ""}
                                    onChange={(e) => handleChange("notes", e.target.value)}
                                    className="w-full min-h-[80px] pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                                    placeholder="Observações adicionais..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={() => onSave(formData)}>
                        {resource ? "Salvar Alterações" : "Criar Recurso"}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ResourceModal;
