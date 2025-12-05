import type { CustomField, ExtendedTask, Resource, Project } from "../types/types";

/**
 * Calculate a custom field value based on a formula
 */
export function calculateCustomField(formula: string, task: ExtendedTask, resource?: Resource): string | number | boolean | null {
  // Simple formula evaluation - in a real implementation, this would be more sophisticated
  try {
    // Example: calculate 'costPerHour * hours' for a duration field
    if (formula.includes('costPerHour') && resource) {
      return (resource.costPerHour || 0) * (task.effort || 0);
    }
    
    // Example: calculate days between start and end dates
    if (formula === 'endDate - startDate') {
      const diffTime = Math.abs(task.end.getTime() - task.start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Add more formula implementations as needed
    return null;
  } catch (error) {
    console.error('Error calculating custom field:', error);
    return null;
  }
}

/**
 * Apply custom field values to a task
 */
export function applyCustomFieldsToTask(task: ExtendedTask, customFieldValues: { [fieldId: string]: string | number | boolean | null }): ExtendedTask {
  return {
    ...task,
    customFields: {
      ...task.customFields,
      ...customFieldValues
    }
  };
}

/**
 * Validate a custom field value based on its type
 */
export function validateCustomFieldValue(value: unknown, field: CustomField): boolean {
  switch (field.type) {
    case 'number':
      return typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)));
    case 'date':
      if (value instanceof Date) return true;
      if (typeof value === 'string') return !isNaN(Date.parse(value));
      return false;
    case 'flag':
      return typeof value === 'boolean';
    case 'dropdown':
      if (field.lookupTable) {
        return field.lookupTable.some((option: { value: string; label: string }) => option.value === value);
      }
      return typeof value === 'string';
    case 'duration':
      return typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)));
    case 'cost':
      return typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)));
    case 'text':
    default:
      return typeof value === 'string' || typeof value === 'number';
  }
}

/**
 * Get custom field value by ID for a task
 */
export function getCustomFieldValue(task: ExtendedTask, fieldId: string): unknown {
  return task.customFields ? task.customFields[fieldId] : undefined;
}

/**
 * Process all custom fields in a project to calculate values
 */
export function processCustomFields(project: Project): Project {
  // Calculate values for any fields with formulas
  if (project.customFields) {
    const formulaFields = project.customFields.filter(field => field.formula);
    
    if (formulaFields.length > 0) {
      const updatedTasks = project.tasks.map(task => {
        const customFieldValues = { ...task.customFields };
        
        for (const field of formulaFields) {
          if (field.formula) {
            const calculatedValue = calculateCustomField(field.formula, task);
            customFieldValues[field.id] = calculatedValue;
          }
        }
        
        return applyCustomFieldsToTask(task, customFieldValues);
      });
      
      return {
        ...project,
        tasks: updatedTasks
      };
    }
  }
  
  return project;
}