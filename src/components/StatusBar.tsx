import React from "react";
import { useMultiProject } from "../store/multiProjectStore";
import type { ProjectStatistics } from "../types/types";
import { AlertCircle, CheckCircle2, Clock, DollarSign, Activity } from "lucide-react";

const StatusBar: React.FC = () => {
    const { calculateProjectStats } = useMultiProject();
    const stats: ProjectStatistics = calculateProjectStats();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    return (
        <div className="bg-white border-t border-slate-200 px-4 py-2 z-20 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] text-xs sm:text-sm">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                {/* Group 1: Task Status Indicators */}
                <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 lg:pb-0">
                    <div
                        className="flex items-center gap-1.5 text-slate-600 whitespace-nowrap"
                        title="Tarefas Concluídas"
                    >
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="font-medium">{stats.completedTasks}</span>
                        <span className="text-slate-400 hidden sm:inline">concluídas</span>
                    </div>

                    <div className="w-px h-4 bg-slate-200 hidden sm:block" />

                    <div
                        className="flex items-center gap-1.5 text-slate-600 whitespace-nowrap"
                        title="Tarefas em Andamento"
                    >
                        <Clock size={14} className="text-indigo-500" />
                        <span className="font-medium">{stats.inProgressTasks}</span>
                        <span className="text-slate-400 hidden sm:inline">em andamento</span>
                    </div>

                    {stats.overdueTasks > 0 && (
                        <>
                            <div className="w-px h-4 bg-slate-200 hidden sm:block" />
                            <div
                                className="flex items-center gap-1.5 text-rose-600 font-medium whitespace-nowrap animate-pulse"
                                title="Tarefas Atrasadas"
                            >
                                <AlertCircle size={14} />
                                <span>{stats.overdueTasks} atrasadas</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Group 2: Progress Bar (Center) */}
                <div className="flex items-center gap-3 w-full lg:w-1/3 justify-center">
                    <span className="text-slate-500 font-medium whitespace-nowrap hidden sm:inline">Progresso</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${stats.progressPercentage}%` }}
                        />
                    </div>
                    <span className="font-bold text-slate-700 w-9 text-right">
                        {Math.round(stats.progressPercentage)}%
                    </span>
                </div>

                {/* Group 3: Metrics (Right) */}
                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end text-slate-600">
                    {stats.budgetedCost > 0 && (
                        <div className="flex items-center gap-1.5" title="Custo Total">
                            <DollarSign size={14} className="text-slate-400" />
                            <span className="font-medium text-slate-900">{formatCurrency(stats.totalCost)}</span>
                        </div>
                    )}

                    {stats.criticalPathLength > 0 && (
                        <div
                            className="flex items-center gap-1.5 pl-4 border-l border-slate-200"
                            title="Duração do Caminho Crítico"
                        >
                            <Activity size={14} className="text-amber-500" />
                            <span className="font-medium text-slate-900">{stats.criticalPathLength} dias</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatusBar;
