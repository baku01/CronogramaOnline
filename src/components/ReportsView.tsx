import React, { useState } from 'react';
import { useMultiProject } from '../store/multiProjectStore';
import { PieChart, Activity, Download, Users } from 'lucide-react';
import { Button } from './ui/Button';

const ReportsView: React.FC = () => {
    const { getTasks, getResources } = useMultiProject();
    const tasks = getTasks();
    const resources = getResources();
    const [activeReport, setActiveReport] = useState<'status' | 'resource' | 'critical'>('status');

    // --- Report Calculations ---

    const getStatusData = () => {
        const total = tasks.length;
        if (total === 0) return [];

        const statusCounts = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
            percentage: Math.round((count / total) * 100)
        }));
    };

    const getResourceData = () => {
        return resources.map(resource => {
            const assignedTasks = tasks.filter(t => t.resources?.some(r => r.resourceId === resource.id));
            const totalEffort = assignedTasks.reduce((sum, t) => sum + (t.effort || 0), 0);
            return {
                name: resource.name,
                taskCount: assignedTasks.length,
                totalEffort
            };
        }).sort((a, b) => b.totalEffort - a.totalEffort);
    };

    const getCriticalPathTasks = () => {
        return tasks.filter(t => t.isCritical).sort((a, b) => a.start.getTime() - b.start.getTime());
    };

    // --- Export Logic ---

    const handleExport = () => {
        const date = new Date().toLocaleDateString('pt-BR');
        let content = `Relatório de Projeto - Gerado em ${date}\n\n`;

        if (activeReport === 'status') {
            content += "RELATÓRIO DE STATUS\n-------------------\n";
            getStatusData().forEach(item => {
                const label = item.status === 'not_started' ? 'Não Iniciada' :
                    item.status === 'in_progress' ? 'Em Andamento' :
                        item.status === 'completed' ? 'Concluída' :
                            item.status === 'on_hold' ? 'Em Espera' : 'Cancelada';
                content += `${label}: ${item.count} tarefas (${item.percentage}%)\n`;
            });
        } else if (activeReport === 'resource') {
            content += "RELATÓRIO DE RECURSOS\n---------------------\n";
            getResourceData().forEach(item => {
                content += `${item.name}: ${item.taskCount} tarefas, ${item.totalEffort}h esforço estimado\n`;
            });
        } else {
            content += "CAMINHO CRÍTICO\n---------------\n";
            getCriticalPathTasks().forEach(task => {
                content += `[${task.start.toLocaleDateString()}] ${task.name} (${task.duration} dias)\n`;
            });
        }

        // Create a blob and download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-${activeReport}-${Date.now()}.txt`;
        link.click();
    };

    return (
        <div className="h-full bg-slate-50/50 p-6 flex flex-col gap-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Relatórios e Análises</h1>
                    <p className="text-slate-500 mt-1">Visualize métricas chave e exporte dados do projeto</p>
                </div>
                <Button onClick={handleExport}>
                    <Download size={18} className="mr-2" />
                    Exportar Relatório
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-2">
                    <button
                        onClick={() => setActiveReport('status')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeReport === 'status'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <PieChart size={18} />
                        Status das Tarefas
                    </button>
                    <button
                        onClick={() => setActiveReport('resource')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeReport === 'resource'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Users size={18} />
                        Uso de Recursos
                    </button>
                    <button
                        onClick={() => setActiveReport('critical')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeReport === 'critical'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Activity size={18} />
                        Caminho Crítico
                    </button>
                </div>

                {/* Main Report Area */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-8 overflow-y-auto custom-scrollbar">
                    {activeReport === 'status' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <PieChart className="text-indigo-600" />
                                Distribuição de Status
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {getStatusData().map((item) => (
                                    <div key={item.status} className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col items-center text-center">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-4 ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                            item.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                                                'bg-slate-200 text-slate-600'
                                            }`}>
                                            {item.percentage}%
                                        </div>
                                        <h3 className="font-semibold text-slate-900 mb-1">
                                            {item.status === 'not_started' ? 'Não Iniciada' :
                                                item.status === 'in_progress' ? 'Em Andamento' :
                                                    item.status === 'completed' ? 'Concluída' :
                                                        item.status === 'on_hold' ? 'Em Espera' : 'Cancelada'}
                                        </h3>
                                        <p className="text-slate-500 text-sm">{item.count} tarefas</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeReport === 'resource' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Users className="text-indigo-600" />
                                Alocação de Recursos
                            </h2>
                            <div className="space-y-4">
                                {getResourceData().map((item) => (
                                    <div key={item.name} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-slate-700">{item.name}</span>
                                            <span className="text-sm text-slate-500">{item.taskCount} tarefas</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    style={{ width: `${Math.min(item.totalEffort, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-indigo-600 w-16 text-right">{item.totalEffort}h</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeReport === 'critical' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Activity className="text-red-600" />
                                Tarefas do Caminho Crítico
                            </h2>
                            <p className="text-slate-500">Estas tarefas impactam diretamente a data de término do projeto.</p>

                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Tarefa</th>
                                            <th className="px-4 py-3">Início</th>
                                            <th className="px-4 py-3">Término</th>
                                            <th className="px-4 py-3">Duração</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {getCriticalPathTasks().map(task => (
                                            <tr key={task.id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                                    {task.name}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{task.start.toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-slate-600">{task.end.toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-slate-600">{task.duration} dias</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
