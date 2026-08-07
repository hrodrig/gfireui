import { get, writable } from 'svelte/store';

export type ToastKind = 'success' | 'error' | 'info';

export type Toast = {
	id: string;
	kind: ToastKind;
	message: string;
};

const DEFAULT_TTL_MS = 4200;

export const toasts = writable<Toast[]>([]);

export function dismissToast(id: string): void {
	toasts.update((list) => list.filter((t) => t.id !== id));
}

export function pushToast(kind: ToastKind, message: string, ttlMs = DEFAULT_TTL_MS): string {
	const id =
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;

	toasts.update((list) => [...list, { id, kind, message }]);

	if (ttlMs > 0) {
		setTimeout(() => {
			if (get(toasts).some((t) => t.id === id)) {
				dismissToast(id);
			}
		}, ttlMs);
	}

	return id;
}

export function toastSuccess(message: string, ttlMs?: number): string {
	return pushToast('success', message, ttlMs);
}

export function toastError(message: string, ttlMs?: number): string {
	return pushToast('error', message, ttlMs);
}

export function toastInfo(message: string, ttlMs?: number): string {
	return pushToast('info', message, ttlMs);
}
