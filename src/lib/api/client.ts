import { goto } from '$app/navigation';
import { PUBLIC_GFIREUI_API_BASE } from '$env/static/public';

import { clearSession, getSessionToken, setSession } from '$lib/auth/session';

import type { ApiErrorBody, LoginResponse, User } from './types';

const DEFAULT_API_BASE = 'http://127.0.0.1:8090';

export type ClientDeps = {
	baseUrl?: string;
	fetchFn?: typeof fetch;
	onUnauthorized?: () => void;
	/** When false, 401 does not clear session or redirect (default true). */
	handleUnauthorized?: boolean;
	/** When false, omit Authorization header (default true). */
	auth?: boolean;
};

export class ApiError extends Error {
	readonly status: number;
	readonly body: ApiErrorBody | null;

	constructor(status: number, body: ApiErrorBody | null) {
		super(body?.error ?? `HTTP ${status}`);
		this.name = 'ApiError';
		this.status = status;
		this.body = body;
	}
}

function resolveBaseUrl(override?: string): string {
	const configured = override ?? PUBLIC_GFIREUI_API_BASE ?? DEFAULT_API_BASE;
	return configured.replace(/\/$/, '');
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody | null> {
	try {
		return (await response.json()) as ApiErrorBody;
	} catch {
		return null;
	}
}

async function apiRequest<T>(
	method: string,
	path: string,
	body: unknown | undefined,
	deps?: ClientDeps
): Promise<T> {
	const fetchFn = deps?.fetchFn ?? fetch;
	const baseUrl = resolveBaseUrl(deps?.baseUrl);
	const headers: Record<string, string> = {
		Accept: 'application/json'
	};

	if (body !== undefined) {
		headers['Content-Type'] = 'application/json';
	}

	if (deps?.auth !== false) {
		const token = getSessionToken();
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}
	}

	const response = await fetchFn(`${baseUrl}${path}`, {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body)
	});

	if (response.status === 401 && deps?.handleUnauthorized !== false) {
		clearSession();
		if (deps?.onUnauthorized) {
			deps.onUnauthorized();
		} else if (typeof window !== 'undefined') {
			void goto('/login');
		}
		throw new ApiError(response.status, await parseErrorBody(response));
	}

	if (!response.ok) {
		throw new ApiError(response.status, await parseErrorBody(response));
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
}

export function apiGet<T>(path: string, deps?: ClientDeps): Promise<T> {
	return apiRequest<T>('GET', path, undefined, deps);
}

export function apiPost<T>(path: string, body?: unknown, deps?: ClientDeps): Promise<T> {
	return apiRequest<T>('POST', path, body, deps);
}

export function apiPatch<T>(path: string, body: unknown, deps?: ClientDeps): Promise<T> {
	return apiRequest<T>('PATCH', path, body, deps);
}

export function apiPut<T>(path: string, body: unknown, deps?: ClientDeps): Promise<T> {
	return apiRequest<T>('PUT', path, body, deps);
}

export function apiDelete<T>(path: string, deps?: ClientDeps): Promise<T> {
	return apiRequest<T>('DELETE', path, undefined, deps);
}

export async function apiLogin(
	email: string,
	password: string,
	deps?: ClientDeps
): Promise<LoginResponse> {
	const result = await apiRequest<LoginResponse>('POST', '/api/auth/login', { email, password }, {
		...deps,
		auth: false,
		handleUnauthorized: false
	});
	setSession({ token: result.token, user: result.user });
	return result;
}

export function apiMe(deps?: ClientDeps): Promise<User> {
	return apiGet<User>('/api/auth/me', deps);
}
