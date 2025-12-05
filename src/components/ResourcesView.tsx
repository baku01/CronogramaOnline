import React, { useState } from "react";
import { Plus, Search, Trash2, Edit2, User, Box, Wrench, BarChart } from "lucide-react";
import { useMultiProject } from "../store/multiProjectStore";
import { ResourceType } from "../types/types";
import type { Resource } from "../types/types";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import ResourceModal from "./ResourceModal";
import ResourceLevelingModal from "./ResourceLevelingModal";

const ResourcesView: React.FC = () => {
    const { getResources, addResource, updateResource, deleteResource } = useMultiProject();
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLevelingModalOpen, setIsLevelingModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | undefined>(undefined);

    const resources = getResources();

    const filteredResources = resources.filter(
        (resource) =>
            resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (resource.email && resource.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleAddResource = () => {
        setEditingResource(undefined);
        setIsModalOpen(true);
    };

    const handleEditResource = (resource: Resource) => {
        setEditingResource(resource);
        setIsModalOpen(true);
    };

    const handleDeleteResource = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este recurso?")) {
            deleteResource(id);
        }
    };

    const handleSaveResource = (resourceData: Partial<Resource>) => {
        if (editingResource) {
            updateResource(editingResource.id, resourceData);
        } else {
            const newResource: Resource = {
                id: `RES-${Date.now()}`,
                name: resourceData.name || "Novo Recurso",
                type: resourceData.type || ResourceType.PERSON,
                costPerHour: resourceData.costPerHour || 0,
                availability: resourceData.availability || 100,
                email: resourceData.email,
                notes: resourceData.notes,
            };
            addResource(newResource);
        }
        setIsModalOpen(false);
    };

    const getResourceIcon = (type: string) => {
        switch (type) {
            case ResourceType.PERSON:
                return <User className="text-blue-500" size={18} />;
            case ResourceType.MATERIAL:
                return <Box className="text-orange-500" size={18} />;
            case ResourceType.EQUIPMENT:
                return <Wrench className="text-purple-500" size={18} />;
            default:
                return <User className="text-slate-500" size={18} />;
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    };

    return (
        <div className="h-full bg-slate-50/50 p-6 flex flex-col gap-6 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Recursos</h1>
                    <p className="text-slate-500 mt-1">Gerencie a equipe, equipamentos e materiais do projeto</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="Buscar recursos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full sm:w-64 bg-white"
                        />
                    </div>
                    <Button onClick={() => setIsLevelingModalOpen(true)} variant="secondary" className="shrink-0">
                        <BarChart size={18} className="mr-2" />
                        Nivelar
                    </Button>
                    <Button onClick={handleAddResource} className="shrink-0">
                        <Plus size={18} className="mr-2" />
                        Novo Recurso
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {filteredResources.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <User size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum recurso encontrado</h3>
                        <p className="text-center max-w-xs mb-6">
                            {searchQuery
                                ? "Tente ajustar sua busca para encontrar o que procura."
                                : "Comece adicionando pessoas, equipamentos ou materiais ao seu projeto."}
                        </p>
                        {!searchQuery && (
                            <Button onClick={handleAddResource} variant="outline">
                                <Plus size={16} className="mr-2" />
                                Adicionar Primeiro Recurso
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                        Nome
                                    </th>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                        Tipo
                                    </th>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                        Custo/Hora
                                    </th>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                        Disponibilidade
                                    </th>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                        Email / Contato
                                    </th>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredResources.map((resource) => (
                                    <tr key={resource.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                    {getResourceIcon(resource.type)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{resource.name}</div>
                                                    {resource.notes && (
                                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">
                                                            {resource.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                                                {resource.type === ResourceType.PERSON ? "Pessoa" :
                                                    resource.type === ResourceType.EQUIPMENT ? "Equipamento" : "Material"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 font-mono text-sm">
                                            {formatCurrency(resource.costPerHour || 0)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500 rounded-full"
                                                        style={{ width: `${Math.min(resource.availability || 0, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-slate-600">{resource.availability}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-slate-600">
                                            {resource.email || "-"}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                                                    onClick={() => handleEditResource(resource)}
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                                                    onClick={() => handleDeleteResource(resource.id)}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ResourceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveResource}
                resource={editingResource}
            />

            <ResourceLevelingModal
                isOpen={isLevelingModalOpen}
                onClose={() => setIsLevelingModalOpen(false)}
            />
        </div>
    );
};

export default ResourcesView;
