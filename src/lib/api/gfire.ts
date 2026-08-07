import { apiDelete, apiGet, apiPost } from './client';
import type { GFireJob } from './types';

export function asArray<T>(payload: unknown, keys: string[] = ['data', 'items', 'jobs', 'result']): T[] {
	if (Array.isArray(payload)) {
		return payload as T[];
	}
	if (payload && typeof payload === 'object') {
		const record = payload as Record<string, unknown>;
		for (const key of keys) {
			if (Array.isArray(record[key])) {
				return record[key] as T[];
			}
		}
	}
	return [];
}

export function jobId(job: GFireJob): string {
	return String(job.id ?? job.ID ?? '');
}

export async function listJobs(query = ''): Promise<GFireJob[]> {
	const path = query ? `/api/gfire/v1/jobs?${query}` : '/api/gfire/v1/jobs';
	const payload = await apiGet<unknown>(path);
	return asArray<GFireJob>(payload, ['jobs', 'data', 'items', 'result']);
}

export async function getJob(id: string): Promise<GFireJob> {
	return apiGet<GFireJob>(`/api/gfire/v1/jobs/${encodeURIComponent(id)}`);
}

export async function requeueJob(id: string): Promise<void> {
	await apiPost(`/api/gfire/v1/jobs/${encodeURIComponent(id)}/requeue`);
}

export async function cancelJob(id: string): Promise<void> {
	await apiPost(`/api/gfire/v1/jobs/${encodeURIComponent(id)}/cancel`);
}

export async function deleteJob(id: string): Promise<void> {
	await apiDelete(`/api/gfire/v1/jobs/${encodeURIComponent(id)}`);
}

export async function listQueues(): Promise<unknown[]> {
	const payload = await apiGet<unknown>('/api/gfire/v1/queues');
	return asArray(payload, ['queues', 'data', 'items', 'result']);
}

export async function listRecurring(): Promise<unknown[]> {
	const payload = await apiGet<unknown>('/api/gfire/v1/recurring');
	return asArray(payload, ['recurring', 'data', 'items', 'result']);
}

export async function listServers(): Promise<unknown[]> {
	const payload = await apiGet<unknown>('/api/gfire/v1/servers');
	return asArray(payload, ['servers', 'data', 'items', 'result']);
}
