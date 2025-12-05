import React, { useState } from "react";
import { useMultiProject } from "../store/multiProjectStore";
import type { ExtendedTask } from "../types/types";
import { format } from "date-fns";
import { Edit2, MoreHorizontal, Link, User, DollarSign } from "lucide-react";
import { Button } from "./ui/Button";
import { generateWBS } from "../utils/wbsGenerator";

interface TaskSheetViewProps {
    onEditTask: (task: ExtendedTask) => void;
}

const TaskSheetView: React.FC<TaskSheetViewProps> = ({ onEditTask }) => {
    const { getTasks, getResources, getDependencies } = useMultiProject();
    const tasks = getTasks();
    const resources = getResources();
    const dependencies = getDependencies();

    const [searchQuery, setSearchQuery] = useState("");

    const filteredTasks = tasks.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const wbsMap = generateWBS(tasks);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getResourceNames = (task: ExtendedTask) => {
        if (!task.resources || task.resources.length === 0) return "-";
        return task.resources.map(tr => {
            const r = resources.find(res => res.id === tr.resourceId);
            return r ? `${r.name} (${tr.allocation}%)` : "Desconhecido";
        }).join(", ");
    };

    const getPredecessors = (task: ExtendedTask) => {
        const preds = dependencies.filter(d => d.toTaskId === task.id);
        if (preds.length === 0) return "-";
        // Map to task indices or IDs. Using Names for clarity.
        // Or finding the index in the list.
        return preds.map(p => {
            const predTask = tasks.find(t => t.id === p.fromTaskId);
            const index = tasks.findIndex(t => t.id === p.fromTaskId) + 1;
            return index > 0 ? index.toString() : "?";
        }).join(", ");
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">Planilha de Tarefas</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Filtrar tarefas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-4 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 border-b border-r border-slate-200 w-12 text-center">ID</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 w-8">
                                <div className="sr-only">Ícone</div>
                            </th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 min-w-[200px]">Nome da Tarefa</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 w-24">Duração</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 w-32">Início</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 w-32">Término</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 w-24 text-center">Pred.</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 min-w-[150px]">Recursos</th>
                            <th className="px-4 py-3 border-b border-slate-200 w-32 text-right">Custo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredTasks.map((task, index) => (
                            <tr
                                key={task.id}
                                className={`hover:bg-indigo-50/50 transition-colors group cursor-pointer ${task.type === 'project' ? 'bg-slate-50 font-semibold' : ''}`}
                                onClick={() => onEditTask(task)}
                            >
                                <td className="px-4 py-2 border-r border-slate-100 text-center text-slate-500 text-xs font-mono">
                                    {wbsMap.get(task.id) || index + 1}
                                </td>
                                <td className="px-2 py-2 border-r border-slate-100 text-center">
                                    {task.type === 'milestone' && <div className="w-3 h-3 rotate-45 bg-emerald-500 mx-auto" />}
                                    {task.type === 'project' && <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-600 mx-auto" />}
                                    {task.type === 'task' && <div className="w-4 h-2 bg-indigo-500 rounded-sm mx-auto" />}
                                </td>
                                <td className="px-4 py-2 border-r border-slate-100">
                                    <div className="flex items-center gap-2">
                                        {/* Simple indentation */}
                                        {task.project && <div className="w-4" />}
                                        <span className={`${task.type === 'project' ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {task.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-2 border-r border-slate-100 text-slate-600">
                                    {task.duration} dias
                                </td>
                                <td className="px-4 py-2 border-r border-slate-100 text-slate-600">
                                    {format(new Date(task.start), "dd/MM/yyyy")}
                                </td>
                                <td className="px-4 py-2 border-r border-slate-100 text-slate-600">
                                    {format(new Date(task.end), "dd/MM/yyyy")}
                                </td>
                                <td className="px-4 py-2 border-r border-slate-100 text-center text-slate-600">
                                    {getPredecessors(task)}
                                </td>
                                <td className="px-4 py-2 border-r border-slate-100 text-slate-600 truncate max-w-xs" title={getResourceNames(task)}>
                                    {getResourceNames(task)}
                                </td>
                                <td className="px-4 py-2 text-right font-mono text-slate-600">
                                    {formatCurrency(task.cost || 0)}
                                </td>
                            </tr>
                        ))}
                        {filteredTasks.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                                    Nenhuma tarefa encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TaskSheetView;
