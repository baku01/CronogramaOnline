import type { ExtendedTask, Resource } from "../types/types";

/**
 * Calculate cost for a single task based on resources and duration
 */
export function calculateTaskCost(task: ExtendedTask, resources: Resource[], workingHoursPerDay: number = 8): number {
    let resourceCost = 0;

    if (task.resources) {
        task.resources.forEach(taskRes => {
            const resource = resources.find(r => r.id === taskRes.resourceId);
            if (resource && resource.costPerHour) {
                // Cost = Rate * Duration (days) * Hours/Day * Allocation %
                // Or if effort is defined, Cost = Rate * Effort * Allocation %

                // Usually: Cost = Work * StandardRate
                // Work = Duration * Units (Allocation) * HoursPerDay (if duration in days)

                // If effort (work in hours) is explicitly set, use it.
                // Otherwise calculate from duration.

                let workHours = 0;
                if (task.effort && task.effort > 0) {
                    workHours = task.effort;
                } else if (task.duration) {
                    workHours = task.duration * workingHoursPerDay;
                }

                // Apply allocation
                const allocation = (taskRes.allocation || 100) / 100;

                // Resource Cost
                resourceCost += workHours * allocation * resource.costPerHour;
            }

            // Add fixed cost per use if available in resource (not in current type yet, but good to have placeholder)
            // if (resource.costPerUse) resourceCost += resource.costPerUse;
        });
    }

    const fixedCost = task.fixedCost || 0;
    return resourceCost + fixedCost;
}

/**
 * Calculate total project cost by rolling up task costs
 */
export function calculateProjectCost(tasks: ExtendedTask[], resources: Resource[], workingHoursPerDay: number = 8): number {
    // We need to be careful not to double count if we have summary tasks
    // If summary tasks have their own cost fields populated from children, we shouldn't sum them again.
    // Assuming simple sum of leaf tasks for now or handling hierarchy.

    // Strategy: Calculate cost for leaf tasks. For summary tasks, sum children.

    // 1. Map of task costs
    const taskCosts = new Map<string, number>();

    // Process all tasks to calculate individual costs (resource + fixed)
    tasks.forEach(task => {
        const cost = calculateTaskCost(task, resources, workingHoursPerDay);
        taskCosts.set(task.id, cost);
    });

    // 2. Rollup
    // Iterate from bottom up or just sum all tasks that are NOT summary tasks (or type 'project')?
    // If we want to update the task objects with calculated costs, we need a tree traversal.
    // But for total project cost, just summing all tasks that don't have children is safe.

    // Let's identify leaf tasks
    const parentIds = new Set(tasks.map(t => t.project).filter(Boolean));
    // Also tasks that are type 'project' are summaries.

    let totalCost = 0;

    tasks.forEach(task => {
        if (task.type !== 'project' && !parentIds.has(task.id)) {
             totalCost += taskCosts.get(task.id) || 0;
        }
    });

    return totalCost;
}

/**
 * Update tasks with calculated costs (mutates or returns new array)
 */
export function updateTaskCosts(tasks: ExtendedTask[], resources: Resource[], workingHoursPerDay: number = 8): ExtendedTask[] {
    const taskMap = new Map<string, ExtendedTask>();
    // Deep copy to avoid mutation if needed, or just map
    const newTasks = tasks.map(t => ({ ...t }));

    newTasks.forEach(t => taskMap.set(t.id, t));

    // Calculate individual costs for all tasks
    newTasks.forEach(task => {
        task.cost = calculateTaskCost(task, resources, workingHoursPerDay);
    });

    // Rollup costs to summary tasks
    // We need to process levels. Or just loop until no changes?
    // Topologically sort or just depth-based.

    // Simple approach: Group by parent.
    const childrenMap = new Map<string, string[]>();
    newTasks.forEach(t => {
        if (t.project) {
            if (!childrenMap.has(t.project)) childrenMap.set(t.project, []);
            childrenMap.get(t.project)!.push(t.id);
        }
    });

    // Recursive function to get cost
    function getCost(taskId: string): number {
        const task = taskMap.get(taskId);
        if (!task) return 0;

        const children = childrenMap.get(taskId);
        if (children && children.length > 0) {
            // It's a summary task
            let sum = 0;
            children.forEach(childId => {
                sum += getCost(childId);
            });
            // Add own fixed cost if any (summary tasks might have fixed overhead)
            sum += task.fixedCost || 0;
            task.cost = sum;
            return sum;
        } else {
            // Leaf task, cost already calculated
            return task.cost || 0;
        }
    }

    // Trigger calculation for all root tasks (tasks with no parent or parent not in list)
    newTasks.forEach(task => {
        if (!task.project || !taskMap.has(task.project)) {
            getCost(task.id);
        }
    });

    return newTasks;
}
