import type { ExtendedTask } from "../types/types";

/**
 * Generates WBS (Work Breakdown Structure) codes for a list of tasks.
 * The WBS structure is based on the parent-child relationships defined by the 'project' field.
 * 
 * @param tasks List of tasks to generate WBS for
 * @returns A Map where keys are task IDs and values are WBS codes (e.g., "1", "1.1", "1.1.1")
 */
export function generateWBS(tasks: ExtendedTask[]): Map<string, string> {
    const wbsMap = new Map<string, string>();
    
    // Build adjacency list
    const childrenMap = new Map<string, ExtendedTask[]>();
    const roots: ExtendedTask[] = [];
    
    // First pass: organize children and find roots
    // We need to know all task IDs to determine if a parent exists in the current set
    const taskIds = new Set(tasks.map(t => t.id));
    
    tasks.forEach(task => {
        const parentId = task.project; // In gantt-task-react, 'project' is the parent ID for subtasks
        
        if (parentId && taskIds.has(parentId)) {
            if (!childrenMap.has(parentId)) {
                childrenMap.set(parentId, []);
            }
            childrenMap.get(parentId)?.push(task);
        } else {
            roots.push(task);
        }
    });
    
    // Sort function: primarily by displayOrder, then by start date
    const sortTasks = (a: ExtendedTask, b: ExtendedTask) => {
        // If both have displayOrder, use it
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
            return a.displayOrder - b.displayOrder;
        }
        // If only one has displayOrder, strictly it should probably go first or last?
        // Let's assume undefined displayOrder goes after defined ones, or just fallback to start date
        if (a.displayOrder !== undefined) return -1;
        if (b.displayOrder !== undefined) return 1;
        
        // Fallback to start date
        return a.start.getTime() - b.start.getTime();
    };
    
    // Recursive function to assign WBS
    const assignWBS = (taskList: ExtendedTask[], prefix: string) => {
        taskList.sort(sortTasks);
        
        taskList.forEach((task, index) => {
            const wbs = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
            wbsMap.set(task.id, wbs);
            
            const children = childrenMap.get(task.id);
            if (children && children.length > 0) {
                assignWBS(children, wbs);
            }
        });
    };
    
    assignWBS(roots, "");
    
    return wbsMap;
}
