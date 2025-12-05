import type { Task as GanttTask } from 'gantt-task-react';

// Enums replaced with const objects and types
export const TaskStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

export const DependencyType = {
  FS: 'FS', // Finish-to-Start
  SS: 'SS', // Start-to-Start
  FF: 'FF', // Finish-to-Finish
  SF: 'SF', // Start-to-Finish
} as const;

export type DependencyType = typeof DependencyType[keyof typeof DependencyType];

export const ResourceType = {
  PERSON: 'person',
  EQUIPMENT: 'equipment',
  MATERIAL: 'material',
} as const;

export type ResourceType = typeof ResourceType[keyof typeof ResourceType];

// Interfaces
export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  costPerHour?: number;
  availability?: number; // Percentage available (0-100)
  email?: string;
  notes?: string;
}

export interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
  lag?: number; // In days (can be negative for lead time)
}

export interface TaskResource {
  resourceId: string;
  allocation: number; // Percentage (0-100)
  cost?: number;
}

export interface TaskNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy?: string;
}

export interface ExtendedTask extends GanttTask {
  // Core fields from GanttTask
  start: Date;
  end: Date;
  name: string;
  id: string;
  type: 'task' | 'milestone' | 'project';
  progress: number;

  // Optional GanttTask fields
  project?: string;
  dependencies?: string[];
  hideChildren?: boolean;
  displayOrder?: number;

  // Extended fields
  status: TaskStatus;
  priority: TaskPriority;
  mode?: 'auto' | 'manual';
  description?: string;
  duration?: number; // In days
  effort?: number; // In hours
  cost?: number;
  budgetedCost?: number;
  resources?: TaskResource[];
  notes?: TaskNote[];
  tags?: string[];
  assignedTo?: string[];

  // Calculated fields (CPM)
  earlyStart?: Date;
  earlyFinish?: Date;
  lateStart?: Date;
  lateFinish?: Date;
  slack?: number; // Total slack in days
  isCritical?: boolean;

  // Calendar support
  calendarId?: string; // Reference to project calendar
  constraintType?: 'ASAP' | 'ALAP' | 'FNLT' | 'FNET' | 'MFO' | 'MSO' | 'SNET' | 'SNLT'; // ASAP=As Soon As Possible, etc.
  constraintDate?: Date;

  // Baseline support
  baselineStart?: Date;
  baselineEnd?: Date;
  baselineDuration?: number;
  baselineWork?: number;
  baselineCost?: number;
  baselineProgress?: number;

  // Custom fields
  customFields?: { [fieldId: string]: string | number | boolean | null };

  // Recurring tasks
  isRecurring?: boolean;
  recurrenceRule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endType: 'never' | 'afterOccurrences' | 'endDate';
    endAfterOccurrences?: number;
    endDate?: Date;
    weekDays?: number[];
    monthDay?: number;
    yearMonth?: number;
    yearDay?: number;
  };
  parentTaskId?: string;
  isRecurringInstance?: boolean;
  recurrenceInstanceNumber?: number;

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface CalendarException {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isWorkingTime: boolean; // true for working time, false for non-working time
  description?: string;
}

export interface ProjectCalendar {
  id: string;
  name: string;
  baseCalendarId?: string; // For derived calendars
  workingDays: number[]; // 0-6, where 0 is Sunday (1=Monday, 7=Sunday)
  hoursPerDay: number;
  workingHoursPerDay: Array<{ start: string; end: string }>; // Format: "HH:mm"
  exceptions: CalendarException[];
  isDefault: boolean;
}

export interface ResourceCalendar {
  id: string;
  name: string;
  resourceId: string;
  baseCalendarId?: string;
  workingDays: number[];
  hoursPerDay: number;
  workingHoursPerDay: Array<{ start: string; end: string }>;
  exceptions: CalendarException[];
}

export interface TaskCalendar {
  id: string;
  name: string;
  taskId: string;
  baseCalendarId?: string;
  workingDays: number[];
  hoursPerDay: number;
  workingHoursPerDay: Array<{ start: string; end: string }>;
  exceptions: CalendarException[];
}

export interface TaskBaseline {
  id: string; // e.g. "BASELINE1", "BASELINE2", etc.
  name: string;
  description?: string;
  savedDate: Date;
  tasks: Array<{
    taskId: string;
    start: Date;
    end: Date;
    duration?: number;
    work?: number;
    cost?: number;
    progress?: number;
  }>;
  projectStartDate: Date;
  projectEndDate: Date;
  totalCost?: number;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'flag' | 'duration' | 'cost';
  description?: string;
  formula?: string; // For calculated fields
  lookupTable?: Array<{ value: string; label: string }>; // For dropdown values
  defaultValue?: string | number | boolean | null;
  isRequired?: boolean;
  isVisible?: boolean;
  category: 'task' | 'resource' | 'assignment'; // Field category
  displayOrder?: number;
}

export interface CustomFieldValue {
  fieldId: string;
  value: string | number | boolean | null;
  taskId?: string;
  resourceId?: string;
  assignmentId?: string;
}

export interface ProjectScenario {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  // Snapshot data
  tasks: ExtendedTask[];
  dependencies: TaskDependency[];
  resources: Resource[];
  startDate: Date;
  endDate: Date;
}

export interface Project {
  id: string;
  name: string;
  author?: string;
  version?: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: TaskStatus;
  progress: number;

  // Collections
  tasks: ExtendedTask[];
  dependencies: TaskDependency[];
  resources: Resource[];

  // Calculated
  totalCost?: number;
  budgetedCost?: number;
  criticalPath?: string[]; // Array of task IDs

  // Settings
  workingDays?: number[]; // 0-6, where 0 is Sunday
  hoursPerDay?: number;

  // Calendar system
  calendars?: ProjectCalendar[];
  defaultCalendarId?: string;

  // Baseline management
  baselines?: TaskBaseline[];

  // Scenario management
  scenarios?: ProjectScenario[];
  activeScenarioId?: string | null;
  liveData?: {
    tasks: ExtendedTask[];
    dependencies: TaskDependency[];
    resources: Resource[];
    startDate: Date;
    endDate: Date;
  };

  // Custom fields
  customFields?: CustomField[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CriticalPathResult {
  path: string[]; // Array of task IDs
  duration: number; // Total duration in days
  tasks: ExtendedTask[];
}

export interface ProjectStatistics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  overdueTasks: number;
  totalCost: number;
  budgetedCost: number;
  costVariance: number;
  progressPercentage: number;
  criticalPathLength: number;
}

// View configuration
export interface ViewConfig {
  showCriticalPath: boolean;
  showSlack: boolean;
  showResources: boolean;
  showCost: boolean;
  highlightOverdue: boolean;
  groupByProject: boolean;
}

// Filter configuration
export interface FilterConfig {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedTo?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

// Export options
export interface ExportOptions {
  format: 'json' | 'csv';
  includeResources: boolean;
  includeDependencies: boolean;
  includeNotes: boolean;
}
