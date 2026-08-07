import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearSession, setSession, TOKEN_STORAGE_KEY } from '$lib/auth/session';

import { apiGet, apiLogin, apiPatch, apiPost } from './client';
import type { User } from './types';

const testUser: User = {
	id: '018f1f0f-0e3b-7c0c-9b77-1c0c0f0f0f01',
	first_name: 'Ada',
	last_name: 'Lovelace',
	email: 'ada@example.com',
	role: 'Administrator',
	enabled: true
};

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

describe('api client', () => {
	beforeEach(() => {
		clearSession();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('apiGet attaches Authorization Bearer when session has token', async () => {
		setSession({ token: 'test-jwt', user: testUser });
		const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));

		await apiGet<{ ok: boolean }>('/api/ops/summary', {
			baseUrl: 'http://test',
			fetchFn
		});

		expect(fetchFn).toHaveBeenCalledOnce();
		expect(fetchFn).toHaveBeenCalledWith(
			'http://test/api/ops/summary',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					Authorization: 'Bearer test-jwt',
					Accept: 'application/json'
				})
			})
		);
	});

	it('apiPost sends JSON body without Authorization when unauthenticated', async () => {
		const fetchFn = vi.fn().mockResolvedValue(
			jsonResponse({ token: 'new-token', user: testUser })
		);

		await apiLogin('ada@example.com', 'secret', {
			baseUrl: 'http://test',
			fetchFn
		});

		expect(fetchFn).toHaveBeenCalledWith(
			'http://test/api/auth/login',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ email: 'ada@example.com', password: 'secret' }),
				headers: expect.not.objectContaining({
					Authorization: expect.anything()
				})
			})
		);
		expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('new-token');
	});

	it('apiPatch attaches Authorization Bearer header', async () => {
		setSession({ token: 'patch-token', user: testUser });
		const fetchFn = vi.fn().mockResolvedValue(jsonResponse(testUser));

		await apiPatch<User>(
			'/api/users/1',
			{ first_name: 'Grace' },
			{ baseUrl: 'http://test', fetchFn }
		);

		expect(fetchFn).toHaveBeenCalledWith(
			'http://test/api/users/1',
			expect.objectContaining({
				method: 'PATCH',
				body: JSON.stringify({ first_name: 'Grace' }),
				headers: expect.objectContaining({
					Authorization: 'Bearer patch-token'
				})
			})
		);
	});

	it('calls onUnauthorized and clears session on 401', async () => {
		setSession({ token: 'expired', user: testUser });
		const onUnauthorized = vi.fn();
		const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ error: 'unauthorized' }, 401));

		await expect(
			apiGet('/api/me', {
				fetchFn,
				onUnauthorized
			})
		).rejects.toMatchObject({ status: 401 });

		expect(onUnauthorized).toHaveBeenCalledOnce();
		expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
	});

	it('uses PUBLIC_GFIREUI_API_BASE fallback when baseUrl is omitted', async () => {
		setSession({ token: 'fallback-token', user: testUser });
		const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));

		await apiPost('/api/ping', { hello: 'world' }, { fetchFn });

		expect(fetchFn).toHaveBeenCalledWith(
			'http://127.0.0.1:8090/api/ping',
			expect.any(Object)
		);
	});
});
