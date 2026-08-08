import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '$lib/api/client';

import {
	TOKEN_STORAGE_KEY,
	clearSession,
	getSessionToken,
	getStoredToken,
	hydrateSession,
	roleIs,
	session,
	setSession
} from './session';

const sampleUser = {
	id: 'u1',
	first_name: 'Ada',
	last_name: 'Lovelace',
	email: 'ada@example.com',
	role: 'Administrator' as const,
	enabled: true
};

describe('session', () => {
	beforeEach(() => {
		clearSession();
		vi.restoreAllMocks();
	});

	it('stores and clears token + session', () => {
		setSession({ token: 'tok', user: sampleUser });
		expect(getStoredToken()).toBe('tok');
		expect(getSessionToken()).toBe('tok');
		expect(get(session)?.user.email).toBe('ada@example.com');

		clearSession();
		expect(getStoredToken()).toBeNull();
		expect(getSessionToken()).toBeNull();
		expect(get(session)).toBeNull();
	});

	it('getSessionToken falls back to localStorage when store empty', () => {
		localStorage.setItem(TOKEN_STORAGE_KEY, 'stored');
		expect(getSessionToken()).toBe('stored');
	});

	it('hydrateSession restores user via apiMe', async () => {
		localStorage.setItem(TOKEN_STORAGE_KEY, 'tok');
		vi.spyOn(client, 'apiMe').mockResolvedValue(sampleUser);

		const data = await hydrateSession();
		expect(data?.token).toBe('tok');
		expect(data?.user.role).toBe('Administrator');
		expect(get(session)?.user.id).toBe('u1');
	});

	it('hydrateSession clears on missing token or api failure', async () => {
		expect(await hydrateSession()).toBeNull();

		localStorage.setItem(TOKEN_STORAGE_KEY, 'bad');
		vi.spyOn(client, 'apiMe').mockRejectedValue(new Error('nope'));
		expect(await hydrateSession()).toBeNull();
		expect(getStoredToken()).toBeNull();
	});

	it('roleIs checks current session role', () => {
		expect(roleIs('Administrator')).toBe(false);
		setSession({ token: 't', user: sampleUser });
		expect(roleIs('Administrator', 'Operator')).toBe(true);
		expect(roleIs('Guest')).toBe(false);
	});
});
