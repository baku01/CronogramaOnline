import React, { useState, useRef, useEffect } from "react";
import {
    ChevronDown,
    Plus,
    Copy,
    Trash2,
    FolderOpen,
    Check,
    X,
    Edit2,
} from "lucide-react";
import { useMultiProject } from "../store/multiProjectStore";
import type { Project } from "../types/types";

interface ProjectSwitcherProps {
    className?: string;
}

export const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({ className = "" }) => {
    const {
        projects,
        activeProject,
        activeProjectId,
        createProject,
        switchProject,
        deleteProject,
        duplicateProject,
        updateProject,
    } = useMultiProject();

    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsCreating(false);
                setEditingProjectId(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus input when creating/editing
    useEffect(() => {
        if ((isCreating || editingProjectId) && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCreating, editingProjectId]);

    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            createProject(newProjectName.trim());
            setNewProjectName("");
            setIsCreating(false);
        }
    };

    const handleDuplicate = (project: Project, e: React.MouseEvent) => {
        e.stopPropagation();
        duplicateProject(project.id, `${project.name} (Cópia)`);
    };

    const handleDelete = (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (projects.length <= 1) {
            alert("Não é possível excluir o único cronograma.");
            return;
        }
        if (confirm("Tem certeza que deseja excluir este cronograma?")) {
            deleteProject(projectId);
        }
    };

    const handleStartEdit = (project: Project, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingProjectId(project.id);
        setEditingName(project.name);
    };

    const handleSaveEdit = () => {
        if (editingProjectId && editingName.trim()) {
            updateProject(editingProjectId, { name: editingName.trim() });
            setEditingProjectId(null);
            setEditingName("");
        }
    };

    const handleCancelEdit = () => {
        setEditingProjectId(null);
        setEditingName("");
    };

    const handleKeyDown = (e: React.KeyboardEvent, action: "create" | "edit") => {
        if (e.key === "Enter") {
            if (action === "create") handleCreateProject();
            else handleSaveEdit();
        } else if (e.key === "Escape") {
            if (action === "create") {
                setIsCreating(false);
                setNewProjectName("");
            } else {
                handleCancelEdit();
            }
        }
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 group"
            >
                <FolderOpen size={18} className="text-indigo-600" />
                <span className="text-sm font-medium text-slate-700 max-w-[150px] truncate">
                    {activeProject?.name || "Selecionar Cronograma"}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800">Cronogramas</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {projects.length} cronograma{projects.length !== 1 ? "s" : ""} disponível{projects.length !== 1 ? "is" : ""}
                        </p>
                    </div>

                    {/* Project List */}
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {Array.from(new Map(projects.map(p => [p.id, p])).values()).map((project) => (
                            <div
                                key={project.id}
                                className={`
                                    group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                                    ${activeProjectId === project.id
                                        ? "bg-indigo-50 border-l-4 border-indigo-500"
                                        : "hover:bg-slate-50 border-l-4 border-transparent"
                                    }
                                `}
                                onClick={() => {
                                    if (!editingProjectId) {
                                        switchProject(project.id);
                                        setIsOpen(false);
                                    }
                                }}
                            >
                                {editingProjectId === project.id ? (
                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, "edit")}
                                            className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSaveEdit();
                                            }}
                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCancelEdit();
                                            }}
                                            className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">
                                                {project.name}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {project.tasks?.length || 0} tarefa{(project.tasks?.length || 0) !== 1 ? "s" : ""}
                                            </p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleStartEdit(project, e)}
                                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Renomear"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDuplicate(project, e)}
                                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Duplicar"
                                            >
                                                <Copy size={14} />
                                            </button>
                                            {projects.length > 1 && (
                                                <button
                                                    onClick={(e) => handleDelete(project.id, e)}
                                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Create New Project */}
                    <div className="border-t border-slate-200 p-3">
                        {isCreating ? (
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, "create")}
                                    placeholder="Nome do cronograma..."
                                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleCreateProject}
                                    disabled={!newProjectName.trim()}
                                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewProjectName("");
                                    }}
                                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                                <Plus size={18} />
                                Novo Cronograma
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectSwitcher;
