import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OpsSummary } from '$lib/api/types';

const apiGet = vi.fn();

vi.mock('$lib/api/client', () => ({
	apiGet: (...args: unknown[]) => apiGet(...args),
	ApiError: class ApiError extends Error {
		status: number;
		constructor(status: number, message: string) {
			super(message);
			this.status = status;
		}
	}
}));

describe('ops summary helpers', () => {
	beforeEach(() => {
		vi.resetModules();
		apiGet.mockReset();
	});

	it('sums Failed + Dead for attention', async () => {
		const { attentionCount, hotJobsCount } = await import('./summary');
		const s: OpsSummary = {
			jobs_by_state: { Failed: 2, Dead: 3, Enqueued: 1, Processing: 4 },
			queues: [],
			generated_at: new Date().toISOString()
		};
		expect(attentionCount(s)).toBe(5);
		expect(hotJobsCount(s)).toBe(5);
	});

	it('returns 0 for null summary', async () => {
		const { attentionCount, hotJobsCount } = await import('./summary');
		expect(attentionCount(null)).toBe(0);
		expect(hotJobsCount(null)).toBe(0);
	});

	it('refreshOpsSummary caches and notifies subscribers', async () => {
		const mod = await import('./summary');
		const payload: OpsSummary = {
			jobs_by_state: { Enqueued: 1 },
			queues: [{ name: 'default', depth: 1 }],
			servers_count: 3,
			recurring_count: 0,
			generated_at: new Date().toISOString()
		};
		apiGet.mockResolvedValueOnce(payload);
		const seen: Array<OpsSummary | null> = [];
		const unsub = mod.subscribeOpsSummary((s) => seen.push(s));
		await mod.refreshOpsSummary();
		expect(mod.getCachedOpsSummary()?.servers_count).toBe(3);
		expect(seen.some((s) => s?.servers_count === 3)).toBe(true);
		unsub();
		const stop = mod.startOpsSummaryPoll(60_000);
		stop();
	});
});
