import type {
  ExtendedTask,
  Project,
  TaskDependency,
  Resource,
  ExportOptions,
} from '../types/types';

/**
 * Export project to JSON
 */
export function exportToJSON(project: Project): string {
  return JSON.stringify(project, null, 2);
}

/**
 * Export tasks to CSV
 */
export function exportToCSV(
  tasks: ExtendedTask[],
  dependencies: TaskDependency[],
  options: ExportOptions = {
    format: 'csv',
    includeResources: true,
    includeDependencies: true,
    includeNotes: false,
  }
): string {
  const headers = [
    'ID',
    'Name',
    'Type',
    'Start Date',
    'End Date',
    'Duration (days)',
    'Progress (%)',
    'Status',
    'Priority',
    'Description',
  ];

  if (options.includeResources) {
    headers.push('Assigned Resources');
  }

  if (options.includeDependencies) {
    headers.push('Dependencies');
  }

  headers.push('Cost', 'Budgeted Cost');

  if (options.includeNotes) {
    headers.push('Notes');
  }

  const rows: string[][] = [headers];

  tasks.forEach(task => {
    const row = [
      task.id,
      `"${task.name}"`,
      task.type,
      task.start.toISOString().split('T')[0],
      task.end.toISOString().split('T')[0],
      String(task.duration || 0),
      String(task.progress),
      task.status,
      task.priority,
      `"${(task.description || '').replace(/"/g, '""')}"`,
    ];

    if (options.includeResources) {
      const resourceIds = task.resources?.map(r => r.resourceId).join('; ') || '';
      row.push(`"${resourceIds}"`);
    }

    if (options.includeDependencies) {
      const deps = dependencies
        .filter(d => d.toTaskId === task.id)
        .map(d => `${d.fromTaskId} (${d.type})`)
        .join('; ');
      row.push(`"${deps}"`);
    }

    row.push(String(task.cost || 0), String(task.budgetedCost || 0));

    if (options.includeNotes) {
      const notes = task.notes?.map(n => n.content).join(' | ') || '';
      row.push(`"${notes.replace(/"/g, '""')}"`);
    }

    rows.push(row);
  });

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Import project from JSON
 */
export function importFromJSON(jsonString: string): Project | null {
  try {
    const data = JSON.parse(jsonString);

    // Validate basic structure
    if (!data.id || !data.name || !data.tasks) {
      throw new Error('Invalid project structure');
    }

    // Convert date strings back to Date objects
    const project: Project = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tasks: data.tasks.map((task: any) => ({
        ...task,
        start: new Date(task.start),
        end: new Date(task.end),
        earlyStart: task.earlyStart ? new Date(task.earlyStart) : undefined,
        earlyFinish: task.earlyFinish ? new Date(task.earlyFinish) : undefined,
        lateStart: task.lateStart ? new Date(task.lateStart) : undefined,
        lateFinish: task.lateFinish ? new Date(task.lateFinish) : undefined,
        createdAt: task.createdAt ? new Date(task.createdAt) : undefined,
        updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        notes: task.notes?.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
        })),
      })),
    };

    return project;
  } catch (error) {
    console.error('Error importing project:', error);
    return null;
  }
}

/**
 * Download data as file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export and download project as JSON
 */
export function downloadProjectAsJSON(project: Project) {
  const json = exportToJSON(project);
  const filename = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]
    }.json`;
  downloadFile(json, filename, 'application/json');
}

/**
 * Export and download tasks as CSV
 */
export function downloadTasksAsCSV(
  tasks: ExtendedTask[],
  dependencies: TaskDependency[],
  _resources: Resource[],
  projectName: string,
  options?: ExportOptions
) {
  const csv = exportToCSV(tasks, dependencies, options);
  const filename = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_tasks_${new Date().toISOString().split('T')[0]
    }.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Parse CSV file content
 */
export function parseCSV(content: string): string[][] {
  const lines = content.split('\n');
  const result: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const row: string[] = [];
    let cell = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        row.push(cell);
        cell = '';
      } else {
        cell += char;
      }
    }

    row.push(cell);
    result.push(row);
  }

  return result;
}
