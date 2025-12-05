import type { ExtendedTask, Project, ProjectStatistics } from "../types/types";

/**
 * Calculate Earned Value Management metrics for a project
 */
export interface EVMMetrics {
  // Basic EVM values
  plannedValue: number;      // PV - Budgeted cost of work scheduled
  earnedValue: number;       // EV - Budgeted cost of work performed
  actualCost: number;        // AC - Actual cost of work performed
  
  // Variance metrics
  scheduleVariance: number;  // SV = EV - PV
  costVariance: number;      // CV = EV - AC
  
  // Performance indices
  schedulePerformanceIndex: number;  // SPI = EV / PV
  costPerformanceIndex: number;      // CPI = EV / AC
  
  // Forecasting metrics
  estimateAtCompletion: number;      // EAC = BAC / CPI
  estimateToComplete: number;        // ETC = EAC - AC
  toCompletePerformanceIndex: number; // TCPI = (BAC - EV) / (BAC - AC)
  varianceAtCompletion: number;       // VAC = BAC - EAC
}

/**
 * Calculate EVM metrics for the entire project based on a status date
 */
export function calculateEVMMetrics(project: Project, projectStats: ProjectStatistics, statusDate: Date = new Date()): EVMMetrics {
  let plannedValue = 0;
  let earnedValue = 0;
  let actualCost = 0;
  let budgetAtCompletion = 0;

  // Normalize status date to end of day for better comparison
  const checkDate = new Date(statusDate);
  checkDate.setHours(23, 59, 59, 999);

  // Calculate metrics by aggregating task data
  project.tasks.forEach(task => {
    // Skip tasks without budget information if needed, or assume 0
    const taskBudget = task.budgetedCost || 0;
    const taskActualCost = task.cost || 0;
    
    budgetAtCompletion += taskBudget;
    actualCost += taskActualCost;
    
    // Calculate Planned Value (PV)
    // PV is the authorized budget assigned to scheduled work.
    if (task.start > checkDate) {
      // Task hasn't started yet according to plan
      plannedValue += 0;
    } else if (task.end <= checkDate) {
      // Task should be finished
      plannedValue += taskBudget;
    } else {
      // Task should be in progress
      // Linearly distribute budget over duration
      const totalDuration = task.end.getTime() - task.start.getTime();
      const elapsedDuration = checkDate.getTime() - task.start.getTime();
      
      if (totalDuration > 0) {
        const plannedPercent = Math.min(1, Math.max(0, elapsedDuration / totalDuration));
        plannedValue += taskBudget * plannedPercent;
      } else {
          // Zero duration task (milestone) - if date passed, full value
          plannedValue += taskBudget;
      }
    }
    
    // Calculate Earned Value (EV)
    // EV is the measure of work performed expressed in terms of the budget authorized for that work.
    earnedValue += taskBudget * (task.progress / 100);
  });

  // If no tasks have budget, fall back to project totals if available
  // This handles cases where detailed task costs aren't entered but project totals are
  if (budgetAtCompletion === 0 && (project.budgetedCost || projectStats.totalCost)) {
      budgetAtCompletion = project.budgetedCost || projectStats.totalCost;
      // If we have no task-level detail, use simple approximation for AC and EV
      actualCost = projectStats.totalCost;
      earnedValue = (projectStats.progressPercentage / 100) * budgetAtCompletion;
      
      // Approximate PV based on project timeline
      if (project.startDate && project.endDate) {
          const totalDuration = project.endDate.getTime() - project.startDate.getTime();
          const elapsedDuration = checkDate.getTime() - project.startDate.getTime();
          if (totalDuration > 0) {
              const plannedPercent = Math.min(1, Math.max(0, elapsedDuration / totalDuration));
              plannedValue = budgetAtCompletion * plannedPercent;
          }
      }
  }

  // Calculate EVM metrics
  const scheduleVariance = earnedValue - plannedValue;
  const costVariance = earnedValue - actualCost;
  
  const schedulePerformanceIndex = plannedValue !== 0 ? earnedValue / plannedValue : 0;
  const costPerformanceIndex = actualCost !== 0 ? earnedValue / actualCost : 0;
  
  // Calculate forecasting metrics
  // EAC = BAC / CPI (if CPI is reliable, else could be AC + ETC)
  // Standard formula: EAC = BAC / CPI
  // If CPI is 0, EAC assumes BAC (no deviation projection possible) or AC (if done)
  let estimateAtCompletion = budgetAtCompletion;
  if (costPerformanceIndex > 0) {
      estimateAtCompletion = budgetAtCompletion / costPerformanceIndex;
  } else if (actualCost > 0) {
      // If we have cost but 0 EV (CPI=0), EAC is likely undefined or very high. 
      // Fallback to AC + Remaining Budget
      estimateAtCompletion = actualCost + (budgetAtCompletion - earnedValue);
  }
  
  const estimateToComplete = estimateAtCompletion - actualCost;
  
  // TCPI = (BAC - EV) / (BAC - AC)
  // The efficiency that must be achieved on the remaining work to meet the BAC.
  let toCompletePerformanceIndex = 0;
  const remainingBudget = budgetAtCompletion - actualCost;
  if (remainingBudget !== 0) {
      toCompletePerformanceIndex = (budgetAtCompletion - earnedValue) / remainingBudget;
  } else if (budgetAtCompletion > earnedValue) {
      // Budget exhausted but work remaining -> Infinite/Impossible
      toCompletePerformanceIndex = 999; 
  }
    
  const varianceAtCompletion = budgetAtCompletion - estimateAtCompletion;
  
  return {
    plannedValue,
    earnedValue,
    actualCost,
    scheduleVariance,
    costVariance,
    schedulePerformanceIndex,
    costPerformanceIndex,
    estimateAtCompletion,
    estimateToComplete,
    toCompletePerformanceIndex,
    varianceAtCompletion
  };
}

/**
 * Generate project report data
 */
export interface ProjectReport {
  projectInfo: {
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
    progress: number;
  };
  evmMetrics: EVMMetrics;
  taskSummary: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    overdue: number;
  };
  resourceSummary: {
    totalResources: number;
    allocatedResources: number;
    costPerResource: number[];
  };
  financialSummary: {
    budgetedCost: number;
    totalCost: number;
    costVariance: number;
    costPerformance: number;
  };
  scheduleSummary: {
    totalDuration: number;
    criticalPathLength: number;
    scheduleVariance: number;
    schedulePerformance: number;
  };
}

/**
 * Generate a complete project report
 */
export function generateProjectReport(project: Project, projectStats: ProjectStatistics): ProjectReport {
  const evmMetrics = calculateEVMMetrics(project, projectStats);
  
  // Calculate additional summary data
  const totalDuration = Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    projectInfo: {
      name: project.name,
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      progress: project.progress
    },
    evmMetrics,
    taskSummary: {
      total: projectStats.totalTasks,
      completed: projectStats.completedTasks,
      inProgress: projectStats.inProgressTasks,
      notStarted: projectStats.notStartedTasks,
      overdue: projectStats.overdueTasks
    },
    resourceSummary: {
      totalResources: project.resources.length,
      allocatedResources: project.tasks.filter(t => t.resources && t.resources.length > 0).length,
      costPerResource: [] // TODO: Calculate cost per resource
    },
    financialSummary: {
      budgetedCost: project.budgetedCost || 0,
      totalCost: projectStats.totalCost,
      costVariance: evmMetrics.costVariance,
      costPerformance: evmMetrics.costPerformanceIndex
    },
    scheduleSummary: {
      totalDuration,
      criticalPathLength: projectStats.criticalPathLength,
      scheduleVariance: evmMetrics.scheduleVariance,
      schedulePerformance: evmMetrics.schedulePerformanceIndex
    }
  };
}

/**
 * Generate task analysis report
 */
export interface TaskAnalysisReport {
  criticalTasks: ExtendedTask[];
  overdueTasks: ExtendedTask[];
  highRiskTasks: ExtendedTask[];
  resourceOverallocatedTasks: ExtendedTask[];
  costOverrunTasks: ExtendedTask[];
}

/**
 * Generate task analysis report
 */
export function generateTaskAnalysisReport(tasks: ExtendedTask[]): TaskAnalysisReport {
  const now = new Date();
  
  return {
    criticalTasks: tasks.filter(task => task.isCritical),
    overdueTasks: tasks.filter(task => 
      task.end < now && task.status !== 'completed'
    ),
    highRiskTasks: tasks.filter(task => 
      task.slack !== undefined && task.slack <= 2 // Tasks with 2 or fewer days of slack
    ),
    resourceOverallocatedTasks: tasks.filter(task => 
      task.resources && task.resources.some(r => r.allocation > 100)
    ),
    costOverrunTasks: tasks.filter(task => 
      task.cost !== undefined && task.budgetedCost !== undefined && task.cost > task.budgetedCost
    )
  };
}
