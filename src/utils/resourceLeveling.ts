import type { ExtendedTask } from "../types/types";
import { isWorkingDay, createDefaultCalendar } from "../utils/calendarCalculations";

/**
 * Resource leveling algorithm implementation
 */
export interface ResourceLevelingResult {
  tasks: ExtendedTask[];
  changes: {
    taskId: string;
    originalStart: Date;
    originalEnd: Date;
    newStart: Date;
    newEnd: Date;
    reason: string;
  }[];
}

/**
 * Get total resource allocation for a specific date from a list of tasks
 */
export function getResourceAllocation(
  resourceId: string,
  date: Date,
  tasks: ExtendedTask[]
): number {
  let totalAllocation = 0;
  
  // Filter tasks that use this resource and cover the date
  // We treat start and end as inclusive for allocation checking
  const activeTasks = tasks.filter(task => {
    if (!task.resources) return false;
    const usesResource = task.resources.some(tr => tr.resourceId === resourceId);
    if (!usesResource) return false;
    
    const taskStart = new Date(task.start);
    const taskEnd = new Date(task.end);
    
    // Normalize dates to remove time component for day-level granularity
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const start = new Date(taskStart);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(taskEnd);
    end.setHours(0, 0, 0, 0);
    
    return checkDate >= start && checkDate <= end;
  });

  for (const task of activeTasks) {
    const resource = task.resources?.find(tr => tr.resourceId === resourceId);
    if (resource) {
      totalAllocation += resource.allocation || 0;
    }
  }

  return totalAllocation;
}

/**
 * Check if placing a task at a specific start date would cause overallocation
 */
function wouldBeOverallocated(
  task: ExtendedTask,
  startDate: Date,
  duration: number,
  otherTasks: ExtendedTask[]
): boolean {
  if (!task.resources || task.resources.length === 0) return false;

  const defaultCalendar = createDefaultCalendar();
  let currentDate = new Date(startDate);
  let daysChecked = 0;

  // Check each day of the task's duration
  while (daysChecked < duration) {
    // Skip non-working days for duration calculation, but we still need to check if we are placing it on a working day
    // Actually, if it's a non-working day, the task "pauses", so no allocation?
    // For simplicity, let's assume standard calendar: work happens on working days.
    
    if (isWorkingDay(currentDate, defaultCalendar)) {
        for (const res of task.resources) {
            const existingAllocation = getResourceAllocation(res.resourceId, currentDate, otherTasks);
            if (existingAllocation + (res.allocation || 0) > 100) {
                return true;
            }
        }
        daysChecked++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return false;
}

/**
 * Find the next available start date for a task
 */
export function findNextAvailableDate(
  task: ExtendedTask,
  earliestStart: Date,
  fixedTasks: ExtendedTask[]
): Date {
  let candidateDate = new Date(earliestStart);
  const maxIterations = 365 * 2; // Limit search
  let iterations = 0;
  const defaultCalendar = createDefaultCalendar();
  
  // Calculate duration in working days
  const duration = Math.max(1, Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)));

  while (iterations < maxIterations) {
    // Fast forward to a working day
    while (!isWorkingDay(candidateDate, defaultCalendar)) {
        candidateDate.setDate(candidateDate.getDate() + 1);
    }

    if (!wouldBeOverallocated(task, candidateDate, duration, fixedTasks)) {
      return candidateDate;
    }

    // Try next day
    candidateDate.setDate(candidateDate.getDate() + 1);
    iterations++;
  }

  return earliestStart; // Fallback
}

/**
 * Perform resource leveling on the project tasks
 */
export function performResourceLeveling(
  tasks: ExtendedTask[]
): ResourceLevelingResult {
  // 1. Separate tasks into those we can move (not completed, not locked) and those we can't.
  // For now, assume we can move any task that is not 'completed'.
  // Also respect priority.
  
  const priorityOrder: { [key: string]: number } = {
    'critical': 0,
    'high': 1,
    'medium': 2,
    'low': 3
  };

  // Sort by priority then by start date
  const sortedTasks = [...tasks].sort((a, b) => {
    const pA = priorityOrder[a.priority] ?? 99;
    const pB = priorityOrder[b.priority] ?? 99;
    if (pA !== pB) return pA - pB;
    return a.start.getTime() - b.start.getTime();
  });

  const fixedTasks: ExtendedTask[] = [];
  const leveledTasks: ExtendedTask[] = [];
  const changes: ResourceLevelingResult['changes'] = [];

  // We will build the schedule incrementally.
  // "Fixed" tasks are those already placed in this leveling pass.
  
  for (const task of sortedTasks) {
      if (task.status === 'completed') {
          fixedTasks.push(task);
          leveledTasks.push(task);
          continue;
      }

      // It's a task we can move.
      // Find earliest start date (respecting constraints and dependencies would be ideal, but here we just respect resource availability based on current start)
      // Note: We should probably respect dependencies too, but that's complex. 
      // Let's assume the current 'start' is valid regarding dependencies.
      
      const originalStart = new Date(task.start);
      const originalEnd = new Date(task.end);
      
      const newStart = findNextAvailableDate(task, originalStart, fixedTasks);
      
      // Calculate new end date
      const duration = Math.max(1, Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)));
      // Add duration (simplistic, doesn't skip weekends properly here for end date calc, but sufficient for now)
      // Better:
      let daysAdded = 0;
      let d = new Date(newStart);
      const defaultCalendar = createDefaultCalendar();
      while (daysAdded < duration) {
          if (isWorkingDay(d, defaultCalendar)) {
              daysAdded++;
          }
          if (daysAdded < duration) d.setDate(d.getDate() + 1);
      }
      // The loop finishes when we have covered 'duration' working days. 'd' is the end date.
      const calculatedEnd = new Date(d);

      // Create new task object
      const newTask = {
          ...task,
          start: newStart,
          end: calculatedEnd
      };

      if (newStart.getTime() !== originalStart.getTime()) {
          changes.push({
              taskId: task.id,
              originalStart,
              originalEnd,
              newStart,
              newEnd: calculatedEnd,
              reason: 'Resource overallocation'
          });
      }

      fixedTasks.push(newTask);
      leveledTasks.push(newTask);
  }

  return {
    tasks: leveledTasks,
    changes
  };
}

export function levelResourcesByPriority(tasks: ExtendedTask[]): ResourceLevelingResult {
    return performResourceLeveling(tasks);
}
