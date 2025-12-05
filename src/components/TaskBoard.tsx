import React, { useState } from "react";
import { useMultiProject } from "../store/multiProjectStore";
import { TaskStatus } from "../types/types";
import type { ExtendedTask } from "../types/types";
import { MoreHorizontal } from "lucide-react";
import TaskActionBar from "./TaskActionBar";
import TaskModal from "./TaskModal";

const TaskBoard: React.FC = () => {
    const { getTasks, updateTask, getResources, getDependencies } = useMultiProject();
    const tasks = getTasks().filter(t => t.type !== 'project'); // Exclude summary tasks from board usually? Or keep them? Usually board is for leaf tasks.

    // Columns definition
    const columns = [
        { id: TaskStatus.NOT_STARTED, title: "A Fazer", color: "bg-slate-100", border: "border-slate-200" },
        { id: TaskStatus.IN_PROGRESS, title: "Em Progresso", color: "bg-indigo-50", border: "border-indigo-200" },
        { id: TaskStatus.COMPLETED, title: "Concluído", color: "bg-emerald-50", border: "border-emerald-200" },
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ExtendedTask | undefined>(undefined);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, status: any) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) {
            updateTask(taskId, { status });
        }
    };

    const handleCardClick = (task: ExtendedTask) => {
        setSelectedTaskId(selectedTaskId === task.id ? null : task.id);
    };

    const handleEditTask = (task: ExtendedTask) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSaveTask = (taskData: Partial<ExtendedTask>) => {
        if (editingTask) {
            updateTask(editingTask.id, taskData);
        }
        // Note: New task creation logic usually in App.tsx or store, here we might not have full context to create new task easily without duplication of logic from App.tsx.
        // But we can implement a simple create if needed. For now, Edit only.
    };

    return (
        <div className="h-full overflow-x-auto overflow-y-hidden bg-slate-50/50 p-6">
            <div className="flex gap-6 h-full min-w-full w-max">
                {columns.map((col) => (
                    <div
                        key={col.id}
                        className={`flex flex-col w-80 rounded-xl border ${col.border} ${col.color} bg-opacity-50`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        {/* Column Header */}
                        <div className="p-4 flex items-center justify-between border-b border-white/50">
                            <h3 className="font-bold text-slate-700">{col.title}</h3>
                            <span className="text-xs font-semibold text-slate-500 bg-white/50 px-2 py-1 rounded-full">
                                {tasks.filter(t => t.status === col.id).length}
                            </span>
                        </div>

                        {/* Task List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                            {tasks
                                .filter((task) => task.status === col.id)
                                .map((task) => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onClick={() => handleCardClick(task)}
                                        className={`
                                            bg-white p-4 rounded-lg shadow-sm border cursor-move transition-all hover:shadow-md
                                            ${selectedTaskId === task.id ? "border-indigo-500 ring-1 ring-indigo-500" : "border-slate-200"}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
                                                ${task.priority === 'high' || task.priority === 'critical' ? 'bg-rose-100 text-rose-700' :
                                                  task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}
                                            `}>
                                                {task.priority === 'critical' ? 'Crítica' :
                                                 task.priority === 'high' ? 'Alta' :
                                                 task.priority === 'medium' ? 'Média' : 'Baixa'}
                                            </span>
                                            <button
                                                className="text-slate-400 hover:text-slate-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditTask(task);
                                                }}
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
                                        <h4 className="font-semibold text-slate-800 text-sm mb-1 leading-tight">{task.name}</h4>
                                        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                {task.resources && task.resources.length > 0 && (
                                                    <div className="flex -space-x-1.5">
                                                        {task.resources.slice(0, 3).map((_, i) => (
                                                            <div key={i} className="w-5 h-5 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[8px] font-bold text-indigo-700">
                                                                {/* Ideally fetch resource name initial */}
                                                                R
                                                            </div>
                                                        ))}
                                                        {task.resources.length > 3 && (
                                                            <div className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                                                                +{task.resources.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <span>{task.progress}%</span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${task.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Footer (Add Task Button Placeholder) */}
                        {/*
                        <div className="p-3">
                            <button className="w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-white/50 rounded-lg transition-colors border border-transparent hover:border-slate-200 border-dashed flex items-center justify-center gap-2">
                                <Plus size={16} />
                                Adicionar
                            </button>
                        </div>
                        */}
                    </div>
                ))}
            </div>

            {selectedTaskId && (
                <TaskActionBar
                    task={tasks.find(t => t.id === selectedTaskId)!}
                    onClose={() => setSelectedTaskId(null)}
                    onEdit={() => {
                        const task = tasks.find(t => t.id === selectedTaskId);
                        if (task) handleEditTask(task);
                    }}
                />
            )}

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                task={editingTask}
                resources={getResources()}
                allTasks={getTasks()}
                dependencies={getDependencies()}
            />
        </div>
    );
};

export default TaskBoard;
