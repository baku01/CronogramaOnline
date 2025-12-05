import type { ExtendedTask, TaskBaseline, Project } from "../types/types";

/**
 * Create a new baseline from current project state
 */
export function createBaseline(
  project: Project,
  baselineName: string,
  baselineDescription?: string
): TaskBaseline {
  const now = new Date();
  
  // Create a baseline for each task with its current values
  const taskBaselines = project.tasks.map(task => ({
    taskId: task.id,
    start: new Date(task.start),
    end: new Date(task.end),
    duration: task.duration,
    work: task.effort,
    cost: task.cost,
    progress: task.progress
  }));

  return {
    id: `BASELINE-${Date.now()}`,
    name: baselineName,
    description: baselineDescription,
    savedDate: now,
    tasks: taskBaselines,
    projectStartDate: new Date(project.startDate),
    projectEndDate: new Date(project.endDate),
    totalCost: project.totalCost
  };
}

/**
 * Apply a specific baseline to tasks for comparison
 */
export function applyBaselineToTasks(
  tasks: ExtendedTask[],
  baseline: TaskBaseline
): ExtendedTask[] {
  return tasks.map(task => {
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
}

/**
 * Calculate variance between current task values and baseline
 */
export interface TaskVariance {
  taskId: string;
  startDateVariance: number; // in days
  endDateVariance: number; // in days
  durationVariance: number; // in days
  costVariance: number; // in currency
  progressVariance: number; // in percentage
}

export function calculateTaskVariance(task: ExtendedTask, baseline?: TaskBaseline): TaskVariance | null {
  if (!baseline) return null;
  
  const baselineTask = baseline.tasks.find(bt => bt.taskId === task.id);
  if (!baselineTask) return null;
  
  // Calculate date variances in days
  const startDateVariance = Math.floor((task.start.getTime() - baselineTask.start.getTime()) / (1000 * 60 * 60 * 24));
  const endDateVariance = Math.floor((task.end.getTime() - baselineTask.end.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    taskId: task.id,
    startDateVariance,
    endDateVariance,
    durationVariance: (task.duration || 0) - (baselineTask.duration || 0),
    costVariance: (task.cost || 0) - (baselineTask.cost || 0),
    progressVariance: (task.progress || 0) - (baselineTask.progress || 0)
  };
}

/**
 * Calculate project variance statistics
 */
export interface ProjectVariance {
  baselineName: string;
  projectStartDateVariance: number; // in days
  projectEndDateVariance: number; // in days
  totalCostVariance: number; // in currency
  scheduleVariance: number; // SV = EV - PV
  costVariance: number; // CV = EV - AC
  schedulePerformanceIndex: number; // SPI = EV / PV
  costPerformanceIndex: number; // CPI = EV / AC
}

export function calculateProjectVariance(
  project: Project,
  baseline: TaskBaseline
): ProjectVariance {
  const projectStartDateVariance = Math.floor(
    (project.startDate.getTime() - baseline.projectStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const projectEndDateVariance = Math.floor(
    (project.endDate.getTime() - baseline.projectEndDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalCostVariance = (project.totalCost || 0) - (baseline.totalCost || 0);

  // Simplified EVM calculations (would need more detailed Earned Value calculations in practice)
  // For now, using basic schedule and cost variance
  const scheduleVariance = 0; // Would require EV calculations
  const costVariance = 0; // Would require AC and EV calculations
  const schedulePerformanceIndex = 1.0; // Would require EV/PV calculations
  const costPerformanceIndex = 1.0; // Would require EV/AC calculations

  return {
    baselineName: baseline.name,
    projectStartDateVariance,
    projectEndDateVariance,
    totalCostVariance,
    scheduleVariance,
    costVariance,
    schedulePerformanceIndex,
    costPerformanceIndex
  };
}

/**
 * Get available baseline names for the project
 */
export function getAvailableBaselineNames(project: Project): string[] {
  return project.baselines?.map(b => b.name) || [];
}