import React, { useMemo, useState } from "react";
import { useMultiProject } from "../store/multiProjectStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { PieChart, TrendingUp, Users } from "lucide-react";
import { TaskStatus, TaskPriority } from "../types/types";

const AnalyticsView: React.FC = () => {
    const { getTasks, getResources } = useMultiProject();
    const [activeTab, setActiveTab] = useState<"overview" | "resources" | "tasks">("overview");

    const tasks = getTasks();
    const resources = getResources();

    const stats = useMemo(() => {
        // Status Distribution
        const statusCount = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Priority Distribution
        const priorityCount = tasks.reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Resource Stats
        const resourceStats = resources.map(resource => {
            const assignedTasks = tasks.filter(t =>
                t.resources?.some(r => r.resourceId === resource.id)
            );

            const totalTasks = assignedTasks.length;
            const totalHours = assignedTasks.reduce((sum, t) => {
                // Estimate hours: duration (days) * 8 hours * allocation
                // If effort is defined, use it. Otherwise calculate.
                // For now, simple duration based
                const durationDays = (new Date(t.end).getTime() - new Date(t.start).getTime()) / (1000 * 60 * 60 * 24);
                const allocation = t.resources?.find(r => r.resourceId === resource.id)?.allocation || 100;
                return sum + (durationDays * 8 * (allocation / 100));
            }, 0);

            return {
                ...resource,
                totalTasks,
                totalHours: Math.round(totalHours)
            };
        }).sort((a, b) => b.totalHours - a.totalHours);

        return {
            statusCount,
            priorityCount,
            resourceStats,
            totalTasks: tasks.length
        };
    }, [tasks, resources]);

    const maxStatusCount = Math.max(...Object.values(stats.statusCount), 1);
    const maxPriorityCount = Math.max(...Object.values(stats.priorityCount), 1);
    const maxResourceHours = Math.max(...stats.resourceStats.map(r => r.totalHours), 1);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case TaskStatus.NOT_STARTED: return "Não Iniciada";
            case TaskStatus.IN_PROGRESS: return "Em Andamento";
            case TaskStatus.COMPLETED: return "Concluída";
            case TaskStatus.ON_HOLD: return "Em Espera";
            case TaskStatus.CANCELLED: return "Cancelada";
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case TaskStatus.NOT_STARTED: return "bg-slate-400";
            case TaskStatus.IN_PROGRESS: return "bg-blue-500";
            case TaskStatus.COMPLETED: return "bg-emerald-500";
            case TaskStatus.ON_HOLD: return "bg-amber-500";
            case TaskStatus.CANCELLED: return "bg-red-500";
            default: return "bg-slate-300";
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case TaskPriority.LOW: return "Baixa";
            case TaskPriority.MEDIUM: return "Média";
            case TaskPriority.HIGH: return "Alta";
            case TaskPriority.CRITICAL: return "Crítica";
            default: return priority;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case TaskPriority.LOW: return "bg-slate-400";
            case TaskPriority.MEDIUM: return "bg-blue-400";
            case TaskPriority.HIGH: return "bg-orange-500";
            case TaskPriority.CRITICAL: return "bg-red-600";
            default: return "bg-slate-300";
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/50">
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Análise do Projeto</h1>
                    <p className="text-slate-500">Visualização gráfica de métricas e desempenho</p>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "overview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab("resources")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "resources" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    >
                        Recursos
                    </button>
                    <button
                        onClick={() => setActiveTab("tasks")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "tasks" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    >
                        Tarefas
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChart size={18} />
                                    Distribuição por Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Object.entries(stats.statusCount).map(([status, count]) => (
                                        <div key={status} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-slate-700">{getStatusLabel(status)}</span>
                                                <span className="text-slate-500">{count} ({Math.round(count / stats.totalTasks * 100)}%)</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${getStatusColor(status)}`}
                                                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp size={18} />
                                    Distribuição por Prioridade
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Object.entries(stats.priorityCount).map(([priority, count]) => (
                                        <div key={priority} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-slate-700">{getPriorityLabel(priority)}</span>
                                                <span className="text-slate-500">{count} ({Math.round(count / stats.totalTasks * 100)}%)</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${getPriorityColor(priority)}`}
                                                    style={{ width: `${(count / maxPriorityCount) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users size={18} />
                                    Carga de Trabalho por Recurso (Top 5)
                                </CardTitle>
                                <CardDescription>Estimativa de horas atribuídas baseada na duração das tarefas e alocação</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {stats.resourceStats.slice(0, 5).map((resource) => (
                                        <div key={resource.id} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-slate-700">{resource.name}</span>
                                                <span className="text-slate-500">{resource.totalHours}h ({resource.totalTasks} tarefas)</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    style={{ width: `${(resource.totalHours / maxResourceHours) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {stats.resourceStats.length === 0 && (
                                        <p className="text-center text-slate-500 py-4">Nenhum recurso atribuído</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === "resources" && (
                    <div className="grid grid-cols-1 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalhamento de Recursos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 rounded-l-lg">Recurso</th>
                                                <th className="px-4 py-3">Tipo</th>
                                                <th className="px-4 py-3">Tarefas</th>
                                                <th className="px-4 py-3">Horas Estimadas</th>
                                                <th className="px-4 py-3 rounded-r-lg">Carga Relativa</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.resourceStats.map((resource) => (
                                                <tr key={resource.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <td className="px-4 py-3 font-medium text-slate-900">{resource.name}</td>
                                                    <td className="px-4 py-3 text-slate-500 capitalize">{resource.type}</td>
                                                    <td className="px-4 py-3 text-slate-500">{resource.totalTasks}</td>
                                                    <td className="px-4 py-3 text-slate-500">{resource.totalHours}h</td>
                                                    <td className="px-4 py-3">
                                                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-indigo-500 rounded-full"
                                                                style={{ width: `${(resource.totalHours / maxResourceHours) * 100}%` }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === "tasks" && (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-emerald-50 border-emerald-100">
                                <CardContent className="pt-6">
                                    <div className="text-2xl font-bold text-emerald-700">
                                        {stats.statusCount[TaskStatus.COMPLETED] || 0}
                                    </div>
                                    <p className="text-emerald-600 text-sm font-medium">Tarefas Concluídas</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-blue-50 border-blue-100">
                                <CardContent className="pt-6">
                                    <div className="text-2xl font-bold text-blue-700">
                                        {stats.statusCount[TaskStatus.IN_PROGRESS] || 0}
                                    </div>
                                    <p className="text-blue-600 text-sm font-medium">Em Andamento</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-50 border-slate-100">
                                <CardContent className="pt-6">
                                    <div className="text-2xl font-bold text-slate-700">
                                        {stats.statusCount[TaskStatus.NOT_STARTED] || 0}
                                    </div>
                                    <p className="text-slate-600 text-sm font-medium">Não Iniciadas</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Lista de Tarefas por Prioridade</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 rounded-l-lg">Tarefa</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Prioridade</th>
                                                <th className="px-4 py-3 rounded-r-lg">Recursos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...tasks]
                                                .sort((a, b) => {
                                                    const pMap = { [TaskPriority.CRITICAL]: 4, [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
                                                    return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
                                                })
                                                .map((task) => (
                                                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-medium text-slate-900">{task.name}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(task.status)}`}>
                                                                {getStatusLabel(task.status)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(task.priority)}`}>
                                                                {getPriorityLabel(task.priority)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-500">
                                                            {task.resources?.length || 0}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsView;
