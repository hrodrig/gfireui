import { env } from '$env/dynamic/public';

/** Bake-time console identity (Hangfire “Extractor” slot — GFire-native). */
export function consoleTitle(): string {
	const raw = env.PUBLIC_GFIREUI_CONSOLE_TITLE?.trim();
	return raw || 'GFire';
}

/** SPA package version baked at build (VERSION file / image ARG). */
export function consoleVersion(): string {
	const raw = env.PUBLIC_GFIREUI_VERSION?.trim();
	return raw || 'dev';
}

export const GFIREUI_REPO = 'https://github.com/hrodrig/gfireui';
