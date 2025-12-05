import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, AlignLeft, CheckSquare, Clock, User, Percent, Type, Link, Plus, Trash2, Lock, ListChecks, ArrowUp } from "lucide-react";
import { TaskStatus, TaskPriority, DependencyType } from "../types/types";
import type { ProjectCalendar } from "../types/types";
import type { ExtendedTask, Resource, TaskDependency } from "../types/types";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { useMultiProject } from "../store/multiProjectStore";
import { calculateEndDate, calculateStartDate, getWorkingDaysBetween } from "../utils/dateCalculations";

// Constraint type mapping
const CONSTRAINT_TYPES = [
    { value: 'ASAP' as const, label: 'O Mais Breve Possível (ASAP)', description: 'A tarefa será agendada o mais cedo possível' },
    { value: 'ALAP' as const, label: 'O Mais Tarde Possível (ALAP)', description: 'A tarefa será agendada o mais tarde possível' },
    { value: 'SNET' as const, label: 'Não Iniciar Antes De (SNET)', description: 'A tarefa não pode iniciar antes da data especificada' },
    { value: 'SNLT' as const, label: 'Não Iniciar Depois De (SNLT)', description: 'A tarefa não pode iniciar depois da data especificada' },
    { value: 'FNET' as const, label: 'Não Terminar Antes De (FNET)', description: 'A tarefa não pode terminar antes da data especificada' },
    { value: 'FNLT' as const, label: 'Não Terminar Depois De (FNLT)', description: 'A tarefa não pode terminar depois da data especificada' },
    { value: 'MSO' as const, label: 'Deve Iniciar Em (MSO)', description: 'A tarefa deve iniciar na data especificada' },
    { value: 'MFO' as const, label: 'Deve Terminar Em (MFO)', description: 'A tarefa deve terminar na data especificada' },
];

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Partial<ExtendedTask>) => void;
    task?: ExtendedTask;
    resources: Resource[];
    allTasks?: ExtendedTask[];
    dependencies?: TaskDependency[];
    calendars?: ProjectCalendar[];
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, task, resources, allTasks = [], dependencies = [], calendars = [] }) => {
    const { getCustomFields, getCalendars } = useMultiProject();
    const availableCalendars = calendars.length > 0 ? calendars : getCalendars();
    const [formData, setFormData] = useState<Partial<ExtendedTask>>({
        name: "",
        start: new Date(),
        end: new Date(),
        progress: 0,
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.MEDIUM,
        type: "task",
        effort: 0,
        description: "",
        resources: [],
        constraintType: 'ASAP',
        constraintDate: undefined,
        isRecurring: false,
        recurrenceRule: undefined,
        calendarId: undefined,
    });

    const [schedulingMode, setSchedulingMode] = useState<'auto' | 'manual'>('auto');

    const [taskDependencies, setTaskDependencies] = useState<TaskDependency[]>([]);
    const [newDependency, setNewDependency] = useState<{
        fromTaskId: string;
        type: DependencyType;
        lag?: number;
    }>({
        fromTaskId: "",
        type: DependencyType.FS,
        lag: 0,
    });

    useEffect(() => {
        if (isOpen) {
            if (task) {
                const duration = task.duration || getWorkingDaysBetween(task.start, task.end);
                setFormData({
                    ...task,
                    start: new Date(task.start),
                    end: new Date(task.end),
                    duration: duration,
                    constraintDate: task.constraintDate ? new Date(task.constraintDate) : undefined,
                });

                // Default to Auto Schedule
                setSchedulingMode('auto');

                // Load task dependencies
                const taskDeps = dependencies.filter(dep => dep.toTaskId === task.id);
                setTaskDependencies(taskDeps);
            } else {
                const now = new Date();
                const tomorrow = calculateEndDate(now, 1); // 1 day duration default

                setFormData({
                    name: "",
                    start: now,
                    end: tomorrow,
                    duration: 1,
                    progress: 0,
                    status: TaskStatus.NOT_STARTED,
                    priority: TaskPriority.MEDIUM,
                    type: "task",
                    effort: 0,
                    description: "",
                    resources: [],
                    constraintType: 'ASAP',
                    constraintDate: undefined,
                });
                setSchedulingMode('auto');
                setTaskDependencies([]);
            }

            // Reset new dependency form
            setNewDependency({
                fromTaskId: "",
                type: DependencyType.FS,
                lag: 0,
            });
        }
    }, [isOpen, task, dependencies]);

    const handleChange = (field: keyof ExtendedTask, value: any) => {
        setFormData((prev) => {
            const newData = { ...prev, [field]: value };

            // Auto-calculate dates if duration changed
            if (field === 'duration' && typeof value === 'number') {
                if (prev.start) {
                    newData.end = calculateEndDate(prev.start, value);
                }
            }

            // Auto-calculate duration if end date changed
            if (field === 'end' && value instanceof Date && prev.start) {
                newData.duration = getWorkingDaysBetween(prev.start, value);
            }

             // Auto-calculate duration if start date changed
            if (field === 'start' && value instanceof Date && prev.end) {
                 if (prev.duration) {
                     newData.end = calculateEndDate(value, prev.duration);
                 } else {
                     newData.duration = getWorkingDaysBetween(value, prev.end);
                 }
            }

            return newData;
        });
    };

    const handleResourceChange = (resourceId: string, checked: boolean) => {
        setFormData((prev) => {
            const currentResources = prev.resources || [];
            if (checked) {
                return {
                    ...prev,
                    resources: [...currentResources, { resourceId, allocation: 100 }],
                };
            } else {
                return {
                    ...prev,
                    resources: currentResources.filter((r) => r.resourceId !== resourceId),
                };
            }
        });
    };

    const handleResourceAllocationChange = (resourceId: string, allocation: number) => {
        setFormData((prev) => {
            const currentResources = prev.resources || [];
            return {
                ...prev,
                resources: currentResources.map((r) =>
                    r.resourceId === resourceId ? { ...r, allocation } : r
                ),
            };
        });
    };

    const handleAddDependency = () => {
        if (!newDependency.fromTaskId || !task) return;

        const newDep: TaskDependency = {
            id: `Dep-${Date.now()}`,
            fromTaskId: newDependency.fromTaskId,
            toTaskId: task.id,
            type: newDependency.type,
            lag: newDependency.lag,
        };

        setTaskDependencies([...taskDependencies, newDep]);
        setNewDependency({
            fromTaskId: "",
            type: DependencyType.FS,
            lag: 0,
        });
    };

    const handleRemoveDependency = (dependencyId: string) => {
        setTaskDependencies(taskDependencies.filter(dep => dep.id !== dependencyId));
    };

    const handleNewDependencyChange = (field: keyof typeof newDependency, value: any) => {
        setNewDependency(prev => ({ ...prev, [field]: value }));
    };

    const formatDateForInput = (date?: Date) => {
        if (!date) return "";
        try {
            return date.toISOString().split("T")[0];
        } catch (e) {
            return "";
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{task ? "Editar Tarefa" : "Nova Tarefa"}</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {task
                                ? "Atualize os detalhes da tarefa abaixo"
                                : "Preencha as informações para criar uma nova tarefa"}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </Button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700">Nome da Tarefa</label>
                        <div className="relative group">
                            <Type
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                                size={18}
                            />
                            <Input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                className="pl-10 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ex: Implementar API de Login"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Mode & Type & Parent */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                         <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Agendamento</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setSchedulingMode('auto')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                                        schedulingMode === 'auto'
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <Clock size={14} />
                                    Auto
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSchedulingMode('manual')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                                        schedulingMode === 'manual'
                                            ? 'bg-white text-amber-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <User size={14} />
                                    Manual
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Tipo</label>
                            <div className="relative group">
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleChange("type", e.target.value)}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 appearance-none text-slate-600 cursor-pointer transition-all"
                                >
                                    <option value="task">Tarefa Padrão</option>
                                    <option value="milestone">Marco</option>
                                    <option value="project">Resumo</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                             <label className="block text-sm font-semibold text-slate-700">Tarefa Pai</label>
                            <div className="relative group">
                                <ArrowUp
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                                    size={18}
                                />
                                <select
                                    value={formData.project || ''}
                                    onChange={(e) => handleChange("project", e.target.value || undefined)}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 appearance-none text-slate-600 cursor-pointer transition-all"
                                >
                                    <option value="">(Nenhuma)</option>
                                    {allTasks
                                        .filter(t => t.id !== task?.id && t.type === 'project')
                                        .map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Override */}
                    {availableCalendars.length > 1 && (
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Calendário da Tarefa</label>
                            <div className="relative group">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <select
                                    value={formData.calendarId || ''}
                                    onChange={(e) => handleChange("calendarId", e.target.value || undefined)}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 appearance-none text-slate-600 cursor-pointer transition-all"
                                >
                                    <option value="">Padrão do Projeto</option>
                                    {availableCalendars.map(cal => (
                                        <option key={cal.id} value={cal.id}>
                                            {cal.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dates & Duration Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Início</label>
                            <div className="relative group">
                                <Calendar
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                                    size={18}
                                />
                                <Input
                                    type="date"
                                    value={formatDateForInput(formData.start)}
                                    onChange={(e) => handleChange("start", new Date(e.target.value))}
                                    className="pl-10 text-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Término</label>
                            <div className="relative group">
                                <Calendar
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                                    size={18}
                                />
                                <Input
                                    type="date"
                                    value={formatDateForInput(formData.end)}
                                    onChange={(e) => handleChange("end", new Date(e.target.value))}
                                    className="pl-10 text-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Duração (dias)</label>
                            <div className="relative group">
                                <Clock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                                    size={18}
                                />
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.duration || 0}
                                    onChange={(e) => handleChange("duration", parseFloat(e.target.value))}
                                    className="pl-10 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Constraints Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Lock size={16} className="text-slate-400" />
                                Restrição de Tarefa
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <select
                                    value={formData.constraintType || 'ASAP'}
                                    onChange={(e) => handleChange("constraintType", e.target.value)}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 appearance-none text-slate-600 cursor-pointer transition-all"
                                >
                                    {CONSTRAINT_TYPES.map((constraint) => (
                                        <option key={constraint.value} value={constraint.value}>
                                            {constraint.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="text-xs text-slate-500 pl-1">
                                {CONSTRAINT_TYPES.find(c => c.value === formData.constraintType)?.description || ''}
                            </div>
                        </div>

                        {(formData.constraintType === 'SNET' || formData.constraintType === 'SNLT' ||
                            formData.constraintType === 'FNET' || formData.constraintType === 'FNLT' ||
                            formData.constraintType === 'MSO' || formData.constraintType === 'MFO') && (
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        {formData.constraintType === 'MSO' ? 'Data de Início Obrigatória' :
                                            formData.constraintType === 'MFO' ? 'Data de Término Obrigatória' :
                                                'Data da Restrição'}
                                    </label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <Input
                                            type="date"
                                            value={formatDateForInput(formData.constraintDate)}
                                            onChange={(e) => handleChange("constraintDate", new Date(e.target.value))}
                                            className="pl-10 text-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            )}
                    </div>

                    {/* Status & Priority Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Status</label>
                            <div className="relative group">
                                <CheckSquare
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                                    size={18}
                                />
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleChange("status", e.target.value)}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-slate-600 cursor-pointer transition-all"
                                >
                                    {Object.values(TaskStatus).map((status) => (
                                        <option key={status} value={status}>
                                            {status === "not_started"
                                                ? "Não Iniciada"
                                                : status === "in_progress"
                                                    ? "Em Andamento"
                                                    : status === "completed"
                                                        ? "Concluída"
                                                        : status === "on_hold"
                                                            ? "Em Espera"
                                                            : "Cancelada"}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg
                                        className="w-4 h-4 text-slate-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 9l-7 7-7-7"
                                        ></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Prioridade</label>
                            <div className="relative group">
                                <Clock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                                    size={18}
                                />
                                <select
                                    value={formData.priority}
                                    onChange={(e) => handleChange("priority", e.target.value)}
                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-slate-600 cursor-pointer transition-all"
                                >
                                    {Object.values(TaskPriority).map((priority) => (
                                        <option key={priority} value={priority}>
                                            {priority === "low"
                                                ? "Baixa"
                                                : priority === "medium"
                                                    ? "Média"
                                                    : priority === "high"
                                                        ? "Alta"
                                                        : "Crítica"}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg
                                        className="w-4 h-4 text-slate-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 9l-7 7-7-7"
                                        ></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Percent size={16} className="text-slate-400" />
                                Progresso
                            </label>
                            <span className="px-2 py-1 bg-white rounded-md text-xs font-bold text-indigo-600 border border-indigo-100 shadow-sm">
                                {formData.progress}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={formData.progress}
                            onChange={(e) => handleChange("progress", parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 transition-all"
                        />
                        <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700">Descrição</label>
                        <div className="relative group">
                            <AlignLeft
                                className="absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                                size={18}
                            />
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                rows={4}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-400"
                                placeholder="Adicione detalhes, requisitos e observações sobre a tarefa..."
                            />
                        </div>
                    </div>

                    {/* Recurrence */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Recorrência
                        </label>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isRecurring"
                                        checked={formData.isRecurring || false}
                                        onChange={(e) => handleChange("isRecurring", e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="isRecurring" className="text-sm font-medium text-slate-700">
                                        Esta é uma tarefa recorrente
                                    </label>
                                </div>
                            </div>

                            {formData.isRecurring && (
                                <div className="space-y-4 mt-4 pl-2 border-l-2 border-indigo-200">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-600">Frequência</label>
                                            <select
                                                value={formData.recurrenceRule?.frequency || 'daily'}
                                                onChange={(e) => handleChange("recurrenceRule", {
                                                    ...formData.recurrenceRule,
                                                    frequency: e.target.value as any,
                                                    interval: formData.recurrenceRule?.interval || 1
                                                })}
                                                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="daily">Diária</option>
                                                <option value="weekly">Semanal</option>
                                                <option value="monthly">Mensal</option>
                                                <option value="yearly">Anual</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-600">Intervalo</label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={formData.recurrenceRule?.interval || 1}
                                                onChange={(e) => handleChange("recurrenceRule", {
                                                    ...formData.recurrenceRule,
                                                    interval: parseInt(e.target.value) || 1
                                                })}
                                                className="h-9 text-sm"
                                                placeholder="1"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-600">Termina</label>
                                        <select
                                            value={formData.recurrenceRule?.endType || 'never'}
                                            onChange={(e) => handleChange("recurrenceRule", {
                                                ...formData.recurrenceRule,
                                                endType: e.target.value as any
                                            })}
                                            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="never">Nunca</option>
                                            <option value="afterOccurrences">Após X ocorrências</option>
                                            <option value="endDate">Em uma data específica</option>
                                        </select>
                                    </div>

                                    {formData.recurrenceRule?.endType === 'afterOccurrences' && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-600">Número de Ocorrências</label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={formData.recurrenceRule?.endAfterOccurrences || 1}
                                                onChange={(e) => handleChange("recurrenceRule", {
                                                    ...formData.recurrenceRule,
                                                    endAfterOccurrences: parseInt(e.target.value) || 1
                                                })}
                                                className="h-9 text-sm"
                                                placeholder="10"
                                            />
                                        </div>
                                    )}

                                    {formData.recurrenceRule?.endType === 'endDate' && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-600">Data Final</label>
                                            <Input
                                                type="date"
                                                value={formData.recurrenceRule?.endDate ? formatDateForInput(formData.recurrenceRule.endDate) : ''}
                                                onChange={(e) => handleChange("recurrenceRule", {
                                                    ...formData.recurrenceRule,
                                                    endDate: new Date(e.target.value)
                                                })}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                    )}

                                    {formData.recurrenceRule?.frequency === 'weekly' && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-600">Dias da Semana</label>
                                            <div className="flex gap-1">
                                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => {
                                                            const weekDays = formData.recurrenceRule?.weekDays || [];
                                                            const newWeekDays = weekDays.includes(index)
                                                                ? weekDays.filter(d => d !== index)
                                                                : [...weekDays, index];
                                                            handleChange("recurrenceRule", {
                                                                ...formData.recurrenceRule,
                                                                weekDays: newWeekDays.sort((a, b) => a - b)
                                                            });
                                                        }}
                                                        className={`w-8 h-8 rounded text-xs font-medium transition-colors ${formData.recurrenceRule?.weekDays?.includes(index)
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {formData.recurrenceRule?.frequency === 'monthly' && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-600">Dia do Mês</label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={formData.recurrenceRule?.monthDay || 1}
                                                onChange={(e) => handleChange("recurrenceRule", {
                                                    ...formData.recurrenceRule,
                                                    monthDay: parseInt(e.target.value) || 1
                                                })}
                                                className="h-9 text-sm"
                                                placeholder="1"
                                            />
                                        </div>
                                    )}

                                    {formData.recurrenceRule?.frequency === 'yearly' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-600">Mês</label>
                                                <select
                                                    value={formData.recurrenceRule?.yearMonth || 0}
                                                    onChange={(e) => handleChange("recurrenceRule", {
                                                        ...formData.recurrenceRule,
                                                        yearMonth: parseInt(e.target.value) || 0
                                                    })}
                                                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                >
                                                    <option value="0">Janeiro</option>
                                                    <option value="1">Fevereiro</option>
                                                    <option value="2">Março</option>
                                                    <option value="3">Abril</option>
                                                    <option value="4">Maio</option>
                                                    <option value="5">Junho</option>
                                                    <option value="6">Julho</option>
                                                    <option value="7">Agosto</option>
                                                    <option value="8">Setembro</option>
                                                    <option value="9">Outubro</option>
                                                    <option value="10">Novembro</option>
                                                    <option value="11">Dezembro</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-600">Dia</label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="31"
                                                    value={formData.recurrenceRule?.yearDay || 1}
                                                    onChange={(e) => handleChange("recurrenceRule", {
                                                        ...formData.recurrenceRule,
                                                        yearDay: parseInt(e.target.value) || 1
                                                    })}
                                                    className="h-9 text-sm"
                                                    placeholder="1"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dependencies */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Link size={16} className="text-slate-400" />
                            Dependências (Predecessoras)
                        </label>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                            {/* List of existing dependencies */}
                            {taskDependencies.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                                    <Link size={24} className="mb-2 opacity-50" />
                                    <p className="text-sm">Nenhuma dependência configurada</p>
                                </div>
                            ) : (
                                <div className="space-y-2 mb-4">
                                    {taskDependencies.map(dep => {
                                        const predecessorTask = allTasks.find(t => t.id === dep.fromTaskId);
                                        const typeLabel = dep.type === DependencyType.FS ? "Término para Início" :
                                            dep.type === DependencyType.SS ? "Início para Início" :
                                                dep.type === DependencyType.FF ? "Término para Término" :
                                                    "Início para Término";

                                        return (
                                            <div key={dep.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                                                <div className="flex-1">
                                                    <div className="font-medium text-slate-700">
                                                        {predecessorTask?.name || `Tarefa ${dep.fromTaskId}`}
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded">{typeLabel}</span>
                                                        {dep.lag !== undefined && dep.lag !== 0 && (
                                                            <span className={`px-2 py-0.5 rounded ${dep.lag > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                                {dep.lag > 0 ? `+${dep.lag}d` : `${dep.lag}d`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveDependency(dep.id)}
                                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Add new dependency form */}
                            <div className="space-y-3 pt-3 border-t border-slate-200">
                                <div className="text-sm font-medium text-slate-700">Adicionar Dependência</div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-600">Tarefa Predecessora</label>
                                        <select
                                            value={newDependency.fromTaskId}
                                            onChange={(e) => handleNewDependencyChange('fromTaskId', e.target.value)}
                                            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="">Selecione uma tarefa</option>
                                            {allTasks
                                                .filter(t => t.id !== task?.id && t.type !== 'project')
                                                .map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-600">Tipo de Vínculo</label>
                                        <select
                                            value={newDependency.type}
                                            onChange={(e) => handleNewDependencyChange('type', e.target.value as DependencyType)}
                                            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value={DependencyType.FS}>Término para Início (TI)</option>
                                            <option value={DependencyType.SS}>Início para Início (II)</option>
                                            <option value={DependencyType.FF}>Término para Término (TT)</option>
                                            <option value={DependencyType.SF}>Início para Término (IT)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-600">Retardo/Antecipação (dias)</label>
                                        <Input
                                            type="number"
                                            value={newDependency.lag || 0}
                                            onChange={(e) => handleNewDependencyChange('lag', parseInt(e.target.value) || 0)}
                                            className="h-9 text-sm"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleAddDependency}
                                    disabled={!newDependency.fromTaskId}
                                    className="w-full"
                                >
                                    <Plus size={16} className="mr-2" />
                                    Adicionar Dependência
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <User size={16} className="text-slate-400" />
                            Recursos Atribuídos
                        </label>
                        <div className="border border-slate-200 rounded-xl p-1 bg-slate-50 max-h-48 overflow-y-auto custom-scrollbar">
                            {resources.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                    <User size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm">Nenhum recurso disponível</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1">
                                    {resources.map((resource) => {
                                        const isSelected = formData.resources?.some(
                                            (r) => r.resourceId === resource.id,
                                        );
                                        const allocation = formData.resources?.find(
                                            (r) => r.resourceId === resource.id
                                        )?.allocation || 100;

                                        return (
                                            <div
                                                key={resource.id}
                                                className={`flex flex-col p-2.5 rounded-lg border transition-all ${isSelected
                                                    ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                                    : "hover:bg-white border-transparent hover:border-slate-200"
                                                    }`}
                                            >
                                                <label className="flex items-center space-x-3 cursor-pointer w-full">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected || false}
                                                            onChange={(e) =>
                                                                handleResourceChange(resource.id, e.target.checked)
                                                            }
                                                            className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded checked:bg-indigo-600 checked:border-indigo-600 transition-colors"
                                                        />
                                                        <svg
                                                            className="absolute w-3.5 h-3.5 text-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                                                            viewBox="0 0 12 12"
                                                            fill="none"
                                                        >
                                                            <path
                                                                d="M10 3L4.5 8.5L2 6"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                        <div
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isSelected
                                                                ? "bg-indigo-200 text-indigo-700"
                                                                : "bg-slate-200 text-slate-600"
                                                                }`}
                                                        >
                                                            {resource.name.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col truncate">
                                                            <span
                                                                className={`text-sm font-medium truncate ${isSelected ? "text-indigo-900" : "text-slate-700"}`}
                                                            >
                                                                {resource.name}
                                                            </span>
                                                            <span className="text-xs text-slate-500 truncate">
                                                                {resource.type === "person"
                                                                    ? "Pessoa"
                                                                    : resource.type === "equipment"
                                                                        ? "Equipamento"
                                                                        : "Material"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </label>

                                                {isSelected && (
                                                    <div className="mt-2 pl-8 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        <span className="text-xs text-slate-500 font-medium">Alocação:</span>
                                                        <div className="relative w-24">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={allocation}
                                                                onChange={(e) => handleResourceAllocationChange(resource.id, parseInt(e.target.value) || 0)}
                                                                className="w-full px-2 py-1 text-xs border border-indigo-200 rounded bg-white focus:outline-none focus:border-indigo-500 text-indigo-700 font-medium"
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Custom Fields */}
                    {getCustomFields().filter(f => f.category === 'task' && f.isVisible).length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <ListChecks size={16} className="text-slate-400" />
                                Campos Personalizados
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {getCustomFields()
                                    .filter(f => f.category === 'task' && f.isVisible)
                                    .map(field => (
                                        <div key={field.id} className="space-y-1.5">
                                            <label className="block text-sm font-medium text-slate-700">
                                                {field.name}
                                                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                                            </label>

                                            {field.type === 'dropdown' ? (
                                                <select
                                                    value={formData.customFields?.[field.id] as string || ''}
                                                    onChange={(e) => handleChange("customFields", {
                                                        ...formData.customFields,
                                                        [field.id]: e.target.value
                                                    })}
                                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                >
                                                    <option value="">Selecione...</option>
                                                    {field.lookupTable?.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : field.type === 'flag' ? (
                                                <div className="flex items-center h-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!formData.customFields?.[field.id]}
                                                        onChange={(e) => handleChange("customFields", {
                                                            ...formData.customFields,
                                                            [field.id]: e.target.checked
                                                        })}
                                                        className="h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                    />
                                                    <span className="ml-2 text-sm text-slate-600">Sim</span>
                                                </div>
                                            ) : (
                                                <Input
                                                    type={field.type === 'number' || field.type === 'cost' || field.type === 'duration' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                    value={formData.customFields?.[field.id] as string || ''}
                                                    onChange={(e) => handleChange("customFields", {
                                                        ...formData.customFields,
                                                        [field.id]: field.type === 'number' || field.type === 'cost' || field.type === 'duration' ? parseFloat(e.target.value) : e.target.value
                                                    })}
                                                    placeholder={field.description}
                                                />
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            // Include dependencies in the task data
                            const taskWithDeps = {
                                ...formData,
                                // Store dependency IDs for backward compatibility
                                dependencies: taskDependencies.map(dep => dep.fromTaskId),
                                // Add custom field for full dependency data
                                _dependencies: taskDependencies,
                            };
                            onSave(taskWithDeps);
                            onClose();
                        }}
                    >
                        {task ? "Salvar Alterações" : "Criar Tarefa"}
                    </Button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default TaskModal;
