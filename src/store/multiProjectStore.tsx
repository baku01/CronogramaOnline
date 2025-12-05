import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { mockProject } from "../data/mockData";
import { TaskStatus } from "../types/types";
import type { Project, ExtendedTask, TaskDependency, Resource, ProjectStatistics, ProjectCalendar, TaskBaseline, CustomField, ProjectScenario } from "../types/types";
import {
    calculateCriticalPath,
    calculateSlack,
    calculateForwardPass,
    calculateBackwardPass,
} from "../utils/dateCalculations";
import { validateNewDependency } from "../utils/validators";
import { importFromJSON, exportToJSON } from "../utils/dataImportExport";
import { performResourceLeveling } from "../utils/resourceLeveling";
import { createDefaultCalendar } from "../utils/calendarCalculations";
import { updateTaskCosts, calculateProjectCost } from "../utils/costCalculations";

interface MultiProjectContextType {
    // Project management
    projects: Project[];
    activeProjectId: string | null;
    activeProject: Project | null;

    // Project operations
    createProject: (name: string, description?: string) => Project;
    switchProject: (projectId: string) => boolean;
    updateProject: (projectId: string, updates: Partial<Project>) => void;
    deleteProject: (projectId: string) => void;
    duplicateProject: (projectId: string, newName: string) => Project | null;
    consolidateProjects: (projectIds: string[], name: string) => Project | null;

    // Task operations
    addTask: (task: ExtendedTask) => void;
    updateTask: (taskId: string, updates: Partial<ExtendedTask>) => void;
    deleteTask: (taskId: string) => void;
    indentTask: (taskId: string) => void;
    outdentTask: (taskId: string) => void;
    moveTaskUp: (taskId: string) => void;
    moveTaskDown: (taskId: string) => void;
    getTasks: () => ExtendedTask[];
    getTaskById: (taskId: string) => ExtendedTask | undefined;

    // Dependency operations
    addDependency: (dependency: TaskDependency) => boolean;
    removeDependency: (dependencyId: string) => void;
    getDependencies: () => TaskDependency[];
    getTaskDependencies: (taskId: string) => TaskDependency[];

    // Resource operations
    addResource: (resource: Resource) => void;
    updateResource: (resourceId: string, updates: Partial<Resource>) => void;
    deleteResource: (resourceId: string) => void;
    getResources: () => Resource[];
    levelResources: () => void;

    // Calendar operations
    addCalendar: (calendar: ProjectCalendar) => void;
    updateCalendar: (calendarId: string, updates: Partial<ProjectCalendar>) => void;
    deleteCalendar: (calendarId: string) => void;
    getCalendars: () => ProjectCalendar[];
    setDefaultCalendar: (calendarId: string) => void;
    updateAllCalendars: (calendars: ProjectCalendar[]) => void;

    // Baseline operations
    saveBaseline: (name: string, description?: string) => void;
    getBaselines: () => TaskBaseline[];
    deleteBaseline: (baselineId: string) => void;
    applyBaseline: (baselineId: string) => void;

    // Scenario operations
    createScenario: (name: string, description?: string) => void;
    activateScenario: (scenarioId: string) => void;
    deactivateScenario: () => void;
    deleteScenario: (scenarioId: string) => void;
    getScenarios: () => ProjectScenario[];

    // Custom field operations
    addCustomField: (field: CustomField) => void;
    updateCustomField: (fieldId: string, updates: Partial<CustomField>) => void;
    deleteCustomField: (fieldId: string) => void;
    getCustomFields: () => CustomField[];
    setCustomFieldValue: (taskId: string, fieldId: string, value: any) => void;

    // Calculations
    recalculateDates: () => void;
    calculateProjectStats: () => ProjectStatistics;
    recalculateCosts: () => void;

    // Import/Export
    exportProject: (projectId?: string) => string;
    importProject: (jsonString: string, name?: string) => boolean;
    exportAllProjects: () => string;
    importAllProjects: (jsonString: string) => boolean;

    // LocalStorage persistence
    saveToLocalStorage: () => void;
    loadFromLocalStorage: () => boolean;

    // History operations
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const MultiProjectContext = createContext<MultiProjectContextType | undefined>(undefined);

const STORAGE_KEY = "cronograma_projects";

// Maximum history stack size
const MAX_HISTORY = 50;

export const MultiProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    
    // History state
    const [past, setPast] = useState<{ projects: Project[]; activeProjectId: string | null }[]>([]);
    const [future, setFuture] = useState<{ projects: Project[]; activeProjectId: string | null }[]>([]);

    // Ref to track initialization to prevent double execution in StrictMode
    const initialized = useRef(false);

    const activeProject = projects.find(p => p.id === activeProjectId) || null;

    // Helper to save state to history
    const pushToHistory = useCallback(() => {
        setPast(prev => {
            const newPast = [...prev, { projects, activeProjectId }];
            if (newPast.length > MAX_HISTORY) {
                return newPast.slice(newPast.length - MAX_HISTORY);
            }
            return newPast;
        });
        setFuture([]); // Clear future when a new action occurs
    }, [projects, activeProjectId]);

    const undo = useCallback(() => {
        if (past.length === 0) return;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        setFuture(prev => [{ projects, activeProjectId }, ...prev]);
        setProjects(previous.projects);
        setActiveProjectId(previous.activeProjectId);
        setPast(newPast);
    }, [past, projects, activeProjectId]);

    const redo = useCallback(() => {
        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);

        setPast(prev => [...prev, { projects, activeProjectId }]);
        setProjects(next.projects);
        setActiveProjectId(next.activeProjectId);
        setFuture(newFuture);
    }, [future, projects, activeProjectId]);

    // Helper functions
    const getActiveProject = useCallback(() => {
        return projects.find(p => p.id === activeProjectId) || null;
    }, [projects, activeProjectId]);

    const updateActiveProject = useCallback((updates: Partial<Project>) => {
        if (!activeProjectId) return;

        pushToHistory(); // Save state before update

        setProjects(prev => prev.map(project =>
            project.id === activeProjectId
                ? { ...project, ...updates, updatedAt: new Date() }
                : project
        ));
    }, [activeProjectId, pushToHistory]);

    // Project management
    const createProject = useCallback((name: string, description?: string): Project => {
        pushToHistory();
        const newProject: Project = {
            id: `PROJ-${Date.now()}`,
            name,
            description,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            status: TaskStatus.NOT_STARTED,
            progress: 0,
            tasks: [],
            dependencies: [],
            resources: [],
            calendars: [createDefaultCalendar()],
            baselines: [],
            scenarios: [],
            customFields: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        setProjects(prev => [...prev, newProject]);
        setActiveProjectId(newProject.id);
        return newProject;
    }, [pushToHistory]);

    const switchProject = useCallback((projectId: string): boolean => {
        const projectExists = projects.some(p => p.id === projectId);
        if (projectExists) {
            // Optional: Push to history on switch? 
            // Usually undoing a switch is annoying if it doesn't change data.
            // But since we store activeProjectId in history, we might as well.
            // However, if we just view, we don't want to clutter history.
            // Let's NOT push to history on switch, only on data change.
            setActiveProjectId(projectId);
            return true;
        }
        return false;
    }, [projects]);

    const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
        pushToHistory();
        setProjects(prev => prev.map(project =>
            project.id === projectId
                ? { ...project, ...updates, updatedAt: new Date() }
                : project
        ));
    }, [pushToHistory]);

    const deleteProject = useCallback((projectId: string) => {
        if (projects.length <= 1) {
            alert("Não é possível excluir o último projeto.");
            return;
        }

        pushToHistory();
        setProjects(prev => {
            const filtered = prev.filter(p => p.id !== projectId);
            if (activeProjectId === projectId && filtered.length > 0) {
                setActiveProjectId(filtered[0].id);
            } else if (filtered.length === 0) {
                setActiveProjectId(null);
            }
            return filtered;
        });
    }, [projects, activeProjectId, pushToHistory]);

    const duplicateProject = useCallback((projectId: string, newName: string): Project | null => {
        const projectToDuplicate = projects.find(p => p.id === projectId);
        if (!projectToDuplicate) return null;

        pushToHistory();
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 10000);
        const duplicated: Project = {
            ...JSON.parse(JSON.stringify(projectToDuplicate)),
            id: `PROJ-${timestamp}-${randomSuffix}`,
            name: newName,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Update task IDs to avoid conflicts
        duplicated.tasks = duplicated.tasks.map((task, index) => ({
            ...task,
            id: `${task.id}-COPY-${timestamp}-${index}`,
        }));

        // Update dependency IDs
        duplicated.dependencies = duplicated.dependencies.map((dep, index) => ({
            ...dep,
            id: `${dep.id}-COPY-${timestamp}-${index}`,
            fromTaskId: `${dep.fromTaskId}-COPY-${timestamp}-${duplicated.tasks.findIndex(t => t.id.startsWith(dep.fromTaskId))}`, // This is tricky, let's simplify
        }));
        
        // Re-map dependencies correctly
        const idMap = new Map<string, string>();
        projectToDuplicate.tasks.forEach((task, index) => {
             idMap.set(task.id, duplicated.tasks[index].id);
        });

        duplicated.dependencies = projectToDuplicate.dependencies.map(dep => ({
            ...dep,
            id: `DEP-${timestamp}-${Math.floor(Math.random() * 10000)}`,
            fromTaskId: idMap.get(dep.fromTaskId) || dep.fromTaskId,
            toTaskId: idMap.get(dep.toTaskId) || dep.toTaskId,
        }));

        // Update resource IDs
        duplicated.resources = duplicated.resources.map((resource, index) => ({
            ...resource,
            id: `${resource.id}-COPY-${timestamp}-${index}`,
        }));

        setProjects(prev => [...prev, duplicated]);
        return duplicated;
    }, [projects, pushToHistory]);

    const consolidateProjects = useCallback((projectIds: string[], name: string): Project | null => {
        const projectsToConsolidate = projects.filter(p => projectIds.includes(p.id));
        if (projectsToConsolidate.length === 0) return null;

        pushToHistory();
        const consolidated: Project = {
            id: `PROJ-CONSOLIDATED-${Date.now()}`,
            name,
            description: `Consolidação de ${projectsToConsolidate.length} projetos`,
            startDate: new Date(Math.min(...projectsToConsolidate.map(p => p.startDate.getTime()))),
            endDate: new Date(Math.max(...projectsToConsolidate.map(p => p.endDate.getTime()))),
            status: TaskStatus.NOT_STARTED,
            progress: 0,
            tasks: [],
            dependencies: [],
            resources: [],
            calendars: [createDefaultCalendar()],
            baselines: [],
            scenarios: [],
            customFields: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Consolidate tasks with unique IDs
        let taskCounter = 0;
        projectsToConsolidate.forEach(project => {
            project.tasks.forEach(task => {
                const newTaskId = `TASK-CONS-${taskCounter++}`;
                consolidated.tasks.push({
                    ...task,
                    id: newTaskId,
                    name: `[${project.name}] ${task.name}`,
                });
            });
        });

        // Consolidate resources with unique IDs
        let resourceCounter = 0;
        projectsToConsolidate.forEach(project => {
            project.resources.forEach(resource => {
                const newResourceId = `RES-CONS-${resourceCounter++}`;
                consolidated.resources.push({
                    ...resource,
                    id: newResourceId,
                    name: `[${project.name}] ${resource.name}`,
                });
            });
        });

        setProjects(prev => [...prev, consolidated]);
        setActiveProjectId(consolidated.id);
        return consolidated;
    }, [projects, pushToHistory]);

    // Task operations (operate on active project)
    const addTask = useCallback((task: ExtendedTask) => {
        const project = getActiveProject();
        if (!project) return;

        updateActiveProject({
            tasks: [...project.tasks, task],
        });
    }, [getActiveProject, updateActiveProject]);

    const updateTask = useCallback((taskId: string, updates: Partial<ExtendedTask>) => {
        const project = getActiveProject();
        if (!project) return;

        updateActiveProject({
            tasks: project.tasks.map(task =>
                task.id === taskId ? { ...task, ...updates } : task
            ),
        });
    }, [getActiveProject, updateActiveProject]);

    const deleteTask = useCallback((taskId: string) => {
        const project = getActiveProject();
        if (!project) return;

        updateActiveProject({
            tasks: project.tasks.filter(task => task.id !== taskId),
            dependencies: project.dependencies.filter(
                dep => dep.fromTaskId !== taskId && dep.toTaskId !== taskId
            ),
        });
    }, [getActiveProject, updateActiveProject]);

    const indentTask = useCallback((taskId: string) => {
        const project = getActiveProject();
        if (!project) return;

        const tasks = [...project.tasks].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex <= 0) return;

        const prevTask = tasks[taskIndex - 1];
        
        // If previous task is already the parent, we can't indent (unless we want to skip levels, which is bad practice)
        if (tasks[taskIndex].project === prevTask.id) return;

        updateTask(taskId, {
            project: prevTask.id
        });
    }, [getActiveProject, updateTask]);

    const outdentTask = useCallback((taskId: string) => {
        const project = getActiveProject();
        if (!project) return;
        
        const task = project.tasks.find(t => t.id === taskId);
        if (!task || !task.project) return;
        
        const parent = project.tasks.find(t => t.id === task.project);
        const newParentId = parent ? parent.project : undefined;
        
        updateTask(taskId, {
            project: newParentId
        });
    }, [getActiveProject, updateTask]);

    const moveTaskUp = useCallback((taskId: string) => {
        const project = getActiveProject();
        if (!project) return;

        const tasks = [...project.tasks].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        const index = tasks.findIndex(t => t.id === taskId);
        
        if (index <= 0) return;
        
        const task = tasks[index];
        const prevTask = tasks[index - 1];
        
        const taskOrder = task.displayOrder || 0;
        const prevOrder = prevTask.displayOrder || 0;
        
        const newTasks = project.tasks.map(t => {
            if (t.id === task.id) return { ...t, displayOrder: prevOrder };
            if (t.id === prevTask.id) return { ...t, displayOrder: taskOrder };
            return t;
        });
        
        updateActiveProject({ tasks: newTasks });
    }, [getActiveProject, updateActiveProject]);

    const moveTaskDown = useCallback((taskId: string) => {
        const project = getActiveProject();
        if (!project) return;

        const tasks = [...project.tasks].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        const index = tasks.findIndex(t => t.id === taskId);
        
        if (index === -1 || index === tasks.length - 1) return;
        
        const task = tasks[index];
        const nextTask = tasks[index + 1];
        
        const taskOrder = task.displayOrder || 0;
        const nextOrder = nextTask.displayOrder || 0;
        
        const newTasks = project.tasks.map(t => {
            if (t.id === task.id) return { ...t, displayOrder: nextOrder };
            if (t.id === nextTask.id) return { ...t, displayOrder: taskOrder };
            return t;
        });
        
        updateActiveProject({ tasks: newTasks });
    }, [getActiveProject, updateActiveProject]);

    const getTasks = useCallback(() => {
        return getActiveProject()?.tasks || [];
    }, [getActiveProject]);

    const getTaskById = useCallback((taskId: string) => {
        return getActiveProject()?.tasks.find(t => t.id === taskId);
    }, [getActiveProject]);

    // Dependency operations
    const addDependency = useCallback((dependency: TaskDependency): boolean => {
        const project = getActiveProject();
        if (!project) return false;

        // Validate dependency
        const validation = validateNewDependency(dependency, project.tasks, project.dependencies);
        if (!validation.valid) {
            console.error("Invalid dependency:", validation.errors);
            return false;
        }

        updateActiveProject({
            dependencies: [...project.dependencies, dependency],
        });
        return true;
    }, [getActiveProject, updateActiveProject]);

    const removeDependency = useCallback((dependencyId: string) => {
        const project = getActiveProject();
        if (!project) return;

        updateActiveProject({
            dependencies: project.dependencies.filter(dep => dep.id !== dependencyId),
        });
    }, [getActiveProject, updateActiveProject]);

    const getDependencies = useCallback(() => {
        return getActiveProject()?.dependencies || [];
    }, [getActiveProject]);

    const getTaskDependencies = useCallback((taskId: string) => {
        return getActiveProject()?.dependencies.filter(dep => dep.toTaskId === taskId) || [];
    }, [getActiveProject]);

    // Resource operations
    const addResource = useCallback((resource: Resource) => {
        const project = getActiveProject();
        if (!project) return;

        updateActiveProject({
            resources: [...project.resources, resource],
        });
    }, [getActiveProject, updateActiveProject]);

    const updateResource = useCallback((resourceId: string, updates: Partial<Resource>) => {
        const project = getActiveProject();
        if (!project) return;

        updateActiveProject({
            resources: project.resources.map(resource =>
                resource.id === resourceId ? { ...resource, ...updates } : resource
            ),
        });
    }, [getActiveProject, updateActiveProject]);

    const deleteResource = useCallback((resourceId: string) => {
        const project = getActiveProject();
        if (!project) return;

        updateActiveProject({
            resources: project.resources.filter(resource => resource.id !== resourceId),
            tasks: project.tasks.map(task => ({
                ...task,
                resources: task.resources?.filter(r => r.resourceId !== resourceId),
            })),
        });
    }, [getActiveProject, updateActiveProject]);

    const getResources = useCallback(() => {
        return getActiveProject()?.resources || [];
    }, [getActiveProject]);

    const levelResources = useCallback(() => {
        const project = getActiveProject();
        if (!project) return;

        const result = performResourceLeveling(project.tasks);
        if (result.changes.length > 0) {
            pushToHistory();
            updateActiveProject({
                tasks: result.tasks,
            });
        }
    }, [getActiveProject, updateActiveProject, pushToHistory]);

    // Calendar operations
    const addCalendar = useCallback((calendar: ProjectCalendar) => {
        const project = getActiveProject();
        if (!project) return;

        updateActiveProject({
            calendars: [...(project.calendars || []), calendar],
        });
    }, [getActiveProject, updateActiveProject]);

    const updateCalendar = useCallback((calendarId: string, updates: Partial<ProjectCalendar>) => {
        const project = getActiveProject();
        if (!project || !project.calendars) return;

        updateActiveProject({
            calendars: project.calendars.map(calendar =>
                calendar.id === calendarId ? { ...calendar, ...updates } : calendar
            ),
        });
    }, [getActiveProject, updateActiveProject]);

    const deleteCalendar = useCallback((calendarId: string) => {
        const project = getActiveProject();
        if (!project || !project.calendars) return;

        if (project.calendars.length <= 1) {
            alert("Não é possível excluir o último calendário.");
            return;
        }

        updateActiveProject({
            calendars: project.calendars.filter(calendar => calendar.id !== calendarId),
        });
    }, [getActiveProject, updateActiveProject]);

    const getCalendars = useCallback(() => {
        return getActiveProject()?.calendars || [];
    }, [getActiveProject]);

    const setDefaultCalendar = useCallback((calendarId: string) => {
        updateActiveProject({
            defaultCalendarId: calendarId,
        });
    }, [updateActiveProject]);

    const updateAllCalendars = useCallback((calendars: ProjectCalendar[]) => {
        updateActiveProject({
            calendars,
        });
    }, [updateActiveProject]);

    // Baseline operations
    const saveBaseline = useCallback((name: string, description?: string) => {
        const project = getActiveProject();
        if (!project) return;

        const baseline: TaskBaseline = {
            id: `BASELINE${(project.baselines?.length || 0) + 1}`,
            name,
            description,
            savedDate: new Date(),
            tasks: project.tasks.map(task => ({
                taskId: task.id,
                start: task.start,
                end: task.end,
                duration: task.duration,
                work: task.effort,
                cost: task.cost,
                progress: task.progress,
            })),
            projectStartDate: project.startDate,
            projectEndDate: project.endDate,
            totalCost: project.totalCost,
        };

        updateActiveProject({
            baselines: [...(project.baselines || []), baseline],
        });
    }, [getActiveProject, updateActiveProject]);

    const getBaselines = useCallback(() => {
        return getActiveProject()?.baselines || [];
    }, [getActiveProject]);

    const deleteBaseline = useCallback((baselineId: string) => {
        const project = getActiveProject();
        if (!project || !project.baselines) return;

        updateActiveProject({
            baselines: project.baselines.filter(b => b.id !== baselineId),
        });
    }, [getActiveProject, updateActiveProject]);

    const applyBaseline = useCallback((baselineId: string) => {
        const project = getActiveProject();
        if (!project || !project.baselines) return;

        const baseline = project.baselines.find(b => b.id === baselineId);
        if (!baseline) return;

        const updatedTasks = project.tasks.map(task => {
            const baselineTask = baseline.tasks.find(bt => bt.taskId === task.id);
            if (baselineTask) {
                return {
                    ...task,
                    start: new Date(baselineTask.start),
                    end: new Date(baselineTask.end),
                    duration: baselineTask.duration,
                    effort: baselineTask.work,
                    cost: baselineTask.cost,
                    progress: baselineTask.progress || 0,
                };
            }
            return task;
        });

        updateActiveProject({
            tasks: updatedTasks,
            startDate: baseline.projectStartDate,
            endDate: baseline.projectEndDate,
            totalCost: baseline.totalCost,
        });
    }, [getActiveProject, updateActiveProject]);

    // Scenario operations
    const createScenario = useCallback((name: string, description?: string) => {
        const project = getActiveProject();
        if (!project) return;

        const scenario: ProjectScenario = {
            id: `SCENARIO-${Date.now()}`,
            name,
            description,
            createdAt: new Date(),
            tasks: JSON.parse(JSON.stringify(project.tasks)),
            dependencies: JSON.parse(JSON.stringify(project.dependencies)),
            resources: JSON.parse(JSON.stringify(project.resources)),
            startDate: project.startDate,
            endDate: project.endDate,
        };

        updateActiveProject({
            scenarios: [...(project.scenarios || []), scenario],
        });
    }, [getActiveProject, updateActiveProject]);

    const activateScenario = useCallback((scenarioId: string) => {
        const project = getActiveProject();
        if (!project || !project.scenarios) return;

        const scenario = project.scenarios.find(s => s.id === scenarioId);
        if (!scenario) return;

        updateActiveProject({
            liveData: {
                tasks: project.tasks,
                dependencies: project.dependencies,
                resources: project.resources,
                startDate: project.startDate,
                endDate: project.endDate,
            },
            tasks: scenario.tasks,
            dependencies: scenario.dependencies,
            resources: scenario.resources,
            startDate: scenario.startDate,
            endDate: scenario.endDate,
            activeScenarioId: scenarioId,
        });
    }, [getActiveProject, updateActiveProject]);

    const deactivateScenario = useCallback(() => {
        const project = getActiveProject();
        if (!project || !project.liveData) return;

        updateActiveProject({
            tasks: project.liveData.tasks,
            dependencies: project.liveData.dependencies,
            resources: project.liveData.resources,
            startDate: project.liveData.startDate,
            endDate: project.liveData.endDate,
            liveData: undefined,
            activeScenarioId: null,
        });
    }, [getActiveProject, updateActiveProject]);

    const deleteScenario = useCallback((scenarioId: string) => {
        const project = getActiveProject();
        if (!project || !project.scenarios) return;

        updateActiveProject({
            scenarios: project.scenarios.filter(s => s.id !== scenarioId),
            activeScenarioId: project.activeScenarioId === scenarioId ? null : project.activeScenarioId,
        });
    }, [getActiveProject, updateActiveProject]);

    const getScenarios = useCallback(() => {
        return getActiveProject()?.scenarios || [];
    }, [getActiveProject]);

    // Custom field operations
    const addCustomField = useCallback((field: CustomField) => {
        const project = getActiveProject();
        if (!project) return;

        updateActiveProject({
            customFields: [...(project.customFields || []), field],
        });
    }, [getActiveProject, updateActiveProject]);

    const updateCustomField = useCallback((fieldId: string, updates: Partial<CustomField>) => {
        const project = getActiveProject();
        if (!project || !project.customFields) return;

        updateActiveProject({
            customFields: project.customFields.map(field =>
                field.id === fieldId ? { ...field, ...updates } : field
            ),
        });
    }, [getActiveProject, updateActiveProject]);

    const deleteCustomField = useCallback((fieldId: string) => {
        const project = getActiveProject();
        if (!project || !project.customFields) return;

        updateActiveProject({
            customFields: project.customFields.filter(field => field.id !== fieldId),
        });
    }, [getActiveProject, updateActiveProject]);

    const getCustomFields = useCallback(() => {
        return getActiveProject()?.customFields || [];
    }, [getActiveProject]);

    const setCustomFieldValue = useCallback((taskId: string, fieldId: string, value: any) => {
        const project = getActiveProject();
        if (!project) return;

        const updatedTasks = project.tasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    customFields: {
                        ...task.customFields,
                        [fieldId]: value,
                    },
                };
            }
            return task;
        });

        updateActiveProject({
            tasks: updatedTasks,
        });
    }, [getActiveProject, updateActiveProject]);

    // Calculations
    const recalculateDates = useCallback(() => {
        const project = getActiveProject();
        if (!project || project.tasks.length === 0) return;

        // Resolve active calendar
        const defaultCalendar = createDefaultCalendar();
        let projectCalendar = defaultCalendar;

        if (project.calendars && project.calendars.length > 0) {
            if (project.defaultCalendarId) {
                projectCalendar = project.calendars.find(c => c.id === project.defaultCalendarId) || project.calendars[0];
            } else {
                projectCalendar = project.calendars[0];
            }
        } else if (project.workingDays) {
            // Backward compatibility
            projectCalendar = { ...defaultCalendar, workingDays: project.workingDays };
        }

        const workingDays = projectCalendar;

        // Calculate critical path
        const criticalPath = calculateCriticalPath(project.tasks, project.dependencies, workingDays);

        // Calculate slack for all tasks
        const slackMap = calculateSlack(project.tasks, project.dependencies, workingDays);

        // Get CPM results
        const projectEndDate = project.tasks.reduce((latest, task) => {
            return task.end > latest ? task.end : latest;
        }, new Date(0));

        const forwardPass = calculateForwardPass(project.tasks, project.dependencies, workingDays);
        const backwardPass = calculateBackwardPass(
            project.tasks,
            project.dependencies,
            forwardPass,
            projectEndDate,
            workingDays,
        );

        // Update tasks with calculated values
        const updatedTasks = project.tasks.map((task) => {
            const forward = forwardPass.get(task.id);
            const backward = backwardPass.get(task.id);
            const slack = slackMap.get(task.id) || 0;
            const isCritical = criticalPath.includes(task.id);

            return {
                ...task,
                earlyStart: forward?.earlyStart,
                earlyFinish: forward?.earlyFinish,
                lateStart: backward?.lateStart,
                lateFinish: backward?.lateFinish,
                slack,
                isCritical,
            };
        });

        // Also recalculate costs when dates (duration) might have changed
        // But doing it here might be circular if we want recalculateCosts to call updateActiveProject?
        // No, we can chain the updates or do them in one go.
        // Let's call calculate costs on the updatedTasks.

        const tasksWithCosts = updateTaskCosts(updatedTasks, project.resources, project.hoursPerDay || 8);
        const totalCost = calculateProjectCost(tasksWithCosts, project.resources, project.hoursPerDay || 8);

        updateActiveProject({
            tasks: tasksWithCosts,
            criticalPath,
            totalCost,
        });
    }, [getActiveProject, updateActiveProject]);

    const recalculateCosts = useCallback(() => {
        const project = getActiveProject();
        if (!project) return;

        const tasksWithCosts = updateTaskCosts(project.tasks, project.resources, project.hoursPerDay || 8);
        const totalCost = calculateProjectCost(tasksWithCosts, project.resources, project.hoursPerDay || 8);

        updateActiveProject({
            tasks: tasksWithCosts,
            totalCost,
        });
    }, [getActiveProject, updateActiveProject]);

    const calculateProjectStats = useCallback((): ProjectStatistics => {
        const project = getActiveProject();
        if (!project) {
            return {
                totalTasks: 0,
                completedTasks: 0,
                inProgressTasks: 0,
                notStartedTasks: 0,
                overdueTasks: 0,
                totalCost: 0,
                budgetedCost: 0,
                costVariance: 0,
                progressPercentage: 0,
                criticalPathLength: 0,
            };
        }

        const now = new Date();
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        const inProgressTasks = project.tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
        const notStartedTasks = project.tasks.filter(t => t.status === TaskStatus.NOT_STARTED).length;
        const overdueTasks = project.tasks.filter(t =>
            t.end < now && t.status !== TaskStatus.COMPLETED
        ).length;

        const totalCost = project.tasks.reduce((sum, task) => sum + (task.cost || 0), 0);
        const budgetedCost = project.tasks.reduce((sum, task) => sum + (task.budgetedCost || 0), 0);
        const costVariance = budgetedCost - totalCost;

        const progressPercentage = totalTasks > 0
            ? project.tasks.reduce((sum, task) => sum + task.progress, 0) / totalTasks
            : 0;

        const criticalPathLength = project.criticalPath?.length || 0;

        return {
            totalTasks,
            completedTasks,
            inProgressTasks,
            notStartedTasks,
            overdueTasks,
            totalCost,
            budgetedCost,
            costVariance,
            progressPercentage,
            criticalPathLength,
        };
    }, [getActiveProject]);

    // Import/Export
    const exportProject = useCallback((projectId?: string) => {
        const targetProject = projectId
            ? projects.find(p => p.id === projectId)
            : getActiveProject();

        if (!targetProject) return "";
        return exportToJSON(targetProject);
    }, [projects, getActiveProject]);

    const importProject = useCallback((jsonString: string, name?: string): boolean => {
        try {
            const imported = importFromJSON(jsonString);
            if (!imported) return false;

            const newProject: Project = {
                ...imported,
                id: `PROJ-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                name: name || imported.name,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            setProjects(prev => [...prev, newProject]);
            setActiveProjectId(newProject.id);
            return true;
        } catch (error) {
            console.error("Error importing project:", error);
            return false;
        }
    }, []);

    const exportAllProjects = useCallback(() => {
        const data = {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            projects,
            activeProjectId,
        };
        return JSON.stringify(data, null, 2);
    }, [projects, activeProjectId]);

    const importAllProjects = useCallback((jsonString: string): boolean => {
        try {
            const data = JSON.parse(jsonString);
            if (!data.projects || !Array.isArray(data.projects)) {
                return false;
            }

            // Deduplicate imported projects
            const uniqueProjects = Array.from(new Map(data.projects.map((p: any) => [p.id, p])).values());

            setProjects(uniqueProjects as Project[]);
            setActiveProjectId(data.activeProjectId || null);
            return true;
        } catch (error) {
            console.error("Error importing all projects:", error);
            return false;
        }
    }, []);

    // LocalStorage persistence
    const saveToLocalStorage = useCallback(() => {
        try {
            const data = {
                version: "1.0",
                savedAt: new Date().toISOString(),
                projects,
                activeProjectId,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Error saving to localStorage:", error);
        }
    }, [projects, activeProjectId]);

    const loadFromLocalStorage = useCallback((): boolean => {
        try {
            const json = localStorage.getItem(STORAGE_KEY);
            if (!json) return false;

            const data = JSON.parse(json);
            if (!data.projects || !Array.isArray(data.projects)) {
                return false;
            }

            // Convert date strings back to Date objects
            const restoredProjects = data.projects.map((project: any) => ({
                ...project,
                startDate: new Date(project.startDate),
                endDate: new Date(project.endDate),
                createdAt: new Date(project.createdAt),
                updatedAt: new Date(project.updatedAt),
                tasks: project.tasks.map((task: any) => ({
                    ...task,
                    start: new Date(task.start),
                    end: new Date(task.end),
                    earlyStart: task.earlyStart ? new Date(task.earlyStart) : undefined,
                    earlyFinish: task.earlyFinish ? new Date(task.earlyFinish) : undefined,
                    lateStart: task.lateStart ? new Date(task.lateStart) : undefined,
                    lateFinish: task.lateFinish ? new Date(task.lateFinish) : undefined,
                    constraintDate: task.constraintDate ? new Date(task.constraintDate) : undefined,
                    createdAt: task.createdAt ? new Date(task.createdAt) : undefined,
                    updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
                })),
                dependencies: project.dependencies.map((dep: any) => ({
                    ...dep,
                })),
                resources: project.resources.map((res: any) => ({
                    ...res,
                })),
                calendars: project.calendars?.map((cal: any) => ({
                    ...cal,
                    exceptions: cal.exceptions?.map((ex: any) => ({
                        ...ex,
                        startDate: new Date(ex.startDate),
                        endDate: new Date(ex.endDate),
                    })),
                })) || [],
                baselines: project.baselines?.map((bl: any) => ({
                    ...bl,
                    savedDate: new Date(bl.savedDate),
                    projectStartDate: new Date(bl.projectStartDate),
                    projectEndDate: new Date(bl.projectEndDate),
                    tasks: bl.tasks.map((task: any) => ({
                        ...task,
                        start: new Date(task.start),
                        end: new Date(task.end),
                    })),
                })) || [],
                scenarios: project.scenarios?.map((sc: any) => ({
                    ...sc,
                    createdAt: new Date(sc.createdAt),
                    startDate: new Date(sc.startDate),
                    endDate: new Date(sc.endDate),
                    tasks: sc.tasks.map((task: any) => ({
                        ...task,
                        start: new Date(task.start),
                        end: new Date(task.end),
                    })),
                })) || [],
            }));

            // Deduplicate projects by ID to prevent key errors
            const uniqueProjects = restoredProjects.reduce((acc: Project[], current: Project) => {
                const exists = acc.find(item => item.id === current.id);
                if (!exists) {
                    return acc.concat([current]);
                }
                return acc;
            }, []);

            setProjects(uniqueProjects);
            
            // Ensure activeProjectId is valid
            const validActiveId = uniqueProjects.find((p: Project) => p.id === data.activeProjectId)
                ? data.activeProjectId
                : (uniqueProjects.length > 0 ? uniqueProjects[0].id : null);

            setActiveProjectId(validActiveId);
            return true;
        } catch (error) {
            console.error("Error loading from localStorage:", error);
            return false;
        }
    }, []);

    // Initialize from localStorage
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const loaded = loadFromLocalStorage();
        if (!loaded) {
            createProject(mockProject.name, mockProject.description);
        }
    }, [loadFromLocalStorage, createProject]);

    // Auto-save on changes
    useEffect(() => {
        const saveTimeout = setTimeout(() => {
            saveToLocalStorage();
        }, 1000);

        return () => clearTimeout(saveTimeout);
    }, [projects, activeProjectId, saveToLocalStorage]);

    const contextValue: MultiProjectContextType = {
        // Project management
        projects,
        activeProjectId,
        activeProject,

        // Project operations
        createProject,
        switchProject,
        updateProject,
        deleteProject,
        duplicateProject,
        consolidateProjects,

        // Task operations
        addTask,
        updateTask,
        deleteTask,
        indentTask,
        outdentTask,
        moveTaskUp,
        moveTaskDown,
        getTasks,
        getTaskById,

        // Dependency operations
        addDependency,
        removeDependency,
        getDependencies,
        getTaskDependencies,

        // Resource operations
        addResource,
        updateResource,
        deleteResource,
        getResources,
        levelResources,

        // Calendar operations
        addCalendar,
        updateCalendar,
        deleteCalendar,
        getCalendars,
        setDefaultCalendar,
        updateAllCalendars,

        // Baseline operations
        saveBaseline,
        getBaselines,
        deleteBaseline,
        applyBaseline,

        // Scenario operations
        createScenario,
        activateScenario,
        deactivateScenario,
        deleteScenario,
        getScenarios,

        // Custom field operations
        addCustomField,
        updateCustomField,
        deleteCustomField,
        getCustomFields,
        setCustomFieldValue,

        // Calculations
        recalculateDates,
        calculateProjectStats,
        recalculateCosts,

        // Import/Export
        exportProject,
        importProject,
        exportAllProjects,
        importAllProjects,

        // LocalStorage persistence
        saveToLocalStorage,
        loadFromLocalStorage,

        // History operations
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
    };

    return (
        <MultiProjectContext.Provider value={contextValue}>
            {children}
        </MultiProjectContext.Provider>
    );
};

export const useMultiProject = () => {
    const context = useContext(MultiProjectContext);
    if (context === undefined) {
        throw new Error("useMultiProject must be used within a MultiProjectProvider");
    }
    return context;
};