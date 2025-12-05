import React, { useState, useEffect } from "react";
import { ViewMode } from "gantt-task-react";
import { MultiProjectProvider, useMultiProject } from "./store/multiProjectStore";
import GanttView from "./components/GanttView";
import Toolbar from "./components/Toolbar";
import StatusBar from "./components/StatusBar";
import Dashboard from "./components/Dashboard";
import { MainLayout } from "./components/layout/MainLayout";
import { downloadProjectAsJSON, downloadTasksAsCSV } from "./utils/dataImportExport";
import { generateRecurringTasks } from "./utils/recurrence";
import TaskModal from "./components/TaskModal";
import AnalyticsView from "./components/AnalyticsView";
import ResourcesView from "./components/ResourcesView";
import ReportsView from "./components/ReportsView";
import SettingsView from "./components/SettingsView";
import PertDiagram from "./components/PertDiagram";
import CalendarView from "./components/CalendarView";
import ProjectSwitcher from "./components/ProjectSwitcher";
import TaskBoard from "./components/TaskBoard";
import TaskSheetView from "./components/TaskSheetView";
import TimelineView from "./components/TimelineView";
import type { ExtendedTask } from "./types/types";
import { DependencyType } from "./types/types";

const AppContent: React.FC = () => {
    const {
        activeProject: project,
        projects,
        saveToLocalStorage,
        importProject,
        getTasks,
        getDependencies,
        getResources,
        addTask,
        updateTask,
        recalculateDates,
        addDependency,
        removeDependency,
        undo,
        redo,
    } = useMultiProject();

    // Keyboard shortcuts for Undo/Redo
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check for Ctrl+Z (Undo)
            if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undo();
            }
            // Check for Ctrl+Y or Ctrl+Shift+Z (Redo)
            if (
                ((event.ctrlKey || event.metaKey) && event.key === 'y') ||
                ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')
            ) {
                event.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [undo, redo]);

    const [activeTab, setActiveTab] = useState("gantt");
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);
    const [showCriticalPath, setShowCriticalPath] = useState(false);
    const [showBaseline, setShowBaseline] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ExtendedTask | undefined>(undefined);

    // Recalculate dates when project changes
    useEffect(() => {
        if (project && project.tasks.length > 0) {
            const timer = setTimeout(() => recalculateDates(), 100);
            return () => clearTimeout(timer);
        }
    }, [project, recalculateDates]);

    const handleAddTask = () => {
        setEditingTask(undefined);
        setIsModalOpen(true);
    };

    const handleEditTask = (task: ExtendedTask) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSaveTask = (taskData: Partial<ExtendedTask> & { _dependencies?: Array<{ id: string; fromTaskId: string; toTaskId: string; type: DependencyType }> }) => {
        // Extract dependencies from taskData
        const dependencies = taskData._dependencies || [];
        const taskId = editingTask?.id || `Task-${Date.now()}`;

        if (editingTask) {
            // Update task
            updateTask(editingTask.id, taskData);

            // Update dependencies
            // First, remove all existing dependencies for this task
            const existingDeps = getDependencies().filter(dep => dep.toTaskId === editingTask.id);
            existingDeps.forEach(dep => removeDependency(dep.id));

            // Add new dependencies
            dependencies.forEach((dep) => {
                addDependency({
                    ...dep,
                    toTaskId: editingTask.id,
                });
            });
        } else {
            const currentDate = new Date();
            const newTask: ExtendedTask = {
                name: "Nova Tarefa",
                ...taskData,
                id: taskId,
                type: "task",
                displayOrder: getTasks().length + 1,
                // Default values if not provided by modal
                start:
                    taskData.start ||
                    new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
                end:
                    taskData.end ||
                    new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1),
                progress: taskData.progress || 0,
                status: taskData.status || "not_started",
                priority: taskData.priority || "medium",
            } as ExtendedTask;

            if (newTask.isRecurring) {
                const generatedTasks = generateRecurringTasks(newTask);
                generatedTasks.forEach(t => addTask(t));
                // Dependencies logic needs to handle multiple tasks or just the summary.
                // Assuming dependencies apply to the summary task (first in list).
                const summaryTaskId = generatedTasks[0].id;
                dependencies.forEach((dep) => {
                    addDependency({
                        ...dep,
                        toTaskId: summaryTaskId,
                    });
                });
            } else {
                addTask(newTask);
                // Add dependencies for new task
                dependencies.forEach((dep) => {
                    addDependency({
                        ...dep,
                        toTaskId: taskId,
                    });
                });
            }
        }
        setTimeout(() => recalculateDates(), 100);
    };

    const handleSave = () => {
        saveToLocalStorage();
        alert("Projeto salvo com sucesso!");
    };

    const handleExport = () => {
        if (!project) return;

        const choice = window.confirm("Exportar como JSON?\n\nOK = JSON\nCancelar = CSV");

        if (choice) {
            downloadProjectAsJSON(project);
        } else {
            const tasks = getTasks();
            const dependencies = getDependencies();
            const resources = getResources();
            downloadTasksAsCSV(tasks, dependencies, resources, project.name, {
                format: "csv",
                includeResources: true,
                includeDependencies: true,
                includeNotes: true,
            });
        }
    };

    const handleImport = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                const success = importProject(content);

                if (success) {
                    alert("Projeto importado com sucesso!");
                    setTimeout(() => recalculateDates(), 500);
                } else {
                    alert("Erro ao importar projeto. Verifique se o arquivo é válido.");
                }
            };

            reader.readAsText(file);
        };

        input.click();
    };

    if (!project) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 text-lg font-medium">Carregando projeto...</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case "gantt":
                return (
                    <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in flex flex-col">
                        <div className="flex-1 overflow-hidden relative">
                            <GanttView
                                viewMode={viewMode}
                                showCriticalPath={showCriticalPath}
                                searchQuery={searchQuery}
                                onEditTask={handleEditTask}
                            />
                        </div>
                    </div>
                );
            case "board":
                return (
                    <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in flex flex-col">
                        <div className="flex-1 overflow-hidden relative">
                            <TaskBoard />
                        </div>
                    </div>
                );
            case "dashboard":
                return <Dashboard />;
            case "resources":
                return <ResourcesView />;
            case "reports":
                return <ReportsView />;
            case "settings":
                return <SettingsView />;
            case "analytics":
                return <AnalyticsView />;
            case "pert":
                return (
                    <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in flex flex-col">
                        <div className="flex-1 overflow-hidden relative">
                            <PertDiagram
                                tasks={getTasks()}
                                dependencies={getDependencies()}
                                onTaskClick={handleEditTask}
                                showCriticalPath={showCriticalPath}
                            />
                        </div>
                    </div>
                );
            case "calendar":
                return (
                    <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in flex flex-col">
                        <div className="flex-1 overflow-hidden relative">
                            <CalendarView
                                onTaskClick={handleEditTask}
                            />
                        </div>
                    </div>
                );
            case "timeline":
                return (
                    <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in flex flex-col">
                        <div className="flex-1 overflow-hidden relative">
                            <TimelineView />
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-white rounded-2xl border border-slate-200">
                        <div className="text-lg font-medium mb-2">Em Desenvolvimento</div>
                        <p>O módulo {activeTab} estará disponível em breve.</p>
                    </div>
                );
        }
    };

    return (
        <MainLayout
            activeTab={activeTab}
            onTabChange={setActiveTab}
            projectName={project.name}
            projectDescription={project.description}
            projectSwitcher={<ProjectSwitcher />}
            toolbar={
                activeTab === "gantt" ? (
                    <Toolbar
                        onAddTask={handleAddTask}
                        onSave={handleSave}
                        onExport={handleExport}
                        onImport={handleImport}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        onShowCriticalPath={setShowCriticalPath}
                        showCriticalPath={showCriticalPath}
                        onShowBaseline={setShowBaseline}
                        showBaseline={showBaseline}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />
                ) : null
            }
            statusBar={<StatusBar />}
        >
            {renderContent()}

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                task={editingTask}
                resources={getResources()}
                allTasks={getTasks()}
                dependencies={getDependencies()}
            />
        </MainLayout>
    );
};

function App() {
    return (
        <MultiProjectProvider>
            <AppContent />
        </MultiProjectProvider>
    );
}

export default App;
