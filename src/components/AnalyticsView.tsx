import React, { useMemo, useState } from "react";
import { useMultiProject } from "../store/multiProjectStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { PieChart, TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { TaskStatus, TaskPriority } from "../types/types";
import { calculateProjectEVM } from "../utils/evmCalculations";

const AnalyticsView: React.FC = () => {
    const { getTasks, getResources } = useMultiProject();
    const [activeTab, setActiveTab] = useState<"overview" | "resources" | "tasks" | "evm">("overview");

    const tasks = getTasks();
    const resources = getResources();

    const evm = useMemo(() => calculateProjectEVM(tasks), [tasks]);

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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/50">
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Análise do Projeto</h1>
                    <p className="text-slate-500">Visualização gráfica de métricas e desempenho</p>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "overview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab("evm")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "evm" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    >
                        Valor Agregado (EVM)
                    </button>
                    <button
                        onClick={() => setActiveTab("resources")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "resources" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    >
                        Recursos
                    </button>
                    <button
                        onClick={() => setActiveTab("tasks")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "tasks" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
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

                {activeTab === "evm" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm font-medium text-slate-500 mb-1">Custo Real (AC)</div>
                                    <div className="text-2xl font-bold text-slate-800">{formatCurrency(evm.ac)}</div>
                                    <div className="text-xs text-slate-400 mt-1">Gasto até agora</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm font-medium text-slate-500 mb-1">Valor Agregado (EV)</div>
                                    <div className="text-2xl font-bold text-indigo-600">{formatCurrency(evm.ev)}</div>
                                    <div className="text-xs text-slate-400 mt-1">Trabalho realizado</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm font-medium text-slate-500 mb-1">Valor Planejado (PV)</div>
                                    <div className="text-2xl font-bold text-slate-800">{formatCurrency(evm.pv)}</div>
                                    <div className="text-xs text-slate-400 mt-1">Trabalho agendado</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm font-medium text-slate-500 mb-1">Orçamento (BAC)</div>
                                    <div className="text-2xl font-bold text-slate-800">{formatCurrency(evm.bac)}</div>
                                    <div className="text-xs text-slate-400 mt-1">Total planejado</div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity size={18} />
                                        Índices de Desempenho
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-slate-700">CPI (Custo)</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${evm.cpi >= 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {evm.cpi.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${evm.cpi >= 1 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min(evm.cpi * 50, 100)}%` }} // Scale roughly around 1.0 being 50%? No, simplistic bar.
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {evm.cpi >= 1 ? "Dentro ou abaixo do orçamento" : "Acima do orçamento"}
                                            </p>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-slate-700">SPI (Prazo)</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${evm.spi >= 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {evm.spi.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${evm.spi >= 1 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min(evm.spi * 50, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {evm.spi >= 1 ? "Adiantado ou no prazo" : "Atrasado"}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign size={18} />
                                        Variações
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                            <span className="text-sm font-medium text-slate-600">Variação de Custo (CV)</span>
                                            <span className={`font-bold ${evm.cv >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {formatCurrency(evm.cv)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                            <span className="text-sm font-medium text-slate-600">Variação de Prazo (SV)</span>
                                            <span className={`font-bold ${evm.sv >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {formatCurrency(evm.sv)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border-t-2 border-slate-200">
                                            <span className="text-sm font-medium text-slate-600">Estimativa no Término (EAC)</span>
                                            <span className="font-bold text-slate-800">
                                                {formatCurrency(evm.eac)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
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
