import { apiGet, ApiError } from '$lib/api/client';
import type { OpsSummary } from '$lib/api/types';

export const GFIRE_STATES = [
	'Enqueued',
	'Scheduled',
	'Processing',
	'Succeeded',
	'Failed',
	'Dead',
	'Cancelled',
	'Deleted',
	'Awaiting'
] as const;

export type GFireState = (typeof GFIRE_STATES)[number];

let cache: OpsSummary | null = null;
let listeners = new Set<(s: OpsSummary | null) => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let inflight: Promise<OpsSummary | null> | null = null;

export function getCachedOpsSummary(): OpsSummary | null {
	return cache;
}

export function subscribeOpsSummary(fn: (s: OpsSummary | null) => void): () => void {
	listeners.add(fn);
	fn(cache);
	return () => listeners.delete(fn);
}

function emit() {
	for (const fn of listeners) fn(cache);
}

export async function refreshOpsSummary(): Promise<OpsSummary | null> {
	if (inflight) return inflight;
	inflight = (async () => {
		try {
			cache = await apiGet<OpsSummary>('/api/ops/summary');
		} catch (err) {
			if (!(err instanceof ApiError)) {
				cache = null;
			}
			// keep last good cache on transient errors
		} finally {
			inflight = null;
			emit();
		}
		return cache;
	})();
	return inflight;
}

export function startOpsSummaryPoll(ms = 3000): () => void {
	void refreshOpsSummary();
	timer = setInterval(() => {
		void refreshOpsSummary();
	}, ms);
	return () => {
		if (timer) clearInterval(timer);
		timer = undefined;
	};
}

export function attentionCount(summary: OpsSummary | null): number {
	if (!summary?.jobs_by_state) return 0;
	return (summary.jobs_by_state.Failed ?? 0) + (summary.jobs_by_state.Dead ?? 0);
}

export function hotJobsCount(summary: OpsSummary | null): number {
	if (!summary?.jobs_by_state) return 0;
	return (summary.jobs_by_state.Enqueued ?? 0) + (summary.jobs_by_state.Processing ?? 0);
}
