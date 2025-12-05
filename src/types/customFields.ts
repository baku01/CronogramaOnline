import type { ExtendedTask } from './types';

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

export interface TaskWithCustomFields extends ExtendedTask {
  customFields?: { [fieldId: string]: string | number | boolean | null };
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'flag' | 'duration' | 'cost';
  description?: string;
  formula?: string;
  lookupTable?: Array<{ value: string; label: string }>;
  defaultValue?: string | number | boolean | null;
  isRequired?: boolean;
  isVisible?: boolean;
  category: 'task' | 'resource' | 'assignment';
  displayOrder?: number;
}

export interface CustomFieldValue {
  fieldId: string;
  value: string | number | boolean | null;
  taskId?: string;
  resourceId?: string;
  assignmentId?: string;
}