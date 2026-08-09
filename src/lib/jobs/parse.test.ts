import { describe, expect, it } from 'vitest';

import {
	formatDuration,
	listJobFields,
	parseJobDetail,
	processingServerId,
	relativeTime,
	stateDurationMs
} from './parse';

describe('parseJobDetail', () => {
	it('reads nested job + states + server_id', () => {
		const detail = parseJobDetail({
			current_state: 'Succeeded',
			job: {
				id: 'abc',
				name: 'echo',
				queue: 'default',
				args: { msg: 'hi' },
				retry_max: 10
			},
			states: [
				{ name: 'Enqueued', created_at: '2026-08-08T14:00:00Z' },
				{
					name: 'Processing',
					created_at: '2026-08-08T14:00:01Z',
					data: { server_id: 'gfire-2' }
				},
				{ name: 'Succeeded', created_at: '2026-08-08T14:00:02Z' }
			]
		});
		expect(detail.id).toBe('abc');
		expect(detail.name).toBe('echo');
		expect(detail.currentState).toBe('Succeeded');
		expect(processingServerId(detail.states)).toBe('gfire-2');
		expect(stateDurationMs(detail.states, 'Processing', 'Succeeded')).toBe(1000);
	});

	it('reads continuations and failure reason', () => {
		const withCont = parseJobDetail({
			current_state: 'Succeeded',
			job: { id: 'p', name: 'parent', queue: 'default', timeout: '30s', result: { ok: true } },
			states: [{ name: 'Failed', reason: 'boom', created_at: '2026-01-01T00:00:00Z' }],
			continuations: [
				{ id: 'c1', condition: 'OnAnyFinishedState', state: 'Succeeded', job: 'child' }
			]
		});
		expect(withCont.continuations).toHaveLength(1);
		expect(withCont.continuations[0].id).toBe('c1');
		expect(withCont.timeout).toBe('30s');
		expect(withCont.states[0].reason).toBe('boom');
	});
});

describe('formatDuration', () => {
	it('formats ms and seconds', () => {
		expect(formatDuration(175)).toBe('175ms');
		expect(formatDuration(3237)).toBe('3.24s');
		expect(formatDuration(undefined)).toBe('—');
		expect(formatDuration(90_000)).toBe('1m 30s');
	});
});

describe('listJobFields / relativeTime', () => {
	it('reads nested list payloads and formats relative time', () => {
		const fields = listJobFields({
			current_state: 'Processing',
			job: { id: 'x1', name: 'echo', queue: 'default' }
		});
		expect(fields).toMatchObject({
			id: 'x1',
			state: 'Processing',
			queue: 'default',
			name: 'echo'
		});
		const withStates = listJobFields({
			current_state: 'Succeeded',
			job: { id: 'y1', name: 'echo', queue: 'default' },
			states: [
				{ name: 'Enqueued', created_at: '2026-08-08T20:00:00Z' },
				{ name: 'Succeeded', created_at: '2026-08-08T20:01:00Z' }
			]
		});
		expect(withStates.updatedAt).toBe('2026-08-08T20:01:00Z');
		expect(relativeTime(undefined)).toBe('—');
		expect(relativeTime(new Date().toISOString())).toMatch(/ago/);
		expect(relativeTime(new Date(Date.now() - 120_000).toISOString())).toMatch(/m ago/);
		expect(relativeTime(new Date(Date.now() - 7_200_000).toISOString())).toMatch(/h ago/);
		expect(relativeTime(new Date(Date.now() - 86_400_000 * 3).toISOString())).toMatch(/d ago/);
		expect(relativeTime('not-a-date')).toBe('not-a-date');
		expect(processingServerId([])).toBeUndefined();
		expect(listJobFields({ id: 'flat', state: 'Enqueued', queue: 'q', name: 'n' }).id).toBe(
			'flat'
		);
		expect(stateDurationMs([], 'Processing', 'Succeeded')).toBeUndefined();
	});
});
