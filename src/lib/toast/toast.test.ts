import { get } from 'svelte/store';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { dismissToast, pushToast, toastSuccess, toasts } from './toast';

describe('toast store', () => {
	afterEach(() => {
		toasts.set([]);
		vi.useRealTimers();
	});

	it('pushes and dismisses toasts', () => {
		const id = toastSuccess('Saved');
		expect(get(toasts)).toHaveLength(1);
		expect(get(toasts)[0]?.message).toBe('Saved');
		dismissToast(id);
		expect(get(toasts)).toHaveLength(0);
	});

	it('auto-dismisses after ttl', () => {
		vi.useFakeTimers();
		pushToast('info', 'Hello', 1000);
		expect(get(toasts)).toHaveLength(1);
		vi.advanceTimersByTime(1000);
		expect(get(toasts)).toHaveLength(0);
	});
});
