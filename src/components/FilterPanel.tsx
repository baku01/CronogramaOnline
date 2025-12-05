import React from 'react';
import { Filter, X } from 'lucide-react';
import { TaskStatus, TaskPriority } from '../types/types';
import type { Resource } from '../types/types';

interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    filters: {
        status: TaskStatus[];
        priority: TaskPriority[];
        resourceId: string | null;
    };
    onFilterChange: (key: string, value: any) => void;
    resources: Resource[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen, onClose, filters, onFilterChange, resources }) => {
    if (!isOpen) return null;

    const handleStatusToggle = (status: TaskStatus) => {
        const newStatuses = filters.status.includes(status)
            ? filters.status.filter(s => s !== status)
            : [...filters.status, status];
        onFilterChange('status', newStatuses);
    };

    const handlePriorityToggle = (priority: TaskPriority) => {
        const newPriorities = filters.priority.includes(priority)
            ? filters.priority.filter(p => p !== priority)
            : [...filters.priority, priority];
        onFilterChange('priority', newPriorities);
    };

    return (
        <div className="absolute top-14 right-4 z-20 w-80 bg-white rounded-xl shadow-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Filter size={18} className="text-indigo-600" />
                    Filtros
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* Status Filter */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(TaskStatus).map(status => (
                            <button
                                key={status}
                                onClick={() => handleStatusToggle(status)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${filters.status.includes(status)
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                            >
                                {status === 'not_started' ? 'Não Iniciada' :
                                    status === 'in_progress' ? 'Em Andamento' :
                                        status === 'completed' ? 'Concluída' :
                                            status === 'on_hold' ? 'Em Espera' : 'Cancelada'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Priority Filter */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridade</label>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(TaskPriority).map(priority => (
                            <button
                                key={priority}
                                onClick={() => handlePriorityToggle(priority)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${filters.priority.includes(priority)
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                            >
                                {priority === 'low' ? 'Baixa' :
                                    priority === 'medium' ? 'Média' :
                                        priority === 'high' ? 'Alta' : 'Crítica'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Resource Filter */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recurso</label>
                    <select
                        value={filters.resourceId || ''}
                        onChange={(e) => onFilterChange('resourceId', e.target.value || null)}
                        className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Todos os Recursos</option>
                        {resources.map(resource => (
                            <option key={resource.id} value={resource.id}>
                                {resource.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-b-xl border-t border-slate-100 flex justify-end">
                <button
                    onClick={() => {
                        onFilterChange('status', []);
                        onFilterChange('priority', []);
                        onFilterChange('resourceId', null);
                    }}
                    className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                >
                    Limpar Filtros
                </button>
            </div>
        </div>
    );
};

export default FilterPanel;
