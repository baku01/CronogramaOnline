import React, { useState, useEffect } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import type { Task } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { useMultiProject } from "../store/multiProjectStore";
import { differenceInDays } from "date-fns";
import type { ExtendedTask, TaskStatus, TaskPriority } from "../types/types";
import { generateWBS } from "../utils/wbsGenerator";
import { ClipboardList, SearchX, Filter } from "lucide-react";
import FilterPanel from "./FilterPanel";
import GroupingControl from "./GroupingControl";
import type { GroupingOption } from "./GroupingControl";
import { Button } from "./ui/Button";
import TaskActionBar from "./TaskActionBar";
import TaskContextMenu from "./TaskContextMenu";

interface GanttViewProps {
    viewMode: ViewMode;
    showCriticalPath: boolean;
    showBaseline?: boolean;
    searchQuery: string;
    onEditTask: (task: ExtendedTask) => void;
}

const CustomTooltip: React.FC<{
    task: Task;
    fontSize: string;
    fontFamily: string;
}> = ({ task }) => {
    const constraintType = (task as any).constraintType;
    const constraintDate = (task as any).constraintDate ? new Date((task as any).constraintDate).toLocaleDateString("pt-BR") : "";
    const startDate = task.start.toLocaleDateString("pt-BR");
    const endDate = task.end.toLocaleDateString("pt-BR");
    const duration = differenceInDays(task.end, task.start) + 1;

    return (
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-white/50 text-sm z-50 min-w-[240px] animate-in fade-in zoom-in-95 duration-200">
            <div className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${task.type === 'project' ? 'bg-slate-500' :
                    task.type === 'milestone' ? 'bg-emerald-500' :
                        'bg-indigo-500'
                    }`} />
                {task.name.replace(" 🔒", "")}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold block mb-0.5">Início</span>
                    <span className="text-slate-700 font-medium">{startDate}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold block mb-0.5">Término</span>
                    <span className="text-slate-700 font-medium">{endDate}</span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Duração</span>
                    <span className="text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{duration} dias</span>
                </div>

                <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Progresso</span>
                        <span className="text-indigo-600 font-bold">{task.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${task.progress}%` }}
                        />
                    </div>
                </div>

                {constraintType && constraintType !== 'ASAP' && (
                    <div className="pt-2 border-t border-slate-100 mt-2">
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                            <span className="text-lg">🔒</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70">Restrição</span>
                                <span className="text-xs font-semibold">
                                    {constraintType} {constraintDate && `- ${constraintDate}`}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const GanttView: React.FC<GanttViewProps> = ({ viewMode, showCriticalPath, showBaseline = false, searchQuery, onEditTask }) => {
    const { getTasks, updateTask, deleteTask, recalculateDates, getResources } = useMultiProject();
    const [tasks, setTasks] = useState<(Task & { constraintType?: string; constraintDate?: Date })[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<{
        status: TaskStatus[];
        priority: TaskPriority[];
        resourceId: string | null;
    }>({
        status: [],
        priority: [],
        resourceId: null
    });
    const [grouping, setGrouping] = useState<GroupingOption>('none');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; task: ExtendedTask } | null>(null);

    const handleTaskClick = (task: Task) => {
        setSelectedTaskId(prev => prev === task.id ? null : task.id);
        setContextMenu(null);
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        const allTasks = getTasks();
        // Calculate WBS based on the full project structure to ensure consistency
        const wbsMap = generateWBS(allTasks);
        
        let filteredTasks = allTasks;

        // 1. Apply Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredTasks = filteredTasks.filter(
                (task) => task.name.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query),
            );
        }

        // 2. Apply Filters
        if (filters.status.length > 0) {
            filteredTasks = filteredTasks.filter(task => filters.status.includes(task.status));
        }
        if (filters.priority.length > 0) {
            filteredTasks = filteredTasks.filter(task => filters.priority.includes(task.priority));
        }
        if (filters.resourceId) {
            filteredTasks = filteredTasks.filter(task =>
                task.resources?.some(r => r.resourceId === filters.resourceId)
            );
        }

        // 3. Apply Grouping (Virtual Tasks)
        let groupedTasks = [...filteredTasks];
        if (grouping !== 'none') {
            // Sort by grouping criteria first
            groupedTasks.sort((a, b) => {
                const valA = a[grouping] || '';
                const valB = b[grouping] || '';
                return valA.localeCompare(valB);
            });
        }

        // Convert to Gantt Task format
        const ganttTasks: (Task & { constraintType?: string; constraintDate?: Date })[] = [];

        groupedTasks.forEach((task) => {
            const hasConstraint = task.constraintType && task.constraintType !== 'ASAP';
            const wbs = wbsMap.get(task.id) || '';
            const wbsPrefix = wbs ? `${wbs}. ` : '';

            // Standard Task
            ganttTasks.push({
                start: task.start,
                end: task.end,
                name: hasConstraint ? `${wbsPrefix}${task.name} 🔒` : `${wbsPrefix}${task.name}`,
                id: task.id,
                type: task.type,
                progress: task.progress,
                project: task.project,
                dependencies: task.dependencies,
                hideChildren: task.hideChildren,
                displayOrder: task.displayOrder,
                // Pass custom data for tooltip (will be accessed via type assertion)
                constraintType: task.constraintType,
                constraintDate: task.constraintDate,
                // Apply critical path styling
                styles:
                    task.isCritical && showCriticalPath
                        ? {
                            backgroundColor: "#f43f5e", // rose-500
                            backgroundSelectedColor: "#e11d48", // rose-600
                            progressColor: "#be123c", // rose-700
                            progressSelectedColor: "#9f1239", // rose-800
                        }
                        : task.type === "milestone"
                            ? {
                                backgroundColor: "#10b981", // emerald-500
                                backgroundSelectedColor: "#059669", // emerald-600
                                progressColor: "#047857", // emerald-700
                                progressSelectedColor: "#065f46", // emerald-800
                            }
                            : task.type === "project"
                                ? {
                                    backgroundColor: "#64748b", // slate-500
                                    backgroundSelectedColor: "#475569", // slate-600
                                    progressColor: "#334155", // slate-700
                                    progressSelectedColor: "#1e293b", // slate-800
                                }
                                : undefined,
            });

            // Baseline Task (Ghost)
            if (showBaseline && task.baselineStart && task.baselineEnd) {
                ganttTasks.push({
                    start: task.baselineStart,
                    end: task.baselineEnd,
                    name: "Baseline",
                    id: `baseline-${task.id}`,
                    type: "task",
                    progress: 0,
                    // Use task.project to keep baseline as sibling
                    project: task.project,
                    dependencies: [],
                    hideChildren: false,
                    displayOrder: task.displayOrder, // Same order?
                    isDisabled: true,
                    styles: {
                        backgroundColor: "#cbd5e1", // slate-300
                        backgroundSelectedColor: "#94a3b8", // slate-400
                        progressColor: "transparent",
                        progressSelectedColor: "transparent",
                    }
                });
            }
        });

        setTasks(ganttTasks);
    }, [getTasks, showCriticalPath, showBaseline, searchQuery, filters, grouping, selectedTaskId]);

    const handleTaskChange = (task: Task) => {
        const duration = differenceInDays(task.end, task.start) + 1;
        updateTask(task.id, {
            start: task.start,
            end: task.end,
            duration,
        });
        setTimeout(() => recalculateDates(), 100);
    };

    const handleTaskDelete = (task: Task) => {
        const confirmation = window.confirm(
            `Tem certeza que deseja excluir a tarefa "${task.name}"?\n\nIsso também removerá todas as dependências relacionadas.`,
        );
        if (confirmation) {
            deleteTask(task.id);
        }
        return confirmation;
    };

    const handleProgressChange = (task: Task) => {
        updateTask(task.id, {
            progress: task.progress,
        });
    };

    const handleDblClick = (task: Task) => {
        const fullTask = getTasks().find((t) => t.id === task.id);
        if (fullTask) {
            onEditTask(fullTask);
        }
    };

    const handleExpanderClick = (task: Task) => {
        updateTask(task.id, {
            hideChildren: !task.hideChildren,
        });
    };

    const getColumnWidth = () => {
        switch (viewMode) {
            case ViewMode.Month: return 300;
            case ViewMode.Week: return 250;
            case ViewMode.Day: default: return 65;
        }
    };

    if (tasks.length === 0 && !searchQuery && filters.status.length === 0 && filters.priority.length === 0 && !filters.resourceId) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-50 to-slate-100 p-8">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-200 text-center max-w-md transform hover:scale-105 transition-transform duration-300">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-indigo-50/50">
                        <ClipboardList className="text-indigo-500" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Comece seu Cronograma</h3>
                    <p className="text-slate-500 text-base leading-relaxed mb-6">
                        Seu projeto ainda não tem tarefas. Use o botão 'Nova Tarefa' na barra superior para começar a planejar.
                    </p>
                </div>
            </div>
        );
    }

    const activeFiltersCount = filters.status.length + filters.priority.length + (filters.resourceId ? 1 : 0);

    return (
        <div className="h-full w-full bg-white gantt-container flex flex-col">
            {/* Filter & Grouping Bar */}
            <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`gap-2 ${activeFiltersCount > 0 ? 'border-indigo-200 text-indigo-700 bg-indigo-50' : ''}`}
                        >
                            <Filter size={16} />
                            Filtros
                            {activeFiltersCount > 0 && (
                                <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </Button>
                        <FilterPanel
                            isOpen={isFilterOpen}
                            onClose={() => setIsFilterOpen(false)}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            resources={getResources()}
                        />
                    </div>
                    <GroupingControl
                        grouping={grouping}
                        onGroupingChange={setGrouping}
                    />
                </div>
                <div className="text-xs text-slate-400">
                    {tasks.length} tarefas visíveis
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {selectedTaskId && (
                    <TaskActionBar
                        task={getTasks().find(t => t.id === selectedTaskId)!}
                        onClose={() => setSelectedTaskId(null)}
                        onEdit={() => {
                            const task = getTasks().find(t => t.id === selectedTaskId);
                            if (task) onEditTask(task);
                        }}
                    />
                )}
                {tasks.length > 0 ? (
                    <>
                    <Gantt
                        tasks={tasks}
                        viewMode={viewMode}
                        onDateChange={handleTaskChange}
                        onDelete={handleTaskDelete}
                        onProgressChange={handleProgressChange}
                        onDoubleClick={handleDblClick}
                        onExpanderClick={handleExpanderClick}
                        onClick={handleTaskClick}
                        TooltipContent={CustomTooltip}
                        listCellWidth="300px"
                        columnWidth={getColumnWidth()}
                        locale="pt-BR"
                        barBackgroundColor="#818cf8"
                        barBackgroundSelectedColor="#6366f1"
                        barProgressColor="#4f46e5"
                        barProgressSelectedColor="#4338ca"
                        projectBackgroundColor="#94a3b8"
                        projectBackgroundSelectedColor="#64748b"
                        projectProgressColor="#475569"
                        projectProgressSelectedColor="#334155"
                        milestoneBackgroundColor="#34d399"
                        milestoneBackgroundSelectedColor="#10b981"
                        todayColor="rgba(251, 191, 36, 0.1)"
                        arrowColor="#cbd5e1"
                        arrowIndent={20}
                        fontSize="13px"
                        fontFamily="'Outfit', 'Inter', system-ui, sans-serif"
                        rowHeight={52}
                        headerHeight={64}
                        barCornerRadius={6}
                        handleWidth={10}
                    />
                    {contextMenu && (
                        <TaskContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            task={contextMenu.task}
                            onClose={() => setContextMenu(null)}
                            onEdit={() => onEditTask(contextMenu.task)}
                        />
                    )}
                </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <SearchX size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">Nenhuma tarefa encontrada</p>
                        <p className="text-sm">Tente ajustar seus filtros ou busca</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GanttView;
