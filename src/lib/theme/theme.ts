export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'gfireui-theme';

export function getPreferredTheme(): Theme {
	if (typeof window === 'undefined') {
		return 'dark';
	}

	return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function getStoredTheme(): Theme | null {
	if (typeof window === 'undefined') {
		return null;
	}

	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === 'light' || stored === 'dark') {
		return stored;
	}

	return null;
}

export function getTheme(): Theme {
	return getStoredTheme() ?? getPreferredTheme();
}

export function applyTheme(theme: Theme): void {
	document.documentElement.setAttribute('data-theme', theme);
}

export function setTheme(theme: Theme): void {
	localStorage.setItem(THEME_STORAGE_KEY, theme);
	applyTheme(theme);
}

export function toggleTheme(): Theme {
	const next = getTheme() === 'light' ? 'dark' : 'light';
	setTheme(next);
	return next;
}
