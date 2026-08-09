import { describe, expect, it } from 'vitest';

import { formatClockTime, stateClass, stateToken, truncateId } from './states';

describe('states theme helpers', () => {
	it('maps state names to CSS tokens and classes', () => {
		expect(stateToken('Succeeded')).toBe('--state-succeeded');
		expect(stateClass('Succeeded')).toBe('state-succeeded');
		expect(stateClass('Attention')).toBe('state-attention');
	});

	it('truncates long ids for the jobs table', () => {
		expect(truncateId('short')).toBe('short');
		expect(truncateId('2bf4a74e-4152-4601-9cbb-64cafdfa142e')).toBe('2bf4a74e…fa142e');
	});

	it('formats clock times', () => {
		expect(formatClockTime(undefined)).toBe('—');
		expect(formatClockTime('not-a-date')).toBe('not-a-date');
		expect(formatClockTime('2026-08-08T21:02:39Z')).toMatch(/\d/);
	});
});
