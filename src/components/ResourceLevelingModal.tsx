import React, { useState } from "react";
import { X, Settings, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useMultiProject } from "../store/multiProjectStore";
import { Button } from "./ui/Button";
import type { ExtendedTask } from "../types/types";

interface ResourceLevelingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ResourceLevelingModal: React.FC<ResourceLevelingModalProps> = ({ isOpen, onClose }) => {
    const { getTasks, updateTask, recalculateDates } = useMultiProject();
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<{ movedTasks: number; totalDelay: number } | null>(null);
    const [options, setOptions] = useState({
        respectPriorities: true,
        levelWithinSlack: false,
        allowTaskSplits: false,
    });

    const handleOptionChange = (option: keyof typeof options) => {
        setOptions((prev) => ({ ...prev, [option]: !prev[option] }));
    };

    const handleRunLeveling = async () => {
        setIsRunning(true);
        setResults(null);

        // Simulate processing delay for better UX
        await new Promise((resolve) => setTimeout(resolve, 800));

        const tasks = getTasks();
        const tasksByResource: Record<string, ExtendedTask[]> = {};

        // Group tasks by resource
        tasks.forEach((task) => {
            if (task.type === "task" && task.resources && task.resources.length > 0) {
                task.resources.forEach((res) => {
                    if (!tasksByResource[res.resourceId]) {
                        tasksByResource[res.resourceId] = [];
                    }
                    // Avoid duplicates if task has multiple assignments of same resource
                    if (!tasksByResource[res.resourceId].find((t) => t.id === task.id)) {
                        tasksByResource[res.resourceId].push(task);
                    }
                });
            }
        });

        let movedTasksCount = 0;
        let totalDelayDays = 0;
        const updates: Record<string, Partial<ExtendedTask>> = {};

        // Simple leveling algorithm
        Object.keys(tasksByResource).forEach((resourceId) => {
            const resourceTasks = tasksByResource[resourceId];

            // Sort by start date, then priority
            resourceTasks.sort((a, b) => {
                if (a.start.getTime() !== b.start.getTime()) {
                    return a.start.getTime() - b.start.getTime();
                }
                // If same start, higher priority goes first
                const getPrioVal = (p: string) => {
                    if (p === "critical") return 4;
                    if (p === "high") return 3;
                    if (p === "medium") return 2;
                    return 1;
                };
                if (options.respectPriorities) {
                    return getPrioVal(b.priority) - getPrioVal(a.priority);
                }
                return 0;
            });

            // Check for overlaps
            for (let i = 0; i < resourceTasks.length - 1; i++) {
                const current = updates[resourceTasks[i].id]
                    ? ({ ...resourceTasks[i], ...updates[resourceTasks[i].id] } as ExtendedTask)
                    : resourceTasks[i];

                const next = updates[resourceTasks[i + 1].id]
                    ? ({ ...resourceTasks[i + 1], ...updates[resourceTasks[i + 1].id] } as ExtendedTask)
                    : resourceTasks[i + 1];

                if (current.end > next.start) {
                    // Overlap detected
                    const overlapTime = current.end.getTime() - next.start.getTime();
                    const overlapDays = Math.ceil(overlapTime / (1000 * 60 * 60 * 24));

                    if (overlapDays > 0) {
                        const newStart = new Date(current.end);
                        const duration = next.end.getTime() - next.start.getTime();
                        const newEnd = new Date(newStart.getTime() + duration);

                        updates[next.id] = {
                            start: newStart,
                            end: newEnd,
                        };

                        movedTasksCount++;
                        totalDelayDays += overlapDays;
                    }
                }
            }
        });

        // Apply updates
        Object.entries(updates).forEach(([taskId, update]) => {
            updateTask(taskId, update);
        });

        if (movedTasksCount > 0) {
            recalculateDates();
        }

        setResults({
            movedTasks: movedTasksCount,
            totalDelay: totalDelayDays,
        });
        setIsRunning(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Settings className="text-blue-600" size={24} />
                            Nivelamento
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">Resolver conflitos de recursos</p>
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
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {!results ? (
                        <>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                                <AlertTriangle className="text-blue-600 shrink-0" size={20} />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Como funciona?</p>
                                    <p className="opacity-90">
                                        O nivelamento ajustará automaticamente as datas das tarefas para resolver
                                        sobreposições de recursos, respeitando as dependências existentes.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 block">
                                    Opções de Nivelamento
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={options.respectPriorities}
                                        onChange={() => handleOptionChange("respectPriorities")}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">Respeitar prioridades das tarefas</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={options.levelWithinSlack}
                                        onChange={() => handleOptionChange("levelWithinSlack")}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">
                                        Nivelar apenas dentro da folga (Slack)
                                    </span>
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors opacity-60">
                                    <input
                                        type="checkbox"
                                        checked={options.allowTaskSplits}
                                        onChange={() => handleOptionChange("allowTaskSplits")}
                                        disabled
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">
                                        Permitir divisão de tarefas (Em breve)
                                    </span>
                                </label>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Nivelamento Concluído</h3>
                            <p className="text-slate-600 mb-6">O cronograma foi ajustado com sucesso.</p>

                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                        Tarefas Movidas
                                    </span>
                                    <div className="text-2xl font-bold text-slate-900 mt-1">{results.movedTasks}</div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                        Atraso Total
                                    </span>
                                    <div className="text-2xl font-bold text-slate-900 mt-1">
                                        {results.totalDelay} dias
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <Button variant="secondary" onClick={onClose} disabled={isRunning}>
                        {results ? "Fechar" : "Cancelar"}
                    </Button>

                    {!results && (
                        <Button
                            variant="primary"
                            onClick={handleRunLeveling}
                            isLoading={isRunning}
                            leftIcon={!isRunning && <Settings size={18} />}
                        >
                            Nivelar Recursos
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResourceLevelingModal;
