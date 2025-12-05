import React, { useEffect, useRef } from 'react';
import { 
    Edit2, 
    Trash2, 
    ArrowRight, 
    ArrowLeft, 
    ArrowUp, 
    ArrowDown, 
    Flag,
    CheckSquare
} from 'lucide-react';
import type { ExtendedTask } from '../types/types';
import { useMultiProject } from '../store/multiProjectStore';

interface TaskContextMenuProps {
    x: number;
    y: number;
    task: ExtendedTask;
    onClose: () => void;
    onEdit: () => void;
}

const TaskContextMenu: React.FC<TaskContextMenuProps> = ({ 
    x, 
    y, 
    task, 
    onClose, 
    onEdit 
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const { 
        deleteTask, 
        indentTask, 
        outdentTask, 
        moveTaskUp, 
        moveTaskDown,
        updateTask
    } = useMultiProject();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Adjust position if it goes off screen
    const style = {
        top: y,
        left: x,
    };

    const handleDelete = () => {
        if (confirm(`Tem certeza que deseja excluir a tarefa "${task.name}"?`)) {
            deleteTask(task.id);
            onClose();
        }
    };

    const handleToggleMilestone = () => {
        const newType = task.type === 'milestone' ? 'task' : 'milestone';
        updateTask(task.id, { type: newType });
        onClose();
    };

    return (
        <div 
            ref={menuRef}
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 w-56 animate-in fade-in zoom-in-95 duration-100"
            style={style}
        >
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-medium text-slate-500 truncate">{task.name}</p>
            </div>

            <button 
                onClick={() => { onEdit(); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
            >
                <Edit2 size={14} />
                Editar
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button 
                onClick={() => { indentTask(task.id); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
                <ArrowRight size={14} />
                Indentar (Subtarefa)
            </button>

            <button 
                onClick={() => { outdentTask(task.id); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
                <ArrowLeft size={14} />
                Desindentar
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button 
                onClick={() => { moveTaskUp(task.id); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
                <ArrowUp size={14} />
                Mover para Cima
            </button>

            <button 
                onClick={() => { moveTaskDown(task.id); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
                <ArrowDown size={14} />
                Mover para Baixo
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button 
                onClick={handleToggleMilestone}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
                {task.type === 'milestone' ? <CheckSquare size={14} /> : <Flag size={14} />}
                {task.type === 'milestone' ? 'Converter para Tarefa' : 'Converter para Marco'}
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button 
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
                <Trash2 size={14} />
                Excluir
            </button>
        </div>
    );
};

export default TaskContextMenu;
