import React from 'react';
import { 
    Edit2, 
    Trash2, 
    ArrowRight, 
    ArrowLeft, 
    ArrowUp, 
    ArrowDown, 
    X,
    Flag,
    CheckSquare
} from 'lucide-react';
import type { ExtendedTask } from '../types/types';
import { useMultiProject } from '../store/multiProjectStore';
import { Button } from './ui/Button';

interface TaskActionBarProps {
    task: ExtendedTask;
    onClose: () => void;
    onEdit: () => void;
}

const TaskActionBar: React.FC<TaskActionBarProps> = ({ task, onClose, onEdit }) => {
    const { 
        deleteTask, 
        indentTask, 
        outdentTask, 
        moveTaskUp, 
        moveTaskDown,
        updateTask
    } = useMultiProject();

    const handleDelete = () => {
        if (confirm(`Tem certeza que deseja excluir a tarefa "${task.name}"?`)) {
            deleteTask(task.id);
            onClose();
        }
    };

    const handleToggleMilestone = () => {
        const newType = task.type === 'milestone' ? 'task' : 'milestone';
        updateTask(task.id, { type: newType });
    };

    return (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 flex items-center gap-2 z-40 animate-in slide-in-from-bottom-4 duration-200 max-w-[90vw] overflow-x-auto">
            <div className="flex items-center gap-3 px-3 border-r border-slate-100 mr-1">
                <div className={`w-3 h-3 rounded-full ${
                    task.type === 'project' ? 'bg-slate-500' :
                    task.type === 'milestone' ? 'bg-emerald-500' :
                    'bg-indigo-500'
                }`} />
                <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-medium uppercase">Selecionado</span>
                    <span className="text-sm font-bold text-slate-800 max-w-[150px] truncate">{task.name}</span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <Button onClick={onEdit} variant="ghost" size="icon" title="Editar">
                    <Edit2 size={18} />
                </Button>
                
                <div className="w-px h-8 bg-slate-100 mx-1" />

                <Button onClick={() => indentTask(task.id)} variant="ghost" size="icon" title="Indentar (Tornar Subtarefa)">
                    <ArrowRight size={18} />
                </Button>
                <Button onClick={() => outdentTask(task.id)} variant="ghost" size="icon" title="Desindentar">
                    <ArrowLeft size={18} />
                </Button>

                <div className="w-px h-8 bg-slate-100 mx-1" />

                <Button onClick={() => moveTaskUp(task.id)} variant="ghost" size="icon" title="Mover para Cima">
                    <ArrowUp size={18} />
                </Button>
                <Button onClick={() => moveTaskDown(task.id)} variant="ghost" size="icon" title="Mover para Baixo">
                    <ArrowDown size={18} />
                </Button>

                <div className="w-px h-8 bg-slate-100 mx-1" />

                <Button onClick={handleToggleMilestone} variant="ghost" size="icon" title={task.type === 'milestone' ? "Converter para Tarefa" : "Converter para Marco"}>
                    {task.type === 'milestone' ? <CheckSquare size={18} /> : <Flag size={18} />}
                </Button>
                
                <div className="w-px h-8 bg-slate-100 mx-1" />

                <Button onClick={handleDelete} variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600" title="Excluir">
                    <Trash2 size={18} />
                </Button>
            </div>

            <button 
                onClick={onClose}
                className="ml-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default TaskActionBar;
