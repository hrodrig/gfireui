import { get, writable } from 'svelte/store';

import { apiMe } from '$lib/api/client';
import type { Role, User } from '$lib/api/types';

export type SessionData = {
	token: string;
	user: User;
};

export const TOKEN_STORAGE_KEY = 'gfireui-token';

export const session = writable<SessionData | null>(null);

export function getStoredToken(): string | null {
	if (typeof localStorage === 'undefined') {
		return null;
	}
	return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getSessionToken(): string | null {
	return get(session)?.token ?? getStoredToken();
}

export function setSession(data: SessionData): void {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
	}
	session.set(data);
}

export function clearSession(): void {
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem(TOKEN_STORAGE_KEY);
	}
	session.set(null);
}

/** Restore session from stored token via GET /api/auth/me. */
export async function hydrateSession(): Promise<SessionData | null> {
	const token = getStoredToken();
	if (!token) {
		session.set(null);
		return null;
	}

	try {
		const user = await apiMe({ handleUnauthorized: false });
		setSession({ token, user });
		return get(session);
	} catch {
		clearSession();
		return null;
	}
}

export function roleIs(...roles: Role[]): boolean {
	const current = get(session)?.user?.role;
	return current != null && roles.includes(current);
}
