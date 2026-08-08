import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	THEME_STORAGE_KEY,
	applyTheme,
	getPreferredTheme,
	getStoredTheme,
	getTheme,
	setTheme,
	toggleTheme
} from './theme';

describe('theme', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute('data-theme');
		vi.stubGlobal(
			'matchMedia',
			vi.fn().mockImplementation((query: string) => ({
				matches: query.includes('light'),
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn()
			}))
		);
	});

	it('prefers light when matchMedia says light', () => {
		expect(getPreferredTheme()).toBe('light');
	});

	it('reads and validates stored theme', () => {
		expect(getStoredTheme()).toBeNull();
		localStorage.setItem(THEME_STORAGE_KEY, 'bogus');
		expect(getStoredTheme()).toBeNull();
		localStorage.setItem(THEME_STORAGE_KEY, 'dark');
		expect(getStoredTheme()).toBe('dark');
	});

	it('getTheme prefers stored over system', () => {
		localStorage.setItem(THEME_STORAGE_KEY, 'dark');
		expect(getTheme()).toBe('dark');
	});

	it('setTheme and applyTheme update storage and DOM', () => {
		setTheme('light');
		expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
		expect(document.documentElement.getAttribute('data-theme')).toBe('light');
		applyTheme('dark');
		expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
	});

	it('toggleTheme flips light/dark', () => {
		setTheme('light');
		expect(toggleTheme()).toBe('dark');
		expect(toggleTheme()).toBe('light');
	});
});
