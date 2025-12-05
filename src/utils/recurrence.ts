import { addDays, addWeeks, addMonths, addYears } from "date-fns";
import type { ExtendedTask } from "../types/types";
import { calculateEndDate } from "./dateCalculations";

export function generateRecurringTasks(baseTask: ExtendedTask): ExtendedTask[] {
    if (!baseTask.isRecurring || !baseTask.recurrenceRule) {
        return [baseTask];
    }

    const { frequency, interval, endType, endAfterOccurrences, endDate } = baseTask.recurrenceRule;
    const instances: ExtendedTask[] = [];

    // Create Summary Task (Parent)
    const summaryTask: ExtendedTask = {
        ...baseTask,
        id: baseTask.id, // Use original ID for the summary
        type: 'project', // Force type to project/summary
        isRecurring: true, // Keep flag
        name: baseTask.name + " (Recorrente)",
        children: [], // Ensure children array exists in type definition? GanttTask doesn't force it but we can use it logically?
        // Note: ExtendedTask extends GanttTask. We usually use 'project' property on children to point to parent.
    };

    // We will generate children and set their 'project' field to summaryTask.id

    let currentDate = new Date(baseTask.start);
    let occurrences = 0;
    const maxOccurrences = endType === 'afterOccurrences' ? (endAfterOccurrences || 1) : 100; // Hard limit 100 for safety if 'never' or far end date
    const finalDate = endType === 'endDate' && endDate ? new Date(endDate) : null;

    // Adjust interval (defaults to 1)
    const safeInterval = Math.max(1, interval || 1);

    while (true) {
        // Check termination
        if (endType === 'afterOccurrences' && occurrences >= maxOccurrences) break;
        if (endType === 'endDate' && finalDate && currentDate > finalDate) break;
        if (endType === 'never' && occurrences >= 52) break; // Arbitrary limit for "never" (e.g. 1 year of weekly)

        // Generate Instance
        // For weekly, check weekdays?
        // Basic implementation: Just add interval.
        // Advanced: If Weekly and weekDays=[1,3] (Mon, Wed), we need to iterate days.

        // Let's implement simplified logic: Just Repeat Start Date by Interval.
        // If Weekly and multiple days selected, this logic becomes complex.
        // MS Project creates individual tasks for each occurrence.

        const instanceId = `${baseTask.id}-${occurrences + 1}`;
        const instanceStart = new Date(currentDate);

        // Calculate End based on duration
        // We assume baseTask.duration is set (or calculated from start/end).
        // If duration is missing, calculate from baseTask.
        const duration = baseTask.duration || 1;
        const instanceEnd = calculateEndDate(instanceStart, duration); // Uses default calendar, should accept calendar if available (TODO)

        const instance: ExtendedTask = {
            ...baseTask,
            id: instanceId,
            name: `${baseTask.name} ${occurrences + 1}`,
            start: instanceStart,
            end: instanceEnd,
            project: summaryTask.id, // Link to parent
            type: 'task', // Instance is a task
            isRecurring: false, // Instances are not recurring definitions
            isRecurringInstance: true,
            recurrenceInstanceNumber: occurrences + 1,
            dependencies: [], // Dependencies on the series? Usually series share deps or chain. Let's assume independent for now.
        };

        instances.push(instance);
        occurrences++;

        // Next Date
        switch (frequency) {
            case 'daily':
                currentDate = addDays(currentDate, safeInterval);
                break;
            case 'weekly':
                currentDate = addWeeks(currentDate, safeInterval);
                break;
            case 'monthly':
                currentDate = addMonths(currentDate, safeInterval);
                break;
            case 'yearly':
                currentDate = addYears(currentDate, safeInterval);
                break;
        }
    }

    return [summaryTask, ...instances];
}
