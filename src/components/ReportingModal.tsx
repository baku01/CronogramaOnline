import React, { useState } from "react";
import { X, BarChart3, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Calendar, Users, Target, Eye, Download } from "lucide-react";
import { useMultiProject } from "../store/multiProjectStore";
import { generateProjectReport, generateTaskAnalysisReport } from "../utils/evmCalculations";
import type { ProjectStatistics } from "../types/types";

interface ReportingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ReportingModal: React.FC<ReportingModalProps> = ({ isOpen, onClose }) => {
    const { activeProject: project, calculateProjectStats } = useMultiProject();
    const [activeTab, setActiveTab] = useState('overview');
    const [reportFormat, setReportFormat] = useState('pdf');

    if (!isOpen || !project) return null;

    const stats: ProjectStatistics = calculateProjectStats();
    const projectReport = generateProjectReport(project, stats);
    const taskAnalysis = generateTaskAnalysisReport(project.tasks);

    // Format currency values
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Determine health based on performance indices
    const scheduleHealth = projectReport.evmMetrics.schedulePerformanceIndex;
    const costHealth = projectReport.evmMetrics.costPerformanceIndex;

    // Get color based on value (green for good, yellow for caution, red for poor)
    const getHealthColor = (value: number) => {
        if (value >= 0.95) return 'text-green-600';
        if (value >= 0.85) return 'text-amber-600';
        return 'text-red-600';
    };

    // Get status text based on performance
    const getHealthText = (value: number) => {
        if (value >= 0.95) return 'Bom';
        if (value >= 0.85) return 'Acompanhar';
        return 'Preocupante';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 className="text-blue-600" size={24} />
                            Relatórios e Análise
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Visualize métricas de desempenho e relatórios do projeto
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={reportFormat}
                            onChange={(e) => setReportFormat(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <option value="pdf">PDF</option>
                            <option value="excel">Excel</option>
                            <option value="csv">CSV</option>
                        </select>
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <Download size={18} />
                            Exportar
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all p-2 rounded-full"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 bg-slate-50">
                    <div className="flex">
                        {[
                            { id: 'overview', label: 'Visão Geral', icon: Eye },
                            { id: 'evm', label: 'Métricas EVM', icon: TrendingUp },
                            { id: 'tasks', label: 'Tarefas', icon: CheckCircle },
                            { id: 'resources', label: 'Recursos', icon: Users },
                            { id: 'financial', label: 'Financeiro', icon: DollarSign },
                            { id: 'schedule', label: 'Cronograma', icon: Calendar }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {/* Project Progress */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <CheckCircle size={24} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Progresso</p>
                                            <p className="text-2xl font-bold text-slate-800">
                                                {projectReport.projectInfo.progress.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${projectReport.projectInfo.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Schedule Performance */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <TrendingUp size={24} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Desempenho Cronograma</p>
                                            <p className={`text-2xl font-bold ${getHealthColor(scheduleHealth)}`}>
                                                {scheduleHealth.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">{getHealthText(scheduleHealth)}</p>
                                </div>

                                {/* Cost Performance */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <DollarSign size={24} className="text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Desempenho Custo</p>
                                            <p className={`text-2xl font-bold ${getHealthColor(costHealth)}`}>
                                                {costHealth.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">{getHealthText(costHealth)}</p>
                                </div>

                                {/* Critical Path */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <Target size={24} className="text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Tarefas Críticas</p>
                                            <p className="text-2xl font-bold text-slate-800">
                                                {projectReport.scheduleSummary.criticalPathLength}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">Tarefas</p>
                                </div>
                            </div>

                            {/* Task Summary */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <CheckCircle size={20} className="text-blue-600" />
                                    Resumo das Tarefas
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-800">{projectReport.taskSummary.total}</p>
                                        <p className="text-xs text-slate-500">Total</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">{projectReport.taskSummary.completed}</p>
                                        <p className="text-xs text-slate-500">Concluídas</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-600">{projectReport.taskSummary.inProgress}</p>
                                        <p className="text-xs text-slate-500">Em Andamento</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-amber-600">{projectReport.taskSummary.notStarted}</p>
                                        <p className="text-xs text-slate-500">Não Iniciadas</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-600">{projectReport.taskSummary.overdue}</p>
                                        <p className="text-xs text-slate-500">Atrasadas</p>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <DollarSign size={20} className="text-blue-600" />
                                    Resumo Financeiro
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500">Orçamento Planejado</p>
                                        <p className="text-lg font-bold text-slate-800">
                                            {formatCurrency(projectReport.financialSummary.budgetedCost)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Custo Real</p>
                                        <p className="text-lg font-bold text-slate-800">
                                            {formatCurrency(projectReport.financialSummary.totalCost)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Variação de Custo</p>
                                        <p className={`text-lg font-bold ${projectReport.financialSummary.costVariance >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}>
                                            {formatCurrency(projectReport.financialSummary.costVariance)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Desempenho</p>
                                        <p className={`text-lg font-bold ${getHealthColor(projectReport.financialSummary.costPerformance)}`}>
                                            {projectReport.financialSummary.costPerformance.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EVM Tab */}
                    {activeTab === 'evm' && (
                        <div className="p-6">
                            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-blue-600" />
                                    Métricas de Valor Agregado (EVM)
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Valor Planejado (PV)</p>
                                        <p className="text-xl font-bold text-slate-800">
                                            {formatCurrency(projectReport.evmMetrics.plannedValue)}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Valor Agregado (EV)</p>
                                        <p className="text-xl font-bold text-slate-800">
                                            {formatCurrency(projectReport.evmMetrics.earnedValue)}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Custo Real (AC)</p>
                                        <p className="text-xl font-bold text-slate-800">
                                            {formatCurrency(projectReport.evmMetrics.actualCost)}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Custo Estimado Total (EAC)</p>
                                        <p className="text-xl font-bold text-slate-800">
                                            {formatCurrency(projectReport.evmMetrics.estimateAtCompletion)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Variação de Cronograma (SV)</p>
                                        <p className={`text-xl font-bold ${projectReport.evmMetrics.scheduleVariance >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}>
                                            {formatCurrency(projectReport.evmMetrics.scheduleVariance)}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Variação de Custo (CV)</p>
                                        <p className={`text-xl font-bold ${projectReport.evmMetrics.costVariance >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}>
                                            {formatCurrency(projectReport.evmMetrics.costVariance)}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Índice Desempenho Cronograma (SPI)</p>
                                        <p className={`text-xl font-bold ${getHealthColor(projectReport.evmMetrics.schedulePerformanceIndex)}`}>
                                            {projectReport.evmMetrics.schedulePerformanceIndex.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Índice Desempenho Custo (CPI)</p>
                                        <p className={`text-xl font-bold ${getHealthColor(projectReport.evmMetrics.costPerformanceIndex)}`}>
                                            {projectReport.evmMetrics.costPerformanceIndex.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Estimativa para Terminar (ETC)</p>
                                        <p className="text-xl font-bold text-slate-800">
                                            {formatCurrency(projectReport.evmMetrics.estimateToComplete)}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Variação no Término (VAC)</p>
                                        <p className={`text-xl font-bold ${projectReport.evmMetrics.varianceAtCompletion >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}>
                                            {formatCurrency(projectReport.evmMetrics.varianceAtCompletion)}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Índice para TCPI</p>
                                        <p className={`text-xl font-bold ${getHealthColor(
                                            projectReport.evmMetrics.toCompletePerformanceIndex
                                        )}`}>
                                            {projectReport.evmMetrics.toCompletePerformanceIndex.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Duração Total</p>
                                        <p className="text-xl font-bold text-slate-800">
                                            {projectReport.scheduleSummary.totalDuration} dias
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tasks Tab */}
                    {activeTab === 'tasks' && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white border border-slate-200 rounded-xl p-6">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <AlertTriangle size={20} className="text-amber-600" />
                                        Tarefas Atrasadas ({taskAnalysis.overdueTasks.length})
                                    </h3>
                                    {taskAnalysis.overdueTasks.length > 0 ? (
                                        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                                            {taskAnalysis.overdueTasks.slice(0, 10).map(task => (
                                                <div key={task.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                    <p className="font-medium text-slate-800">{task.name}</p>
                                                    <p className="text-sm text-amber-700">
                                                        Previsto: {task.end.toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-center py-8">Nenhuma tarefa atrasada</p>
                                    )}
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-6">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Target size={20} className="text-red-600" />
                                        Tarefas Críticas ({taskAnalysis.criticalTasks.length})
                                    </h3>
                                    {taskAnalysis.criticalTasks.length > 0 ? (
                                        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                                            {taskAnalysis.criticalTasks.slice(0, 10).map(task => (
                                                <div key={task.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <p className="font-medium text-slate-800">{task.name}</p>
                                                    <p className="text-sm text-red-700">
                                                        Slack: {task.slack !== undefined ? task.slack + ' dia(s)' : 'N/A'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-center py-8">Nenhuma tarefa crítica</p>
                                    )}
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-6">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <AlertTriangle size={20} className="text-orange-600" />
                                        Tarefas de Alto Risco ({taskAnalysis.highRiskTasks.length})
                                    </h3>
                                    {taskAnalysis.highRiskTasks.length > 0 ? (
                                        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                                            {taskAnalysis.highRiskTasks.slice(0, 10).map(task => (
                                                <div key={task.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                    <p className="font-medium text-slate-800">{task.name}</p>
                                                    <p className="text-sm text-orange-700">
                                                        Slack: {task.slack !== undefined ? task.slack + ' dia(s)' : 'N/A'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-center py-8">Nenhuma tarefa de alto risco</p>
                                    )}
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-6">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <DollarSign size={20} className="text-green-600" />
                                        Tarefas com Estouro de Custo ({taskAnalysis.costOverrunTasks.length})
                                    </h3>
                                    {taskAnalysis.costOverrunTasks.length > 0 ? (
                                        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                                            {taskAnalysis.costOverrunTasks.slice(0, 10).map(task => (
                                                <div key={task.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <p className="font-medium text-slate-800">{task.name}</p>
                                                    <p className="text-sm text-green-700">
                                                        Orçado: {formatCurrency(task.budgetedCost || 0)},
                                                        Real: {formatCurrency(task.cost || 0)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-center py-8">Nenhuma tarefa com estouro de custo</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resources Tab */}
                    {activeTab === 'resources' && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white border border-slate-200 rounded-xl p-6">
                                    <h3 className="font-bold text-slate-800 mb-4">Resumo de Recursos</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-slate-500">Total de Recursos</p>
                                            <p className="text-2xl font-bold text-slate-800">{projectReport.resourceSummary.totalResources}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Tarefas com Recursos Atribuídos</p>
                                            <p className="text-2xl font-bold text-slate-800">{projectReport.resourceSummary.allocatedResources}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-xl p-6">
                                    <h3 className="font-bold text-slate-800 mb-4">Recursos Sobreutilizados</h3>
                                    <p className="text-slate-500">Implementar análise de sobreutilização de recursos</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Financial Tab */}
                    {activeTab === 'financial' && (
                        <div className="p-6">
                            <div className="bg-white border border-slate-200 rounded-xl p-6">
                                <h3 className="font-bold text-slate-800 mb-4">Análise Financeira Detalhada</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="text-left p-3 text-slate-600 font-medium">Métrica</th>
                                                <th className="text-right p-3 text-slate-600 font-medium">Valor</th>
                                                <th className="text-right p-3 text-slate-600 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-slate-100">
                                                <td className="p-3 font-medium text-slate-700">Orçamento Planejado (BAC)</td>
                                                <td className="p-3 text-right">{formatCurrency(projectReport.financialSummary.budgetedCost)}</td>
                                                <td className="p-3 text-right">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Base</span>
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-100">
                                                <td className="p-3 font-medium text-slate-700">Custo Real (AC)</td>
                                                <td className="p-3 text-right">{formatCurrency(projectReport.evmMetrics.actualCost)}</td>
                                                <td className="p-3 text-right">
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">Atual</span>
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-100">
                                                <td className="p-3 font-medium text-slate-700">Valor Agregado (EV)</td>
                                                <td className="p-3 text-right">{formatCurrency(projectReport.evmMetrics.earnedValue)}</td>
                                                <td className="p-3 text-right">
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">Realizado</span>
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-100">
                                                <td className="p-3 font-medium text-slate-700">Variação de Custo (CV)</td>
                                                <td className={`p-3 text-right ${projectReport.evmMetrics.costVariance >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {formatCurrency(projectReport.evmMetrics.costVariance)}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${projectReport.evmMetrics.costVariance >= 0
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {projectReport.evmMetrics.costVariance >= 0 ? 'Dentro' : 'Acima'}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-100">
                                                <td className="p-3 font-medium text-slate-700">Desempenho de Custo (CPI)</td>
                                                <td className={`p-3 text-right ${getHealthColor(costHealth)}`}>
                                                    {projectReport.evmMetrics.costPerformanceIndex.toFixed(2)}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${costHealth >= 0.95
                                                            ? 'bg-green-100 text-green-700'
                                                            : costHealth >= 0.85
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {getHealthText(costHealth)}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-medium text-slate-700">Estimativa Total (EAC)</td>
                                                <td className="p-3 text-right">{formatCurrency(projectReport.evmMetrics.estimateAtCompletion)}</td>
                                                <td className="p-3 text-right">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Projetado</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Schedule Tab */}
                    {activeTab === 'schedule' && (
                        <div className="p-6">
                            <div className="bg-white border border-slate-200 rounded-xl p-6">
                                <h3 className="font-bold text-slate-800 mb-4">Análise de Cronograma</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-medium text-slate-700 mb-3">Métricas de Cronograma</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm text-slate-500">Duração Total do Projeto</p>
                                                <p className="text-xl font-bold text-slate-800">
                                                    {projectReport.scheduleSummary.totalDuration} dias
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Tarefas no Caminho Crítico</p>
                                                <p className="text-xl font-bold text-slate-800">
                                                    {projectReport.scheduleSummary.criticalPathLength}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Variação de Cronograma (SV)</p>
                                                <p className={`text-xl font-bold ${projectReport.scheduleSummary.scheduleVariance >= 0
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    {projectReport.scheduleSummary.scheduleVariance.toFixed(2)} dias
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Desempenho de Cronograma (SPI)</p>
                                                <p className={`text-xl font-bold ${getHealthColor(scheduleHealth)}`}>
                                                    {projectReport.scheduleSummary.schedulePerformance}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-700 mb-3">Resumo de Status</h4>
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                            <p className="font-medium text-slate-700 mb-2">Desempenho de Cronograma</p>
                                            <p className={`text-lg font-bold ${getHealthColor(scheduleHealth)}`}>
                                                {getHealthText(scheduleHealth)}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-2">
                                                {scheduleHealth >= 1
                                                    ? 'O projeto está progredindo conforme o planejado ou adiantado.'
                                                    : scheduleHealth >= 0.85
                                                        ? 'O projeto está ligeiramente atrasado, mas dentro dos limites aceitáveis.'
                                                        : 'O projeto está significativamente atrasado e requer atenção imediata.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="text-sm text-slate-500">
                        Última atualização: {new Date().toLocaleString('pt-BR')}
                    </div>
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

export default ReportingModal;