import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from './client';
import {
	asArray,
	cancelJob,
	deleteJob,
	getJob,
	jobId,
	listJobs,
	listQueues,
	listRecurring,
	listServers,
	requeueJob
} from './gfire';

describe('gfire helpers', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('asArray unwraps known keys and defaults empty', () => {
		expect(asArray([1, 2])).toEqual([1, 2]);
		expect(asArray({ jobs: [{ id: 'a' }] })).toEqual([{ id: 'a' }]);
		expect(asArray({ data: ['x'] })).toEqual(['x']);
		expect(asArray({ nope: true })).toEqual([]);
		expect(asArray(null)).toEqual([]);
	});

	it('jobId prefers id then ID', () => {
		expect(jobId({ id: 'a' })).toBe('a');
		expect(jobId({ ID: 'b' })).toBe('b');
		expect(jobId({})).toBe('');
	});

	it('listJobs uses query string when provided', async () => {
		const spy = vi.spyOn(client, 'apiGet').mockResolvedValue({ jobs: [{ id: '1' }] });
		await expect(listJobs('state=Failed')).resolves.toEqual([{ id: '1' }]);
		expect(spy).toHaveBeenCalledWith('/api/gfire/v1/jobs?state=Failed');
		await listJobs();
		expect(spy).toHaveBeenCalledWith('/api/gfire/v1/jobs');
	});

	it('get/requeue/cancel/delete hit job endpoints', async () => {
		vi.spyOn(client, 'apiGet').mockResolvedValue({ id: 'j1' });
		vi.spyOn(client, 'apiPost').mockResolvedValue(undefined);
		vi.spyOn(client, 'apiDelete').mockResolvedValue(undefined);

		await expect(getJob('j1')).resolves.toEqual({ id: 'j1' });
		await requeueJob('j1');
		await cancelJob('j1');
		await deleteJob('j1');

		expect(client.apiGet).toHaveBeenCalledWith('/api/gfire/v1/jobs/j1');
		expect(client.apiPost).toHaveBeenCalledWith('/api/gfire/v1/jobs/j1/requeue');
		expect(client.apiPost).toHaveBeenCalledWith('/api/gfire/v1/jobs/j1/cancel');
		expect(client.apiDelete).toHaveBeenCalledWith('/api/gfire/v1/jobs/j1');
	});

	it('listQueues/recurring/servers unwrap arrays', async () => {
		vi.spyOn(client, 'apiGet')
			.mockResolvedValueOnce({ queues: ['q'] })
			.mockResolvedValueOnce({ recurring: ['r'] })
			.mockResolvedValueOnce({ servers: ['s'] });

		await expect(listQueues()).resolves.toEqual(['q']);
		await expect(listRecurring()).resolves.toEqual(['r']);
		await expect(listServers()).resolves.toEqual(['s']);
	});
});
