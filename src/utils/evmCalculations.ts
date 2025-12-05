import { differenceInDays } from "date-fns";
import type { ExtendedTask } from "../types/types";

export interface EVMMetrics {
    pv: number; // Planned Value
    ev: number; // Earned Value
    ac: number; // Actual Cost
    sv: number; // Schedule Variance (EV - PV)
    cv: number; // Cost Variance (EV - AC)
    spi: number; // Schedule Performance Index (EV / PV)
    cpi: number; // Cost Performance Index (EV / AC)
    bac: number; // Budget at Completion (Total Planned Cost)
    eac: number; // Estimate at Completion (BAC / CPI)
    vac: number; // Variance at Completion (BAC - EAC)
}

/**
 * Calculate EVM metrics for a single task at a specific status date
 */
export function calculateTaskEVM(task: ExtendedTask, statusDate: Date = new Date()): EVMMetrics {
    const totalCost = task.budgetedCost || task.cost || 0; // Budget at Completion
    const actualCost = task.cost || 0; // Usually AC is explicit, but if not trackable separately, we might assume cost ~ AC?
    // In MS Project, Cost is often scheduled cost. Actual Cost is separate.
    // For this implementation, let's assume 'cost' is the current calculated cost (which includes actuals + remaining).
    // But strictly, AC should be stored. Let's look if we have 'actualCost'.
    // types.ts doesn't have actualCost explicit, but let's assume `cost` reflects current reality.
    // However, for EVM, AC is what we *spent*.
    // Let's use `cost * (progress/100)` as a proxy for AC if not present? No, that's EV.
    // Let's assume we need a field `actualCost`. If missing, we might default to `cost * percentComplete` (which makes CPI=1, not useful).
    // OR we assume `cost` IS the EAC, and we derive AC?
    
    // Better approach: Use `cost` as EAC (Estimate at Completion).
    // Use `budgetedCost` (from Baseline) as BAC.
    
    // PV: % of planned duration elapsed * BAC
    // EV: % Complete * BAC
    // AC: We really need Actual Cost.
    
    // Let's check types again.
    // ExtendedTask has: cost, budgetedCost.
    
    const bac = task.budgetedCost || totalCost;

    // 1. Calculate PV
    // Based on Baseline Start/End if available, else Start/End
    const start = task.baselineStart || task.start;
    const end = task.baselineEnd || task.end;

    const totalDuration = differenceInDays(end, start) + 1;
    const elapsed = differenceInDays(statusDate, start) + 1;

    let plannedPercent = 0;
    if (statusDate < start) plannedPercent = 0;
    else if (statusDate > end) plannedPercent = 1;
    else plannedPercent = Math.max(0, Math.min(1, elapsed / totalDuration));

    const pv = bac * plannedPercent;

    // 2. Calculate EV
    const ev = bac * (task.progress / 100);

    // 3. Calculate AC
    // Ideally user inputs AC. If not, we can't calculate CPI accurately.
    // But often in simple tools, AC is approximated or we add a field.
    // Let's assume 'cost' is the current projected total cost.
    // AC = cost * (progress/100)? No.
    // AC is usually independent.
    // Let's assume AC is passed or we add it?
    // For now, let's use `task.cost` as the *Current Total Cost*.
    // If task is 50% done, how much did we spend?
    // We don't know without a time-phased distribution or explicit field.
    // Let's approximate AC = task.cost * (task.progress / 100) * (some variance factor? no).

    // Let's check if we can calculate AC from Resources?
    // Resource Cost = Rate * Work.
    // Actual Work = Work * % Complete.
    // So AC ~ cost * % Complete IF rates didn't change.
    // This implies CPI = 1.

    // To make it interesting, we usually need explicit Actual Cost.
    // Since we don't have it, I will skip AC-based metrics (CPI, CV) or default them to 1/0.
    // OR I can use `task.cost` (Current Estimate) vs `task.budgetedCost` (Baseline).
    // If `cost` > `budgetedCost`, we are over budget.
    // We can assume AC ~ (task.cost / TotalWork) * ActualWork?
    // Let's assume linear burn.
    // AC = task.cost * (task.progress / 100).
    // Then CV = EV - AC = (BAC * %) - (EAC * %).
    // If EAC (cost) > BAC (budgetedCost), then CV is negative. Correct.

    const ac = (task.cost || bac) * (task.progress / 100);

    const sv = ev - pv;
    const cv = ev - ac;

    const spi = pv === 0 ? 1 : ev / pv;
    const cpi = ac === 0 ? 1 : ev / ac;

    const eac = cpi === 0 ? bac : bac / cpi; // Or simply task.cost
    const vac = bac - eac;

    return { pv, ev, ac, sv, cv, spi, cpi, bac, eac, vac };
}

/**
 * Calculate Project Level EVM
 */
export function calculateProjectEVM(tasks: ExtendedTask[], statusDate: Date = new Date()): EVMMetrics {
    const totals = tasks.reduce((acc, task) => {
        const metrics = calculateTaskEVM(task, statusDate);
        return {
            pv: acc.pv + metrics.pv,
            ev: acc.ev + metrics.ev,
            ac: acc.ac + metrics.ac,
            bac: acc.bac + metrics.bac
        };
    }, { pv: 0, ev: 0, ac: 0, bac: 0 });

    const sv = totals.ev - totals.pv;
    const cv = totals.ev - totals.ac;
    const spi = totals.pv === 0 ? 1 : totals.ev / totals.pv;
    const cpi = totals.ac === 0 ? 1 : totals.ev / totals.ac;
    const eac = cpi === 0 ? totals.bac : totals.bac / cpi;
    const vac = totals.bac - eac;

    return {
        ...totals,
        sv, cv, spi, cpi, eac, vac
    };
}
