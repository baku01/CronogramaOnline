import { describe, it, expect } from 'vitest';
import {
    isWorkingDay,
    addWorkingDays,
    calculateEndDate,
    calculateStartDate,
    calculateDependentStartDate,
    calculateForwardPass,
    calculateCriticalPath
} from './dateCalculations';
import { DependencyType } from '../types/types';
import type { ExtendedTask, TaskDependency, ProjectCalendar, CalendarException } from '../types/types';

const MONDAY = new Date('2024-01-01T12:00:00Z'); // Monday
const TUESDAY = new Date('2024-01-02T12:00:00Z');
const WEDNESDAY = new Date('2024-01-03T12:00:00Z');
const FRIDAY = new Date('2024-01-05T12:00:00Z');
const SATURDAY = new Date('2024-01-06T12:00:00Z');
const SUNDAY = new Date('2024-01-07T12:00:00Z');
const NEXT_MONDAY = new Date('2024-01-08T12:00:00Z');

const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5]; // Mon-Fri

// Mock Calendar
const mockCalendar: ProjectCalendar = {
    id: 'cal1',
    name: 'Standard',
    workingDays: [1, 2, 3, 4, 5],
    hoursPerDay: 8,
    workingHoursPerDay: [],
    isDefault: true,
    exceptions: []
};

// Mock Calendar with Exception (Holiday on Wednesday Jan 3rd)
const holidayException: CalendarException = {
    id: 'exc1',
    name: 'Holiday',
    startDate: WEDNESDAY,
    endDate: WEDNESDAY,
    isWorkingTime: false
};

const calendarWithHoliday: ProjectCalendar = {
    ...mockCalendar,
    exceptions: [holidayException]
};

describe('Date Calculations with Calendars', () => {

    describe('isWorkingDay', () => {
        it('should correctly identify working days from calendar', () => {
            expect(isWorkingDay(MONDAY, mockCalendar)).toBe(true);
            expect(isWorkingDay(SATURDAY, mockCalendar)).toBe(false);
        });

        it('should handle holidays/exceptions', () => {
            // Wednesday is normally a working day
            expect(isWorkingDay(WEDNESDAY, mockCalendar)).toBe(true);
            // But with holiday exception it should be false
            expect(isWorkingDay(WEDNESDAY, calendarWithHoliday)).toBe(false);
        });
    });

    describe('addWorkingDays', () => {
        it('should skip holidays', () => {
            // Tue + 1 working day -> Thu (skip Wed holiday)
            const result = addWorkingDays(TUESDAY, 1, calendarWithHoliday);
            const THURSDAY = new Date('2024-01-04T12:00:00Z');
            expect(result).toEqual(THURSDAY);
        });
    });

    describe('calculateEndDate', () => {
        it('should extend duration due to holidays', () => {
            // Start Tue, 2 days duration.
            // Normal: Tue, Wed. End = Wed.
            // Holiday Wed: Tue, Thu. End = Thu.
            const result = calculateEndDate(TUESDAY, 2, calendarWithHoliday);
            const THURSDAY = new Date('2024-01-04T12:00:00Z');
            expect(result).toEqual(THURSDAY);
        });
    });
});
