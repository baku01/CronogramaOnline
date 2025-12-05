import { addDays, differenceInDays, isWithinInterval } from 'date-fns';
import { DEFAULT_WORKING_DAYS } from './dateCalculations';
import type { ProjectCalendar, ExtendedTask } from '../types/types';

/**
 * Check if a date is a working day according to a calendar
 */
export function isWorkingDay(date: Date, calendar: ProjectCalendar): boolean {
  // Check if it's a standard working day
  const dayOfWeek = date.getDay();
  const isStandardWorkingDay = calendar.workingDays.includes(dayOfWeek);
  
  // Check for exceptions
  for (const exception of calendar.exceptions) {
    if (isWithinInterval(date, { start: exception.startDate, end: exception.endDate })) {
      return exception.isWorkingTime;
    }
  }
  
  return isStandardWorkingDay;
}

/**
 * Calculate the next working day according to a calendar
 */
export function getNextWorkingDay(date: Date, calendar: ProjectCalendar): Date {
  let nextDay = addDays(date, 1);
  while (!isWorkingDay(nextDay, calendar)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
}

/**
 * Calculate the previous working day according to a calendar
 */
export function getPreviousWorkingDay(date: Date, calendar: ProjectCalendar): Date {
  let prevDay = addDays(date, -1);
  while (!isWorkingDay(prevDay, calendar)) {
    prevDay = addDays(prevDay, -1);
  }
  return prevDay;
}

/**
 * Add working days to a date according to a calendar
 */
export function addWorkingDays(
  date: Date,
  days: number,
  calendar: ProjectCalendar
): Date {
  let result = new Date(date);
  let remainingDays = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;

  while (remainingDays > 0) {
    result = addDays(result, direction);
    if (isWorkingDay(result, calendar)) {
      remainingDays--;
    }
  }

  return result;
}

/**
 * Calculate working days between two dates according to a calendar
 */
export function getWorkingDaysBetween(
  startDate: Date,
  endDate: Date,
  calendar: ProjectCalendar
): number {
  let count = 0;
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    if (isWorkingDay(current, calendar)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
}

/**
 * Calculate task end date based on start date and duration using a calendar
 */
export function calculateEndDateWithCalendar(
  startDate: Date,
  duration: number,
  calendar: ProjectCalendar
): Date {
  if (duration <= 0) return startDate;
  return addWorkingDays(startDate, duration - 1, calendar);
}

/**
 * Calculate task start date based on end date and duration using a calendar
 */
export function calculateStartDateWithCalendar(
  endDate: Date,
  duration: number,
  calendar: ProjectCalendar
): Date {
  if (duration <= 0) return endDate;
  return addWorkingDays(endDate, -(duration - 1), calendar);
}

/**
 * Calculate forward pass with calendar considerations
 */
export function calculateForwardPassWithCalendar(
  tasks: ExtendedTask[],
  dependencies: { fromTaskId: string; toTaskId: string }[],
  calendars: ProjectCalendar[],
  defaultCalendar: ProjectCalendar
): Map<string, { earlyStart: Date; earlyFinish: Date }> {
  const result = new Map<string, { earlyStart: Date; earlyFinish: Date }>();
  const processed = new Set<string>();

  // Create dependency map for quick lookup
  const dependencyMap = new Map<string, { fromTaskId: string; toTaskId: string }[]>();
  dependencies.forEach(dep => {
    if (!dependencyMap.has(dep.toTaskId)) {
      dependencyMap.set(dep.toTaskId, []);
    }
    dependencyMap.get(dep.toTaskId)!.push(dep);
  });

  // Get the calendar for a task
  const getTaskCalendar = (task: ExtendedTask) => {
    if (task.calendarId) {
      return calendars.find(cal => cal.id === task.calendarId) || defaultCalendar;
    }
    return defaultCalendar;
  };

  // Process tasks
  const processTask = (task: ExtendedTask) => {
    if (processed.has(task.id)) return;

    const taskDeps = dependencyMap.get(task.id) || [];
    const taskCalendar = getTaskCalendar(task);

    if (taskDeps.length === 0) {
      // No predecessors - use task's original start date
      const earlyStart = task.start;
      const duration = task.duration || differenceInDays(task.end, task.start) + 1;
      const earlyFinish = calculateEndDateWithCalendar(earlyStart, duration, taskCalendar);

      result.set(task.id, { earlyStart, earlyFinish });
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

        // Use the predecessor's calendar to determine early finish
        const predecessorCalendar = getTaskCalendar(predecessor);
        const dependentStart = addWorkingDays(predResult.earlyFinish, 1, predecessorCalendar);

        if (dependentStart > latestPredecessorFinish) {
          latestPredecessorFinish = dependentStart;
        }
      }

      const earlyStart = latestPredecessorFinish;
      const duration = task.duration || differenceInDays(task.end, task.start) + 1;
      const earlyFinish = calculateEndDateWithCalendar(earlyStart, duration, taskCalendar);

      result.set(task.id, { earlyStart, earlyFinish });
    }

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
 * Create a default project calendar
 */
export function createDefaultCalendar(): ProjectCalendar {
  return {
    id: 'default',
    name: 'Padrão',
    workingDays: DEFAULT_WORKING_DAYS,
    hoursPerDay: 8,
    workingHoursPerDay: [
      { start: '08:00', end: '12:00' },
      { start: '13:00', end: '17:00' }
    ],
    exceptions: [],
    isDefault: true
  };
}

/**
 * Get calendar by ID from project calendars
 */
export function getCalendarById(calendars: ProjectCalendar[], calendarId: string): ProjectCalendar | undefined {
  return calendars.find(cal => cal.id === calendarId);
}

/**
 * Get default calendar from project
 */
export function getDefaultCalendar(projectCalendars: ProjectCalendar[]): ProjectCalendar {
  const defaultCal = projectCalendars.find(cal => cal.isDefault);
  if (defaultCal) return defaultCal;
  
  // If no default calendar, return the first one or create a default
  if (projectCalendars.length > 0) {
    return projectCalendars[0];
  }
  
  return createDefaultCalendar();
}