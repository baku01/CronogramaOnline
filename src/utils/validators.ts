import { DependencyType } from '../types/types';
import type { ExtendedTask, TaskDependency } from '../types/types';

/**
 * Validate that a task has required fields
 */
export function validateTask(task: ExtendedTask): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!task.id || task.id.trim() === '') {
    errors.push('Task ID is required');
  }

  if (!task.name || task.name.trim() === '') {
    errors.push('Task name is required');
  }

  if (!task.start) {
    errors.push('Start date is required');
  }

  if (!task.end) {
    errors.push('End date is required');
  }

  if (task.start && task.end && task.start > task.end) {
    errors.push('Start date must be before or equal to end date');
  }

  if (task.progress < 0 || task.progress > 100) {
    errors.push('Progress must be between 0 and 100');
  }

  if (task.duration !== undefined && task.duration < 0) {
    errors.push('Duration cannot be negative');
  }

  if (task.resources) {
    task.resources.forEach((resource, index) => {
      if (resource.allocation < 0 || resource.allocation > 100) {
        errors.push(`Resource ${index + 1}: Allocation must be between 0 and 100`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate dependencies for circular references
 */
export function validateNoCycles(
  tasks: ExtendedTask[],
  dependencies: TaskDependency[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Build adjacency list
  const graph = new Map<string, string[]>();
  tasks.forEach(task => {
    graph.set(task.id, []);
  });

  dependencies.forEach(dep => {
    const successors = graph.get(dep.fromTaskId) || [];
    successors.push(dep.toTaskId);
    graph.set(dep.fromTaskId, successors);
  });

  // DFS to detect cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(taskId: string, path: string[] = []): boolean {
    if (recursionStack.has(taskId)) {
      errors.push(`Circular dependency detected: ${[...path, taskId].join(' -> ')}`);
      return true;
    }

    if (visited.has(taskId)) {
      return false;
    }

    visited.add(taskId);
    recursionStack.add(taskId);

    const successors = graph.get(taskId) || [];
    for (const successor of successors) {
      if (hasCycle(successor, [...path, taskId])) {
        return true;
      }
    }

    recursionStack.delete(taskId);
    return false;
  }

  // Check all tasks
  for (const task of tasks) {
    if (!visited.has(task.id)) {
      hasCycle(task.id);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that a dependency is valid
 */
export function validateDependency(
  dependency: TaskDependency,
  tasks: ExtendedTask[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!dependency.fromTaskId) {
    errors.push('Dependency must have a source task');
  }

  if (!dependency.toTaskId) {
    errors.push('Dependency must have a target task');
  }

  if (dependency.fromTaskId === dependency.toTaskId) {
    errors.push('A task cannot depend on itself');
  }

  const fromTask = tasks.find(t => t.id === dependency.fromTaskId);
  const toTask = tasks.find(t => t.id === dependency.toTaskId);

  if (!fromTask) {
    errors.push(`Source task ${dependency.fromTaskId} not found`);
  }

  if (!toTask) {
    errors.push(`Target task ${dependency.toTaskId} not found`);
  }

  if (!Object.values(DependencyType).includes(dependency.type)) {
    errors.push('Invalid dependency type');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that adding a new dependency won't create a cycle
 */
export function validateNewDependency(
  newDependency: TaskDependency,
  tasks: ExtendedTask[],
  existingDependencies: TaskDependency[]
): { valid: boolean; errors: string[] } {
  // First validate the dependency itself
  const depValidation = validateDependency(newDependency, tasks);
  if (!depValidation.valid) {
    return depValidation;
  }

  // Check if this creates a cycle
  const allDependencies = [...existingDependencies, newDependency];
  return validateNoCycles(tasks, allDependencies);
}

/**
 * Validate resource allocation doesn't exceed 100%
 */
export function validateResourceAllocation(
  tasks: ExtendedTask[]
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Group tasks by resource and date range
  const resourceUsage = new Map<string, Map<string, number>>();

  tasks.forEach(task => {
    if (!task.resources) return;

    task.resources.forEach(taskResource => {
      if (!resourceUsage.has(taskResource.resourceId)) {
        resourceUsage.set(taskResource.resourceId, new Map());
      }

      const resourceDates = resourceUsage.get(taskResource.resourceId)!;

      // For simplicity, check allocation per day
      const startDate = task.start.toISOString().split('T')[0];
      const endDate = task.end.toISOString().split('T')[0];
      const key = `${startDate}_${endDate}`;

      const currentAllocation = resourceDates.get(key) || 0;
      const newAllocation = currentAllocation + taskResource.allocation;

      resourceDates.set(key, newAllocation);

      if (newAllocation > 100) {
        warnings.push(
          `Resource ${taskResource.resourceId} is over-allocated (${newAllocation}%) during task "${task.name}"`
        );
      }
    });
  });

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Validate that task dates are logical
 */
export function validateTaskDates(task: ExtendedTask): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (task.start < new Date('1900-01-01')) {
    errors.push('Start date is too far in the past');
  }

  if (task.end > new Date('2100-12-31')) {
    errors.push('End date is too far in the future');
  }

  if (task.earlyStart && task.lateStart && task.earlyStart > task.lateStart) {
    errors.push('Early start cannot be after late start');
  }

  if (task.earlyFinish && task.lateFinish && task.earlyFinish > task.lateFinish) {
    errors.push('Early finish cannot be after late finish');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
