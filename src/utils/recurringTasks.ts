import type { ExtendedTask } from "../types/types";

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  endType: 'never' | 'afterOccurrences' | 'endDate';
  endAfterOccurrences?: number;
  endDate?: Date;
  weekDays?: number[]; // For weekly: 0-6 (Sunday-Saturday)
  monthDay?: number; // For monthly: day of month (1-31)
  yearMonth?: number; // For yearly: month (0-11)
  yearDay?: number; // For yearly: day of month (1-31)
}

export interface RecurringTaskConfig {
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  parentTaskId?: string; // For grouping recurring instances
}

/**
 * Generate recurring task instances based on a template task
 */
export function generateRecurringTasks(
  templateTask: ExtendedTask,
  recurrenceRule: RecurrenceRule,
  maxInstances: number = 100
): ExtendedTask[] {
  const instances: ExtendedTask[] = [];
  const duration = Math.ceil((templateTask.end.getTime() - templateTask.start.getTime()) / (1000 * 60 * 60 * 24));
  
  let currentDate = new Date(templateTask.start);
  let occurrenceCount = 0;
  
  while (occurrenceCount < maxInstances) {
    // Check if we should stop based on end conditions
    if (recurrenceRule.endType === 'afterOccurrences' && 
        recurrenceRule.endAfterOccurrences && 
        occurrenceCount >= recurrenceRule.endAfterOccurrences) {
      break;
    }
    
    if (recurrenceRule.endType === 'endDate' && 
        recurrenceRule.endDate && 
        currentDate > recurrenceRule.endDate) {
      break;
    }
    
    // Create instance
    const instanceStart = new Date(currentDate);
    const instanceEnd = new Date(instanceStart);
    instanceEnd.setDate(instanceEnd.getDate() + duration - 1);
    
    const instance: ExtendedTask = {
      ...templateTask,
      id: `${templateTask.id}_${occurrenceCount + 1}`,
      name: `${templateTask.name} (${occurrenceCount + 1})`,
      start: instanceStart,
      end: instanceEnd,
      parentTaskId: templateTask.id,
      isRecurringInstance: true,
      recurrenceInstanceNumber: occurrenceCount + 1,
    } as ExtendedTask;
    
    instances.push(instance);
    occurrenceCount++;
    
    // Calculate next occurrence date
    currentDate = calculateNextOccurrence(currentDate, recurrenceRule);
  }
  
  return instances;
}

/**
 * Calculate the next occurrence date based on recurrence rule
 */
export function calculateNextOccurrence(currentDate: Date, rule: RecurrenceRule): Date {
  const nextDate = new Date(currentDate);
  
  switch (rule.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + rule.interval);
      break;
      
    case 'weekly':
      if (rule.weekDays && rule.weekDays.length > 0) {
        // Find next valid weekday
        let daysToAdd = 1;
        while (daysToAdd < 365) { // Safety limit
          nextDate.setDate(nextDate.getDate() + 1);
          if (rule.weekDays!.includes(nextDate.getDay())) {
            break;
          }
          daysToAdd++;
        }
      } else {
        nextDate.setDate(nextDate.getDate() + (7 * rule.interval));
      }
      break;
      
    case 'monthly':
      if (rule.monthDay) {
        // Set to specific day of month
        nextDate.setMonth(nextDate.getMonth() + rule.interval);
        const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(rule.monthDay, daysInMonth));
      } else {
        // Same day of month, X months later
        nextDate.setMonth(nextDate.getMonth() + rule.interval);
      }
      break;
      
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + rule.interval);
      if (rule.yearMonth !== undefined) {
        nextDate.setMonth(rule.yearMonth);
        if (rule.yearDay) {
          const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
          nextDate.setDate(Math.min(rule.yearDay, daysInMonth));
        }
      }
      break;
  }
  
  return nextDate;
}

/**
 * Validate a recurrence rule
 */
export function validateRecurrenceRule(rule: RecurrenceRule): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (rule.interval < 1) {
    errors.push('Interval must be at least 1');
  }
  
  if (rule.frequency === 'weekly' && rule.weekDays && rule.weekDays.length === 0) {
    errors.push('Weekly recurrence must specify at least one weekday');
  }
  
  if (rule.frequency === 'monthly' && rule.monthDay && (rule.monthDay < 1 || rule.monthDay > 31)) {
    errors.push('Monthly day must be between 1 and 31');
  }
  
  if (rule.frequency === 'yearly') {
    if (rule.yearMonth !== undefined && (rule.yearMonth < 0 || rule.yearMonth > 11)) {
      errors.push('Year month must be between 0 (January) and 11 (December)');
    }
    if (rule.yearDay && (rule.yearDay < 1 || rule.yearDay > 31)) {
      errors.push('Year day must be between 1 and 31');
    }
  }
  
  if (rule.endType === 'afterOccurrences' && 
      (!rule.endAfterOccurrences || rule.endAfterOccurrences < 1)) {
    errors.push('End after occurrences must be at least 1');
  }
  
  if (rule.endType === 'endDate' && !rule.endDate) {
    errors.push('End date is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get human-readable description of recurrence rule
 */
export function getRecurrenceDescription(rule: RecurrenceRule): string {
  const parts: string[] = [];
  
  // Frequency and interval
  switch (rule.frequency) {
    case 'daily':
      parts.push(rule.interval === 1 ? 'Daily' : `Every ${rule.interval} days`);
      break;
    case 'weekly':
      if (rule.weekDays && rule.weekDays.length > 0) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const selectedDays = rule.weekDays.map(day => dayNames[day]).join(', ');
        parts.push(`Every ${rule.interval === 1 ? '' : `${rule.interval} `}week on ${selectedDays}`);
      } else {
        parts.push(rule.interval === 1 ? 'Weekly' : `Every ${rule.interval} weeks`);
      }
      break;
    case 'monthly':
      if (rule.monthDay) {
        const suffix = getDaySuffix(rule.monthDay);
        parts.push(`Monthly on the ${rule.monthDay}${suffix}`);
      } else {
        parts.push(rule.interval === 1 ? 'Monthly' : `Every ${rule.interval} months`);
      }
      break;
    case 'yearly':
      if (rule.yearMonth !== undefined) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        if (rule.yearDay) {
          const suffix = getDaySuffix(rule.yearDay);
          parts.push(`Yearly on ${monthNames[rule.yearMonth]} ${rule.yearDay}${suffix}`);
        } else {
          parts.push(`Yearly in ${monthNames[rule.yearMonth]}`);
        }
      } else {
        parts.push(rule.interval === 1 ? 'Yearly' : `Every ${rule.interval} years`);
      }
      break;
  }
  
  // End condition
  switch (rule.endType) {
    case 'never':
      parts.push('(no end date)');
      break;
    case 'afterOccurrences':
      parts.push(`for ${rule.endAfterOccurrences} occurrence${rule.endAfterOccurrences === 1 ? '' : 's'}`);
      break;
    case 'endDate':
      if (rule.endDate) {
        parts.push(`until ${rule.endDate.toLocaleDateString()}`);
      }
      break;
  }
  
  return parts.join(' ');
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}