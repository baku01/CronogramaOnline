import { describe, it, expect } from 'vitest';
import { calculateTaskCost, calculateProjectCost } from './costCalculations';
import { ResourceType } from '../types/types';
import type { ExtendedTask, Resource } from '../types/types';

describe('Cost Calculations', () => {
    const resource1: Resource = {
        id: 'r1',
        name: 'Dev',
        type: ResourceType.PERSON,
        costPerHour: 50,
        availability: 100
    };

    const task1: ExtendedTask = {
        id: 't1',
        name: 'Task 1',
        start: new Date(),
        end: new Date(),
        type: 'task',
        progress: 0,
        status: 'not_started',
        priority: 'medium',
        duration: 2, // 2 days * 8 hours = 16 hours
        resources: [
            { resourceId: 'r1', allocation: 100 }
        ],
        fixedCost: 100
    };

    it('should calculate task cost correctly', () => {
        // Resource cost: 2 days * 8 hours * $50 = $800
        // Fixed cost: $100
        // Total: $900
        const cost = calculateTaskCost(task1, [resource1]);
        expect(cost).toBe(900);
    });

    it('should calculate project cost correctly', () => {
        const tasks = [task1];
        const cost = calculateProjectCost(tasks, [resource1]);
        expect(cost).toBe(900);
    });
});
