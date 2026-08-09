/** Semantic job-state colors and rail grouping (Claude redesign DNA). */

export const ACTIVE_STATES = ['Enqueued', 'Scheduled', 'Processing', 'Awaiting'] as const;
export const TERMINAL_STATES = ['Succeeded', 'Failed', 'Dead', 'Cancelled', 'Deleted'] as const;

export type SemanticState =
	| (typeof ACTIVE_STATES)[number]
	| (typeof TERMINAL_STATES)[number]
	| 'Attention';

/** CSS custom property name for a state accent (e.g. --state-succeeded). */
export function stateToken(state: string): string {
	return `--state-${state.toLowerCase()}`;
}

/** CSS class fragment for badges: state-succeeded, state-attention, … */
export function stateClass(state: string): string {
	const key = state.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'unknown';
	return `state-${key}`;
}

export function truncateId(id: string): string {
	if (id.length <= 16) return id;
	return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

export function formatClockTime(iso: string | undefined): string {
	if (!iso) return '—';
	const t = Date.parse(iso);
	if (!Number.isFinite(t)) return iso;
	return new Date(t).toLocaleTimeString(undefined, {
		hour: 'numeric',
		minute: '2-digit',
		second: '2-digit'
	});
}
