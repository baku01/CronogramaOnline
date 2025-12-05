import { differenceInDays } from "date-fns";
import type { ExtendedTask, Project, ProjectStatistics } from "../types/types";

export interface EVMMetrics {
    pv: number; // Planned Value
    ev: number; // Earned Value
    ac: number; // Actual Cost
    sv: number; // Schedule Variance (EV - PV)
    cv: number; // Cost Variance (EV - AC)
    spi: number; // Schedule Performance Index (EV / PV)
    cpi: number; // Cost Performance Index (EV / AC)
    bac: number; // Budget at Completion (Total Planned Cost)
    eac: number; // Estimate at Completion (BAC / CPI)
    vac: number; // Variance at Completion (BAC - EAC)
}

/**
 * Calculate EVM metrics for a single task at a specific status date
 */
export function calculateTaskEVM(task: ExtendedTask, statusDate: Date = new Date()): EVMMetrics {
    const totalCost = task.budgetedCost || task.cost || 0; // Budget at Completion
    // In MS Project, Cost is often scheduled cost. Actual Cost is separate.
    // For this implementation, let's assume 'cost' is the current calculated cost (which includes actuals + remaining).
    // But strictly, AC should be stored. Let's look if we have 'actualCost'.
    // types.ts doesn't have actualCost explicit, but let's assume `cost` reflects current reality.
    // However, for EVM, AC is what we *spent*.
    // Let's use `cost * (progress/100)` as a proxy for AC if not present? No, that's EV.
    // Let's assume we need a field `actualCost`. If missing, we might default to `cost * percentComplete` (which makes CPI=1, not useful).
    // OR we assume `cost` IS the EAC, and we derive AC?
    
    // Better approach: Use `cost` as EAC (Estimate at Completion).
    // Use `budgetedCost` (from Baseline) as BAC.
    
    // PV: % of planned duration elapsed * BAC
    // EV: % Complete * BAC
    // AC: We really need Actual Cost.
    
    // Let's check types again.
    // ExtendedTask has: cost, budgetedCost.
    
    const bac = task.budgetedCost || totalCost;

    // 1. Calculate PV
    // Based on Baseline Start/End if available, else Start/End
    const start = task.baselineStart || task.start;
    const end = task.baselineEnd || task.end;

    const totalDuration = differenceInDays(end, start) + 1;
    const elapsed = differenceInDays(statusDate, start) + 1;

    let plannedPercent = 0;
    if (statusDate < start) plannedPercent = 0;
    else if (statusDate > end) plannedPercent = 1;
    else plannedPercent = Math.max(0, Math.min(1, elapsed / totalDuration));

    const pv = bac * plannedPercent;

    // 2. Calculate EV
    const ev = bac * (task.progress / 100);

    // 3. Calculate AC
    // Ideally user inputs AC. If not, we can't calculate CPI accurately.
    // But often in simple tools, AC is approximated or we add a field.
    // Let's assume 'cost' is the current projected total cost.
    // AC = cost * (progress/100)? No.
    // AC is usually independent.
    // Let's assume AC is passed or we add it?
    // For now, let's use `task.cost` as the *Current Total Cost*.
    // If task is 50% done, how much did we spend?
    // We don't know without a time-phased distribution or explicit field.
    // Let's approximate AC = task.cost * (task.progress / 100) * (some variance factor? no).

    // Let's check if we can calculate AC from Resources?
    // Resource Cost = Rate * Work.
    // Actual Work = Work * % Complete.
    // So AC ~ cost * % Complete IF rates didn't change.
    // This implies CPI = 1.

    // To make it interesting, we usually need explicit Actual Cost.
    // Since we don't have it, I will skip AC-based metrics (CPI, CV) or default them to 1/0.
    // OR I can use `task.cost` (Current Estimate) vs `task.budgetedCost` (Baseline).
    // If `cost` > `budgetedCost`, we are over budget.
    // We can assume AC ~ (task.cost / TotalWork) * ActualWork?
    // Let's assume linear burn.
    // AC = task.cost * (task.progress / 100).
    // Then CV = EV - AC = (BAC * %) - (EAC * %).
    // If EAC (cost) > BAC (budgetedCost), then CV is negative. Correct.

    const ac = (task.cost || bac) * (task.progress / 100);

    const sv = ev - pv;
    const cv = ev - ac;

    const spi = pv === 0 ? 1 : ev / pv;
    const cpi = ac === 0 ? 1 : ev / ac;

    const eac = cpi === 0 ? bac : bac / cpi; // Or simply task.cost
    const vac = bac - eac;

    return { pv, ev, ac, sv, cv, spi, cpi, bac, eac, vac };
}

/**
 * Calculate Project Level EVM
 */
export function calculateProjectEVM(tasks: ExtendedTask[], statusDate: Date = new Date()): EVMMetrics {
    const totals = tasks.reduce((acc, task) => {
        const metrics = calculateTaskEVM(task, statusDate);
        return {
            pv: acc.pv + metrics.pv,
            ev: acc.ev + metrics.ev,
            ac: acc.ac + metrics.ac,
            bac: acc.bac + metrics.bac
        };
    }, { pv: 0, ev: 0, ac: 0, bac: 0 });

    const sv = totals.ev - totals.pv;
    const cv = totals.ev - totals.ac;
    const spi = totals.pv === 0 ? 1 : totals.ev / totals.pv;
    const cpi = totals.ac === 0 ? 1 : totals.ev / totals.ac;
    const eac = cpi === 0 ? totals.bac : totals.bac / cpi;
    const vac = totals.bac - eac;

    return {
        ...totals,
        sv, cv, spi, cpi, eac, vac
    };
}

/**
 * Extended EVM Metrics for project-level reporting (used by ReportingModal)
 */
export interface ExtendedEVMMetrics {
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
 * Calculate extended EVM metrics for the entire project based on a status date
 */
function calculateExtendedEVMMetrics(project: Project, projectStats: ProjectStatistics, statusDate: Date = new Date()): ExtendedEVMMetrics {
  let plannedValue = 0;
  let earnedValue = 0;
  let actualCost = 0;
  let budgetAtCompletion = 0;

  const checkDate = new Date(statusDate);
  checkDate.setHours(23, 59, 59, 999);

  project.tasks.forEach(task => {
    const taskBudget = task.budgetedCost || 0;
    const taskActualCost = task.cost || 0;
    
    budgetAtCompletion += taskBudget;
    actualCost += taskActualCost;
    
    if (task.start > checkDate) {
      plannedValue += 0;
    } else if (task.end <= checkDate) {
      plannedValue += taskBudget;
    } else {
      const totalDuration = task.end.getTime() - task.start.getTime();
      const elapsedDuration = checkDate.getTime() - task.start.getTime();
      
      if (totalDuration > 0) {
        const plannedPercent = Math.min(1, Math.max(0, elapsedDuration / totalDuration));
        plannedValue += taskBudget * plannedPercent;
      } else {
          plannedValue += taskBudget;
      }
    }
    
    earnedValue += taskBudget * (task.progress / 100);
  });

  if (budgetAtCompletion === 0 && (project.budgetedCost || projectStats.totalCost)) {
      budgetAtCompletion = project.budgetedCost || projectStats.totalCost;
      actualCost = projectStats.totalCost;
      earnedValue = (projectStats.progressPercentage / 100) * budgetAtCompletion;
      
      if (project.startDate && project.endDate) {
          const totalDuration = project.endDate.getTime() - project.startDate.getTime();
          const elapsedDuration = checkDate.getTime() - project.startDate.getTime();
          if (totalDuration > 0) {
              const plannedPercent = Math.min(1, Math.max(0, elapsedDuration / totalDuration));
              plannedValue = budgetAtCompletion * plannedPercent;
          }
      }
  }

  const scheduleVariance = earnedValue - plannedValue;
  const costVariance = earnedValue - actualCost;
  
  const schedulePerformanceIndex = plannedValue !== 0 ? earnedValue / plannedValue : 0;
  const costPerformanceIndex = actualCost !== 0 ? earnedValue / actualCost : 0;
  
  let estimateAtCompletion = budgetAtCompletion;
  if (costPerformanceIndex > 0) {
      estimateAtCompletion = budgetAtCompletion / costPerformanceIndex;
  } else if (actualCost > 0) {
      estimateAtCompletion = actualCost + (budgetAtCompletion - earnedValue);
  }
  
  const estimateToComplete = estimateAtCompletion - actualCost;
  
  let toCompletePerformanceIndex = 0;
  const remainingBudget = budgetAtCompletion - actualCost;
  if (remainingBudget !== 0) {
      toCompletePerformanceIndex = (budgetAtCompletion - earnedValue) / remainingBudget;
  } else if (budgetAtCompletion > earnedValue) {
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
  evmMetrics: ExtendedEVMMetrics;
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
  const evmMetrics = calculateExtendedEVMMetrics(project, projectStats);
  
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
      costPerResource: []
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
      task.slack !== undefined && task.slack <= 2
    ),
    resourceOverallocatedTasks: tasks.filter(task => 
      task.resources && task.resources.some(r => r.allocation > 100)
    ),
    costOverrunTasks: tasks.filter(task => 
      task.cost !== undefined && task.budgetedCost !== undefined && task.cost > task.budgetedCost
    )
  };
}
