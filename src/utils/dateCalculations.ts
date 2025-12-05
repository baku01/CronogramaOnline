import { addDays, differenceInDays } from 'date-fns';
import { DependencyType } from '../types/types';
import type { ExtendedTask, TaskDependency } from '../types/types';

/**
 * Default working days (Monday to Friday)
 */
export const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5];

/**
 * Check if a date is a working day
 */
export function isWorkingDay(date: Date, workingDays: number[] = DEFAULT_WORKING_DAYS): boolean {
  const dayOfWeek = date.getDay();
  return workingDays.includes(dayOfWeek);
}

/**
 * Calculate the next working day
 */
export function getNextWorkingDay(date: Date, workingDays: number[] = DEFAULT_WORKING_DAYS): Date {
  let nextDay = addDays(date, 1);
  while (!isWorkingDay(nextDay, workingDays)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
}

/**
 * Calculate the previous working day
 */
export function getPreviousWorkingDay(date: Date, workingDays: number[] = DEFAULT_WORKING_DAYS): Date {
  let prevDay = addDays(date, -1);
  while (!isWorkingDay(prevDay, workingDays)) {
    prevDay = addDays(prevDay, -1);
  }
  return prevDay;
}

/**
 * Add working days to a date
 */
export function addWorkingDays(
  date: Date,
  days: number,
  workingDays: number[] = DEFAULT_WORKING_DAYS
): Date {
  let result = new Date(date);
  let remainingDays = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;

  while (remainingDays > 0) {
    result = addDays(result, direction);
    if (isWorkingDay(result, workingDays)) {
      remainingDays--;
    }
  }

  return result;
}

/**
 * Calculate working days between two dates
 */
export function getWorkingDaysBetween(
  startDate: Date,
  endDate: Date,
  workingDays: number[] = DEFAULT_WORKING_DAYS
): number {
  let count = 0;
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    if (isWorkingDay(current, workingDays)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
}

/**
 * Calculate task end date based on start date and duration
 */
export function calculateEndDate(
  startDate: Date,
  duration: number,
  workingDays: number[] = DEFAULT_WORKING_DAYS
): Date {
  if (duration <= 0) return startDate;
  return addWorkingDays(startDate, duration - 1, workingDays);
}

/**
 * Calculate task start date based on end date and duration
 */
export function calculateStartDate(
  endDate: Date,
  duration: number,
  workingDays: number[] = DEFAULT_WORKING_DAYS
): Date {
  if (duration <= 0) return endDate;
  return addWorkingDays(endDate, -(duration - 1), workingDays);
}

/**
 * Calculate dependent task start date based on dependency type
 */
export function calculateDependentStartDate(
  predecessorTask: ExtendedTask,
  dependency: TaskDependency,
  workingDays: number[] = DEFAULT_WORKING_DAYS
): Date {
  const lag = dependency.lag || 0;

  switch (dependency.type) {
    case DependencyType.FS: // Finish-to-Start
      return addWorkingDays(predecessorTask.end, lag + 1, workingDays);

    case DependencyType.SS: // Start-to-Start
      return addWorkingDays(predecessorTask.start, lag, workingDays);

    case DependencyType.FF: // Finish-to-Finish
      // For FF, we need to work backwards from predecessor's finish
      return addWorkingDays(predecessorTask.end, lag, workingDays);

    case DependencyType.SF: // Start-to-Finish
      return addWorkingDays(predecessorTask.start, lag, workingDays);

    default:
      return addWorkingDays(predecessorTask.end, lag + 1, workingDays);
  }
}

/**
 * Critical Path Method (CPM) - Forward Pass
 */
export function calculateForwardPass(
  tasks: ExtendedTask[],
  dependencies: TaskDependency[],
  workingDays: number[] = DEFAULT_WORKING_DAYS
): Map<string, { earlyStart: Date; earlyFinish: Date }> {
  const result = new Map<string, { earlyStart: Date; earlyFinish: Date }>();
  const processed = new Set<string>();

  // Create dependency map for quick lookup
  const dependencyMap = new Map<string, TaskDependency[]>();
  dependencies.forEach(dep => {
    if (!dependencyMap.has(dep.toTaskId)) {
      dependencyMap.set(dep.toTaskId, []);
    }
    dependencyMap.get(dep.toTaskId)!.push(dep);
  });

  // Process tasks
  const processTask = (task: ExtendedTask) => {
    if (processed.has(task.id)) return;

    const taskDeps = dependencyMap.get(task.id) || [];
    let earlyStart: Date;
    let earlyFinish: Date | undefined;
    const duration = task.duration || differenceInDays(task.end, task.start) + 1;

    if (taskDeps.length === 0) {
      // No predecessors - use task's original start date
      earlyStart = task.start;
    } else {
      // Has predecessors - calculate based on dependencies
      let latestPredecessorFinish = task.start;

      for (const dep of taskDeps) {
        const predecessor = tasks.find(t => t.id === dep.fromTaskId);
        if (!predecessor) continue;

        // Ensure predecessor is processed first
        if (!processed.has(predecessor.id)) {
          processTask(predecessor);
        }

        const predResult = result.get(predecessor.id);
        if (!predResult) continue;

        const dependentStart = calculateDependentStartDate(
          { ...predecessor, end: predResult.earlyFinish },
          dep,
          workingDays
        );

        if (dependentStart > latestPredecessorFinish) {
          latestPredecessorFinish = dependentStart;
        }
      }

      earlyStart = latestPredecessorFinish;
    }

    // Apply Constraints (Forward Pass)
    if (task.constraintType && task.constraintDate) {
      const constraintDate = new Date(task.constraintDate);

      switch (task.constraintType) {
        case 'MSO': // Must Start On
          earlyStart = constraintDate;
          break;
        case 'MFO': // Must Finish On
          earlyFinish = constraintDate;
          earlyStart = calculateStartDate(earlyFinish, duration, workingDays);
          break;
        case 'SNET': // Start No Earlier Than
          if (earlyStart < constraintDate) {
            earlyStart = constraintDate;
          }
          break;
        case 'FNET': // Finish No Earlier Than
          // Calculate tentative finish based on current earlyStart
          let tentativeFinish = calculateEndDate(earlyStart, duration, workingDays);
          if (tentativeFinish < constraintDate) {
            earlyFinish = constraintDate;
            earlyStart = calculateStartDate(earlyFinish, duration, workingDays);
          }
          break;
      }
    }

    // Calculate finish if not already set by MFO/FNET
    if (!earlyFinish) {
      earlyFinish = calculateEndDate(earlyStart, duration, workingDays);
    }

    result.set(task.id, { earlyStart, earlyFinish });
    processed.add(task.id);
  };

  // Process all tasks
  tasks.forEach(task => {
    if (task.type !== 'project') {
      processTask(task);
    }
  });

  return result;
}

/**
 * Critical Path Method (CPM) - Backward Pass
 */
export function calculateBackwardPass(
  tasks: ExtendedTask[],
  dependencies: TaskDependency[],
  forwardPassResults: Map<string, { earlyStart: Date; earlyFinish: Date }>,
  projectEndDate: Date,
  workingDays: number[] = DEFAULT_WORKING_DAYS
): Map<string, { lateStart: Date; lateFinish: Date }> {
  const result = new Map<string, { lateStart: Date; lateFinish: Date }>();
  const processed = new Set<string>();

  // Create reverse dependency map (successors)
  const successorMap = new Map<string, TaskDependency[]>();
  dependencies.forEach(dep => {
    if (!successorMap.has(dep.fromTaskId)) {
      successorMap.set(dep.fromTaskId, []);
    }
    successorMap.get(dep.fromTaskId)!.push(dep);
  });

  // Process tasks in reverse
  const processTask = (task: ExtendedTask) => {
    if (processed.has(task.id)) return;

    const taskSuccessors = successorMap.get(task.id) || [];
    const duration = task.duration || differenceInDays(task.end, task.start) + 1;
    let lateFinish: Date;
    let lateStart: Date | undefined;

    if (taskSuccessors.length === 0) {
      // No successors - use project end date or task's early finish
      const forwardResult = forwardPassResults.get(task.id);
      lateFinish = forwardResult ? forwardResult.earlyFinish : projectEndDate;

      // If project end date is earlier than early finish (e.g. constraints pushed it), use early finish
      if (forwardResult && forwardResult.earlyFinish > projectEndDate) {
        lateFinish = forwardResult.earlyFinish;
      }
    } else {
      // Has successors - calculate based on dependencies
      let earliestSuccessorStart: Date | null = null;

      for (const dep of taskSuccessors) {
        const successor = tasks.find(t => t.id === dep.toTaskId);
        if (!successor) continue;

        // Ensure successor is processed first
        if (!processed.has(successor.id)) {
          processTask(successor);
        }

        const succResult = result.get(successor.id);
        if (!succResult) continue;

        // Calculate latest finish based on successor's late start
        let requiredFinish: Date;
        const lag = dep.lag || 0;

        switch (dep.type) {
          case DependencyType.FS:
            requiredFinish = addWorkingDays(succResult.lateStart, -(lag + 1), workingDays);
            break;
          case DependencyType.SS:
            requiredFinish = addWorkingDays(succResult.lateStart, -lag, workingDays);
            requiredFinish = calculateEndDate(requiredFinish, duration, workingDays);
            break;
          case DependencyType.FF:
            requiredFinish = addWorkingDays(succResult.lateFinish, -lag, workingDays);
            break;
          case DependencyType.SF:
            requiredFinish = addWorkingDays(succResult.lateFinish, -lag, workingDays);
            break;
          default:
            requiredFinish = addWorkingDays(succResult.lateStart, -(lag + 1), workingDays);
        }

        if (earliestSuccessorStart === null || requiredFinish < earliestSuccessorStart) {
          earliestSuccessorStart = requiredFinish;
        }
      }

      lateFinish = earliestSuccessorStart || projectEndDate;
    }

    // Apply Constraints (Backward Pass)
    if (task.constraintType && task.constraintDate) {
      const constraintDate = new Date(task.constraintDate);

      switch (task.constraintType) {
        case 'MSO': // Must Start On
          lateStart = constraintDate;
          lateFinish = calculateEndDate(lateStart, duration, workingDays);
          break;
        case 'MFO': // Must Finish On
          lateFinish = constraintDate;
          lateStart = calculateStartDate(lateFinish, duration, workingDays);
          break;
        case 'SNLT': // Start No Later Than
          // We calculate tentative lateStart first, then check
          let tentativeLateStart = calculateStartDate(lateFinish, duration, workingDays);
          if (tentativeLateStart > constraintDate) {
            lateStart = constraintDate;
            lateFinish = calculateEndDate(lateStart, duration, workingDays);
          }
          break;
        case 'FNLT': // Finish No Later Than
          if (lateFinish > constraintDate) {
            lateFinish = constraintDate;
            // lateStart will be recalculated below
          }
          break;
      }
    }

    // Calculate start if not already set by MSO/SNLT
    if (!lateStart) {
      lateStart = calculateStartDate(lateFinish, duration, workingDays);
    }

    result.set(task.id, { lateStart, lateFinish });
    processed.add(task.id);
  };

  // Process all tasks in reverse order
  const reversedTasks = [...tasks].reverse();
  reversedTasks.forEach(task => {
    if (task.type !== 'project') {
      processTask(task);
    }
  });

  return result;
}

/**
 * Calculate slack (float) for all tasks
 */
export function calculateSlack(
  tasks: ExtendedTask[],
  dependencies: TaskDependency[],
  workingDays: number[] = DEFAULT_WORKING_DAYS
): Map<string, number> {
  const slackMap = new Map<string, number>();

  // Find project end date (latest early finish)
  const projectEndDate = tasks.reduce((latest, task) => {
    if (task.type === 'project') return latest;
    return task.end > latest ? task.end : latest;
  }, new Date(0));

  // Forward pass
  const forwardPass = calculateForwardPass(tasks, dependencies, workingDays);

  // Backward pass
  const backwardPass = calculateBackwardPass(tasks, dependencies, forwardPass, projectEndDate, workingDays);

  // Calculate slack for each task
  tasks.forEach(task => {
    if (task.type === 'project') return;

    const forward = forwardPass.get(task.id);
    const backward = backwardPass.get(task.id);

    if (forward && backward) {
      const slack = differenceInDays(backward.lateStart, forward.earlyStart);
      slackMap.set(task.id, slack);
    }
  });

  return slackMap;
}

/**
 * Calculate critical path
 */
export function calculateCriticalPath(
  tasks: ExtendedTask[],
  dependencies: TaskDependency[],
  workingDays: number[] = DEFAULT_WORKING_DAYS
): string[] {
  const slackMap = calculateSlack(tasks, dependencies, workingDays);

  // Critical tasks have zero or near-zero slack
  const criticalTasks = tasks
    .filter(task => {
      const slack = slackMap.get(task.id);
      return slack !== undefined && slack <= 0;
    })
    .map(task => task.id);

  return criticalTasks;
}
