import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { TaskStatus } from "../types/types";
import type { Project, ExtendedTask, TaskDependency, Resource, ProjectStatistics, ProjectCalendar, TaskBaseline, CustomField, ProjectScenario } from "../types/types";
import {
    calculateCriticalPath,
    calculateSlack,
    calculateForwardPass,
    calculateBackwardPass,
    DEFAULT_WORKING_DAYS,
} from "../utils/dateCalculations";
import { validateNewDependency } from "../utils/validators";
import { importFromJSON, exportToJSON } from "../utils/dataImportExport";

interface ProjectContextType {
    project: Project | null;
    setProject: (project: Project) => void;

    // Task operations
    addTask: (task: ExtendedTask) => void;
    updateTask: (taskId: string, updates: Partial<ExtendedTask>) => void;
    deleteTask: (taskId: string) => void;
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

    // Import/Export
    exportProject: () => string;
    importProject: (jsonString: string) => boolean;

    // LocalStorage persistence
    saveToLocalStorage: () => void;
    loadFromLocalStorage: () => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY = "cronograma_project";

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [project, setProjectState] = useState<Project | null>(null);

    // LocalStorage
    const saveToLocalStorage = useCallback(() => {
        if (!project) return;
        try {
            const json = exportToJSON(project);
            localStorage.setItem(STORAGE_KEY, json);
        } catch (error) {
            console.error("Error saving to localStorage:", error);
        }
    }, [project]);

    const loadFromLocalStorage = useCallback((): boolean => {
        try {
            const json = localStorage.getItem(STORAGE_KEY);
            if (json) {
                const imported = importFromJSON(json);
                if (imported) {
                    setProjectState(imported);
                    return true;
                }
            }
        } catch (error) {
            console.error("Error loading from localStorage:", error);
        }
        return false;
    }, []);

    // Load from localStorage on mount
    useEffect(() => {
        loadFromLocalStorage();
    }, [loadFromLocalStorage]);

    // Auto-save to localStorage whenever project changes
    useEffect(() => {
        if (project) {
            saveToLocalStorage();
        }
    }, [project, saveToLocalStorage]);

    const setProject = useCallback((newProject: Project) => {
        setProjectState(newProject);
    }, []);



    // Task operations
    const addTask = useCallback((task: ExtendedTask) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            const newTasks = [...prev.tasks, task];
            return {
                ...prev,
                tasks: newTasks,
                updatedAt: new Date(),
            };
        });
    }, []);

    const updateTask = useCallback((taskId: string, updates: Partial<ExtendedTask>) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            const newTasks = prev.tasks.map((task) =>
                task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task,
            );

            return {
                ...prev,
                tasks: newTasks,
                updatedAt: new Date(),
            };
        });
    }, []);

    const deleteTask = useCallback((taskId: string) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            // Remove task
            const newTasks = prev.tasks.filter((task) => task.id !== taskId);

            // Remove dependencies involving this task
            const newDependencies = prev.dependencies.filter(
                (dep) => dep.fromTaskId !== taskId && dep.toTaskId !== taskId,
            );

            return {
                ...prev,
                tasks: newTasks,
                dependencies: newDependencies,
                updatedAt: new Date(),
            };
        });
    }, []);

    const getTasks = useCallback(() => {
        return project?.tasks || [];
    }, [project]);

    const getTaskById = useCallback(
        (taskId: string) => {
            return project?.tasks.find((task) => task.id === taskId);
        },
        [project],
    );

    // Dependency operations
    const addDependency = useCallback(
        (dependency: TaskDependency): boolean => {
            if (!project) return false;

            // Validate
            const validation = validateNewDependency(dependency, project.tasks, project.dependencies);
            if (!validation.valid) {
                console.error("Invalid dependency:", validation.errors);
                return false;
            }

            setProjectState((prev) => {
                if (!prev) return prev;

                return {
                    ...prev,
                    dependencies: [...prev.dependencies, dependency],
                    updatedAt: new Date(),
                };
            });

            return true;
        },
        [project],
    );

    const removeDependency = useCallback((dependencyId: string) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                dependencies: prev.dependencies.filter((dep) => dep.id !== dependencyId),
                updatedAt: new Date(),
            };
        });
    }, []);

    const getDependencies = useCallback(() => {
        return project?.dependencies || [];
    }, [project]);

    const getTaskDependencies = useCallback(
        (taskId: string) => {
            return project?.dependencies.filter((dep) => dep.fromTaskId === taskId || dep.toTaskId === taskId) || [];
        },
        [project],
    );

    // Resource operations
    const addResource = useCallback((resource: Resource) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                resources: [...prev.resources, resource],
                updatedAt: new Date(),
            };
        });
    }, []);

    const updateResource = useCallback((resourceId: string, updates: Partial<Resource>) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            const newResources = prev.resources.map((resource) =>
                resource.id === resourceId ? { ...resource, ...updates } : resource,
            );

            return {
                ...prev,
                resources: newResources,
                updatedAt: new Date(),
            };
        });
    }, []);

    const deleteResource = useCallback((resourceId: string) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            // Remove resource
            const newResources = prev.resources.filter((r) => r.id !== resourceId);

            // Remove resource assignments from tasks
            const newTasks = prev.tasks.map((task) => ({
                ...task,
                resources: task.resources?.filter((tr) => tr.resourceId !== resourceId),
            }));

            return {
                ...prev,
                resources: newResources,
                tasks: newTasks,
                updatedAt: new Date(),
            };
        });
    }, []);

    const getResources = useCallback(() => {
        return project?.resources || [];
    }, [project]);

    // Calendar operations
    const addCalendar = useCallback((calendar: ProjectCalendar) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            const calendars = prev.calendars ? [...prev.calendars, calendar] : [calendar];

            return {
                ...prev,
                calendars,
                updatedAt: new Date(),
            };
        });
    }, []);

    const updateCalendar = useCallback((calendarId: string, updates: Partial<ProjectCalendar>) => {
        setProjectState((prev) => {
            if (!prev || !prev.calendars) return prev;

            const newCalendars = prev.calendars.map((calendar) =>
                calendar.id === calendarId ? { ...calendar, ...updates } : calendar,
            );

            return {
                ...prev,
                calendars: newCalendars,
                updatedAt: new Date(),
            };
        });
    }, []);

    const deleteCalendar = useCallback((calendarId: string) => {
        setProjectState((prev) => {
            if (!prev || !prev.calendars) return prev;

            // Remove calendar
            const newCalendars = prev.calendars.filter((cal) => cal.id !== calendarId);

            // Update tasks that use this calendar
            const newTasks = prev.tasks.map((task) =>
                task.calendarId === calendarId ? { ...task, calendarId: undefined } : task
            );

            // Update default calendar if needed
            let newDefaultCalendarId = prev.defaultCalendarId;
            if (newDefaultCalendarId === calendarId) {
                newDefaultCalendarId = newCalendars[0]?.id;
            }

            return {
                ...prev,
                calendars: newCalendars,
                tasks: newTasks,
                defaultCalendarId: newDefaultCalendarId,
                updatedAt: new Date(),
            };
        });
    }, []);

    const getCalendars = useCallback(() => {
        return project?.calendars || [];
    }, [project]);

    const setDefaultCalendar = useCallback((calendarId: string) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            // Update all calendars to unset isDefault
            const updatedCalendars = prev.calendars?.map(cal => ({
                ...cal,
                isDefault: cal.id === calendarId
            })) || [];

            return {
                ...prev,
                calendars: updatedCalendars,
                defaultCalendarId: calendarId,
                updatedAt: new Date(),
            };
        });
    }, []);

    const updateAllCalendars = useCallback((calendars: ProjectCalendar[]) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                calendars,
                updatedAt: new Date(),
            };
        });
    }, []);

    // Baseline operations
    const saveBaseline = useCallback((name: string, description?: string) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            // Create baseline
            const baseline = {
                id: `BASELINE-${Date.now()}`,
                name,
                description,
                savedDate: new Date(),
                tasks: prev.tasks.map(task => ({
                    taskId: task.id,
                    start: task.start,
                    end: task.end,
                    duration: task.duration,
                    work: task.effort,
                    cost: task.cost,
                    progress: task.progress
                })),
                projectStartDate: prev.startDate,
                projectEndDate: prev.endDate,
                totalCost: prev.totalCost
            };

            const baselines = prev.baselines ? [...prev.baselines, baseline] : [baseline];

            return {
                ...prev,
                baselines,
                updatedAt: new Date(),
            };
        });
    }, []);

    const getBaselines = useCallback(() => {
        return project?.baselines || [];
    }, [project]);

    const deleteBaseline = useCallback((baselineId: string) => {
        setProjectState((prev) => {
            if (!prev || !prev.baselines) return prev;

            const newBaselines = prev.baselines.filter((bl) => bl.id !== baselineId);

            return {
                ...prev,
                baselines: newBaselines,
                updatedAt: new Date(),
            };
        });
    }, []);

    const applyBaseline = useCallback((baselineId: string) => {
        setProjectState((prev) => {
            if (!prev || !prev.baselines) return prev;

            const baseline = prev.baselines.find((bl) => bl.id === baselineId);
            if (!baseline) return prev;

            // Apply baseline to tasks
            const updatedTasks = prev.tasks.map(task => {
                const baselineTask = baseline.tasks.find(bt => bt.taskId === task.id);
                if (baselineTask) {
                    return {
                        ...task,
                        baselineStart: baselineTask.start,
                        baselineEnd: baselineTask.end,
                        baselineDuration: baselineTask.duration,
                        baselineWork: baselineTask.work,
                        baselineCost: baselineTask.cost,
                        baselineProgress: baselineTask.progress
                    };
                }
                return task;
            });

            return {
                ...prev,
                tasks: updatedTasks,
                updatedAt: new Date(),
            };
        });
    }, []);

    // Custom field operations
    const addCustomField = useCallback((field: CustomField) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            const customFields = prev.customFields ? [...prev.customFields, field] : [field];

            return {
                ...prev,
                customFields,
                updatedAt: new Date(),
            };
        });
    }, []);

    const updateCustomField = useCallback((fieldId: string, updates: Partial<CustomField>) => {
        setProjectState((prev) => {
            if (!prev || !prev.customFields) return prev;

            const newCustomFields = prev.customFields.map((field) =>
                field.id === fieldId ? { ...field, ...updates } : field,
            );

            return {
                ...prev,
                customFields: newCustomFields,
                updatedAt: new Date(),
            };
        });
    }, []);

    const deleteCustomField = useCallback((fieldId: string) => {
        setProjectState((prev) => {
            if (!prev || !prev.customFields) return prev;

            // Remove the custom field
            const newCustomFields = prev.customFields.filter((field) => field.id !== fieldId);

            // Remove references to this field from all tasks
            const newTasks = prev.tasks.map(task => {
                if (task.customFields) {
                    const newCustomFields = { ...task.customFields };
                    delete newCustomFields[fieldId];
                    return { ...task, customFields: newCustomFields };
                }
                return task;
            });

            return {
                ...prev,
                customFields: newCustomFields,
                tasks: newTasks,
                updatedAt: new Date(),
            };
        });
    }, []);

    const getCustomFields = useCallback(() => {
        return project?.customFields || [];
    }, [project]);

    const setCustomFieldValue = useCallback((taskId: string, fieldId: string, value: string | number | boolean | null) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            const newTasks = prev.tasks.map(task => {
                if (task.id === taskId) {
                    const customFields = task.customFields ? { ...task.customFields } : {};
                    customFields[fieldId] = value;
                    return { ...task, customFields };
                }
                return task;
            });

            return {
                ...prev,
                tasks: newTasks,
                updatedAt: new Date(),
            };
        });
    }, []);

    // Recalculate dates based on dependencies
    const recalculateDates = useCallback(() => {
        if (!project) return;

        const workingDays = project.workingDays || DEFAULT_WORKING_DAYS;

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

        setProjectState({
            ...project,
            tasks: updatedTasks,
            criticalPath,
            updatedAt: new Date(),
        });
    }, [project]);

    // Calculate project statistics
    const calculateProjectStats = useCallback((): ProjectStatistics => {
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
        const tasks = project.tasks.filter((t) => t.type !== "project");

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
        const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
        const notStartedTasks = tasks.filter((t) => t.status === TaskStatus.NOT_STARTED).length;
        const overdueTasks = tasks.filter((t) => t.end < now && t.status !== TaskStatus.COMPLETED).length;

        const totalCost = tasks.reduce((sum, t) => sum + (t.cost || 0), 0);
        const budgetedCost = tasks.reduce((sum, t) => sum + (t.budgetedCost || 0), 0);
        const costVariance = budgetedCost - totalCost;

        const totalProgress = tasks.reduce((sum, t) => sum + t.progress, 0);
        const progressPercentage = totalTasks > 0 ? totalProgress / totalTasks : 0;

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
    }, [project]);

    // Import/Export
    const exportProject = useCallback(() => {
        if (!project) return "";
        return exportToJSON(project);
    }, [project]);

    const importProject = useCallback((jsonString: string): boolean => {
        const imported = importFromJSON(jsonString);
        if (imported) {
            setProjectState(imported);
            return true;
        }
        return false;
    }, []);

    // Scenario operations
    const createScenario = useCallback((name: string, description?: string) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            const scenario: ProjectScenario = {
                id: `SCENARIO-${Date.now()}`,
                name,
                description,
                createdAt: new Date(),
                tasks: JSON.parse(JSON.stringify(prev.tasks)).map((t: any) => ({
                    ...t,
                    start: new Date(t.start),
                    end: new Date(t.end),
                    constraintDate: t.constraintDate ? new Date(t.constraintDate) : undefined,
                })),
                dependencies: [...prev.dependencies],
                resources: [...prev.resources],
                startDate: new Date(prev.startDate),
                endDate: new Date(prev.endDate)
            };

            const scenarios = prev.scenarios ? [...prev.scenarios, scenario] : [scenario];

            return {
                ...prev,
                scenarios,
                updatedAt: new Date(),
            };
        });
    }, []);

    const activateScenario = useCallback((scenarioId: string) => {
        setProjectState((prev) => {
            if (!prev) return prev;

            const scenario = prev.scenarios?.find(s => s.id === scenarioId);
            if (!scenario) return prev;

            // If already in a scenario, save it first?
            // For simplicity, we only allow switching from Live -> Scenario or Scenario -> Live for now.
            // If we are already in a scenario, we should deactivate first to save state, then activate new one.
            // But let's assume the UI handles this or we just block it.

            // If we are currently Live (not in a scenario), save Live Data
            let liveData = prev.liveData;
            if (!prev.activeScenarioId) {
                liveData = {
                    tasks: prev.tasks,
                    dependencies: prev.dependencies,
                    resources: prev.resources,
                    startDate: prev.startDate,
                    endDate: prev.endDate
                };
            }

            return {
                ...prev,
                activeScenarioId: scenarioId,
                liveData,
                // Load scenario data
                tasks: JSON.parse(JSON.stringify(scenario.tasks)).map((t: any) => ({
                    ...t,
                    start: new Date(t.start),
                    end: new Date(t.end),
                    constraintDate: t.constraintDate ? new Date(t.constraintDate) : undefined,
                })),
                dependencies: [...scenario.dependencies],
                resources: [...scenario.resources],
                startDate: new Date(scenario.startDate),
                endDate: new Date(scenario.endDate),
                updatedAt: new Date(),
            };
        });
    }, []);

    const deactivateScenario = useCallback(() => {
        setProjectState((prev) => {
            if (!prev || !prev.activeScenarioId || !prev.liveData) return prev;

            // Save current state back to the scenario
            const updatedScenarios = prev.scenarios?.map(s => {
                if (s.id === prev.activeScenarioId) {
                    return {
                        ...s,
                        tasks: prev.tasks,
                        dependencies: prev.dependencies,
                        resources: prev.resources,
                        startDate: prev.startDate,
                        endDate: prev.endDate
                    };
                }
                return s;
            }) || [];

            // Restore Live Data
            return {
                ...prev,
                activeScenarioId: null,
                scenarios: updatedScenarios,
                tasks: prev.liveData.tasks,
                dependencies: prev.liveData.dependencies,
                resources: prev.liveData.resources,
                startDate: prev.liveData.startDate,
                endDate: prev.liveData.endDate,
                liveData: undefined,
                updatedAt: new Date(),
            };
        });
    }, []);

    const deleteScenario = useCallback((scenarioId: string) => {
        setProjectState((prev) => {
            if (!prev || !prev.scenarios) return prev;

            // Cannot delete active scenario
            if (prev.activeScenarioId === scenarioId) return prev;

            return {
                ...prev,
                scenarios: prev.scenarios.filter(s => s.id !== scenarioId),
                updatedAt: new Date(),
            };
        });
    }, []);

    const getScenarios = useCallback(() => {
        return project?.scenarios || [];
    }, [project]);

    const value: ProjectContextType = {
        project,
        setProject,
        addTask,
        updateTask,
        deleteTask,
        getTasks,
        getTaskById,
        addDependency,
        removeDependency,
        getDependencies,
        getTaskDependencies,
        addResource,
        updateResource,
        deleteResource,
        getResources,
        addCalendar,
        updateCalendar,
        deleteCalendar,
        getCalendars,
        setDefaultCalendar,
        updateAllCalendars,
        saveBaseline,
        getBaselines,
        deleteBaseline,
        applyBaseline,
        createScenario,
        activateScenario,
        deactivateScenario,
        deleteScenario,
        getScenarios,
        addCustomField,
        updateCustomField,
        deleteCustomField,
        getCustomFields,
        setCustomFieldValue,
        recalculateDates,
        calculateProjectStats,
        exportProject,
        importProject,
        saveToLocalStorage,
        loadFromLocalStorage,
    };

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useProject = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error("useProject must be used within a ProjectProvider");
    }
    return context;
};
